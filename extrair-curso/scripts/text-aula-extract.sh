#!/usr/bin/env bash
# text-aula-extract.sh — extrai aula-texto (sem vídeo) do Hotmart Player.
# Saída: <output-dir>/<basename>.md + <output-dir>/<basename>/<materiais>...
#
# Uso:
#   text-aula-extract.sh <target-id> <output-dir> <basename>
#
# Onde:
#   target-id   = ID da aba do Chrome onde a aula está aberta (cdp.mjs list)
#   output-dir  = diretório raiz do curso (e.g. ~/cursos/brandsdecoded)
#   basename    = prefixo da aula (e.g. aula-02-prompts-para-claude-ai)
#
# Exits:
#   0 sucesso · 1 sem título encontrado · 2 falha CDP

set -uo pipefail

TARGET="${1:?usage: text-aula-extract.sh <target> <outdir> <basename>}"
OUTDIR="${2:?missing output dir}"
BASENAME="${3:?missing basename}"

CDP="$(dirname "$0")/cdp.mjs"

# CDP_PORT_FILE fallback: se não veio do parent (subshell limpo), aponta pro
# Chrome dedicado padrão. Sem isso o cdp.mjs cai no Chrome principal do user.
export CDP_PORT_FILE="${CDP_PORT_FILE:-$HOME/.cache/extrair-curso/chrome-profile/DevToolsActivePort}"

MD_FILE="$OUTDIR/$BASENAME.md"
MAT_DIR="$OUTDIR/$BASENAME"

mkdir -p "$OUTDIR"

TITLE=$(node "$CDP" eval "$TARGET" "document.querySelector('h1.h5._font-weight-bold')?.textContent?.trim()" 2>&1 | tail -1 | tr -d '"')
if [[ -z "$TITLE" || "$TITLE" == "null" ]]; then
  echo "text-aula-extract: título não encontrado" >&2
  exit 1
fi

# Texto principal: container que contém "Informações da aula"
TEXT=$(node "$CDP" eval "$TARGET" "
(() => {
  const t = document.querySelector('h1.h5._font-weight-bold');
  let c = t;
  for (let i = 0; i < 8 && c; i++) {
    c = c.parentElement;
    if (c && /Informações da aula/.test(c.innerText)) return c.innerText;
  }
  return t?.textContent || '';
})()
" 2>&1 | tail +2)

# Conta botões Download — define se há materiais
DL_COUNT=$(node "$CDP" eval "$TARGET" "[...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Download').length" 2>&1 | tail -1)
DL_COUNT=${DL_COUNT//[!0-9]/}
DL_COUNT=${DL_COUNT:-0}

# Lista nomes dos materiais (texto do <li> contendo cada botão)
MATERIAIS_INFO=$(node "$CDP" eval "$TARGET" "
[...document.querySelectorAll('button')]
  .filter(b => b.textContent.trim() === 'Download')
  .map(b => {
    let p = b;
    for (let i = 0; i < 3 && p; i++) { p = p.parentElement; if (p?.tagName === 'LI') break; }
    return p?.innerText.replace(/\nDownload\$/, '').replace(/\n/g, ' | ');
  })
  .join('\n')
" 2>&1 | tail +2 | tr -d '"')

# Escreve markdown
{
  echo "# $TITLE"
  echo ""
  echo "$TEXT" | sed -E "s/^${TITLE}\$//; /^Concluir\$/d; /^\\+ ?[0-9]+\$/d; /^Informações da aula\$/d"
  echo ""
  if [ "$DL_COUNT" -gt 0 ]; then
    echo "## Materiais"
    echo ""
    echo "$MATERIAIS_INFO" | sed 's/^/- /'
  fi
} > "$MD_FILE"

echo "text-aula-extract: ✓ $MD_FILE ($(wc -l < "$MD_FILE") linhas)" >&2

# Materiais via Page.setDownloadBehavior
if [ "$DL_COUNT" -gt 0 ]; then
  mkdir -p "$MAT_DIR"
  node "$CDP" evalraw "$TARGET" Page.enable '{}' >/dev/null 2>&1
  node "$CDP" evalraw "$TARGET" Page.setDownloadBehavior "{\"behavior\":\"allow\",\"downloadPath\":\"$MAT_DIR\"}" >/dev/null 2>&1

  for i in $(seq 0 $((DL_COUNT - 1))); do
    node "$CDP" eval "$TARGET" "[...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Download')[$i]?.click()" >/dev/null 2>&1
    sleep 3
  done

  # Espera todos arquivos terminarem (ausência de .crdownload)
  for w in $(seq 1 20); do
    sleep 1
    PARTIAL=$(ls "$MAT_DIR"/*.crdownload 2>/dev/null | wc -l | tr -d ' ')
    [ "$PARTIAL" = "0" ] && break
  done

  echo "text-aula-extract: ✓ $MAT_DIR ($(ls "$MAT_DIR" | wc -l | tr -d ' ') arquivos)" >&2
fi

exit 0
