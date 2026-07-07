#!/usr/bin/env bash
# discover-courses.sh — pra cada URL de curso, lista aulas e classifica
#
# Uso:
#   bash discover-courses.sh <urls_file> <output_dir>
#
# Onde:
#   urls_file: 1 URL de curso por linha (links pra /products/<id>)
#   output_dir: diretório onde salvar:
#     - <slug-curso>/aula-NN-*.md (aulas-texto extraídas inline)
#     - <slug-curso>/aula-NN-*/  (materiais de aulas-texto)
#     - download-jobs.txt: 1 linha por aula-vídeo (comando worker-extract-lesson)
#
# Sequencial mas rápido — só DOM querying, sem download.

set -uo pipefail

URLS_FILE="${1:?usage: discover-courses.sh <urls_file> <output_dir>}"
OUTDIR="${2:?missing output_dir}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# CDP_PORT_FILE fallback: se não veio do parent, aponta pro Chrome dedicado padrão
export CDP_PORT_FILE="${CDP_PORT_FILE:-$HOME/.cache/extrair-curso/chrome-profile/DevToolsActivePort}"
[[ ! -s "$CDP_PORT_FILE" ]] && { echo "ERROR: CDP_PORT_FILE inválido. Rode spawn-or-attach-chrome.sh primeiro" >&2; exit 2; }

# expand_collapsible_modules: invoca o React onClick handler dos botões de
# módulo (Hotmart Club Content Machine 3.0 e similares). Sem isso, aulas dentro
# de módulos colapsados não aparecem como <a href="/content/..."> e o discovery
# perde 100% das aulas. Detecta botões cujo textContent começa com padrão
# tipo "11. Acesse..." (módulo "1" + título "1. Acesse...") via regex
# /^\d+\d+\./ aplicado em textContent sem espaços.
#
# Usa onClick do React (btn[__reactProps$XX].onClick()) — JS .click() puro
# não dispara o handler React em alguns componentes. Se a página não tem
# módulos colapsáveis, retorna 0 e segue normal.
expand_collapsible_modules() {
  local target="$1"
  node "$SCRIPT_DIR/cdp.mjs" eval "$target" "(() => {
    const btns = [...document.querySelectorAll('button')];
    const moduleButtons = btns.filter(b => {
      const t = b.textContent.trim().replace(/\s+/g, '');
      return /^\d+\d+\.\s*/.test(t) || /^\d+\d+\.[A-Za-zÀ-ÿ]/.test(t);
    });
    let expanded = 0;
    for (const m of moduleButtons) {
      const reactKey = Object.keys(m).find(k => k.startsWith('__reactProps'));
      if (reactKey && typeof m[reactKey].onClick === 'function') {
        try { m[reactKey].onClick(); expanded++; } catch (e) {}
      }
    }
    return expanded;
  })()" 2>&1 | tail -1 | tr -d '\"' || echo 0
}

mkdir -p "$OUTDIR"
JOBS="$OUTDIR/download-jobs.txt"
> "$JOBS"

slugify() {
  python3 -c "
import sys, unicodedata, re
s = sys.argv[1].lower()
s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:80]
print(s)
" "$1"
}

CURSO_NUM=0
TOTAL_URLS=$(wc -l < "$URLS_FILE")

while IFS= read -r URL; do
  [[ -z "$URL" ]] && continue
  CURSO_NUM=$((CURSO_NUM + 1))
  echo ""
  echo "=== [$CURSO_NUM/$TOTAL_URLS] Discovering: $URL ==="

  # Abre nova aba no curso (não reusa aba existente — cada curso tem aba própria pra clean state)
  OPEN_OUT=$(node "$SCRIPT_DIR/cdp.mjs" open "$URL" 2>&1)
  TARGET=$(echo "$OPEN_OUT" | grep -oE '[A-F0-9]{8}' | head -1)
  if [[ -z "$TARGET" ]]; then
    echo "  ERR: falha ao abrir aba" >&2
    continue
  fi
  sleep 5

  node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Network.enable '{}' >/dev/null 2>&1

  # Pega título do curso (cdp.mjs retorna string JSON-quoted ou raw)
  TITLE_RAW=$(node "$SCRIPT_DIR/cdp.mjs" eval "$TARGET" "document.querySelector('h1')?.innerText.trim() || document.title" 2>&1)
  TITLE=$(printf '%s' "$TITLE_RAW" | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
try:
    print(json.loads(raw))
except Exception:
    print(raw.strip('\"'))
" 2>/dev/null || echo "curso-$CURSO_NUM")
  [[ -z "$TITLE" ]] && TITLE="curso-$CURSO_NUM"
  SLUG=$(slugify "$TITLE")
  CURSO_DIR="$OUTDIR/$SLUG"
  mkdir -p "$CURSO_DIR"
  echo "  Título: $TITLE"
  echo "  Slug: $SLUG"

  # Expande módulos colapsáveis ANTES de listar aulas (Hotmart Club Content Machine
  # 3.0 esconde aulas dentro de botões de módulo). Idempotente: se não tem
  # módulos colapsáveis, retorna 0 e segue normal.
  EXPANDED=$(expand_collapsible_modules "$TARGET")
  EXPANDED=${EXPANDED//[^0-9]/}
  if [[ -n "$EXPANDED" && "$EXPANDED" -gt 0 ]]; then
    echo "  Módulos expandidos: $EXPANDED"
    sleep 2  # aguarda re-render dos <a> dentro dos módulos
  fi

  # Lista todas aulas (links /content/) — robusto a ambos formatos de retorno do cdp.mjs
  AULAS_RAW=$(node "$SCRIPT_DIR/cdp.mjs" eval "$TARGET" "[...document.querySelectorAll('a[href*=\"/content/\"]')].map(a => ({text: a.innerText.trim().replace(/\n/g,' | '), href: a.href})).filter((x, i, arr) => arr.findIndex(y => y.href === x.href) === i)" 2>&1)
  printf '%s' "$AULAS_RAW" > "$CURSO_DIR/.aulas-raw.json"

  python3 -c "
import json, sys
raw = open('$CURSO_DIR/.aulas-raw.json').read().strip()
# Tenta parse direto; se falhar, tenta double-decode (caso venha quoted)
try:
    data = json.loads(raw)
    if isinstance(data, str):
        data = json.loads(data)
except Exception as e:
    print(f'parse_error: {e}', file=sys.stderr)
    sys.exit(1)

with open('$CURSO_DIR/.aulas.txt', 'w') as f:
    for a in data:
        f.write(f\"{a['href']}|{a['text']}\n\")
print(f'  Aulas: {len(data)}')
" || { echo "  ERR ao parsear aulas — pulando" >&2; continue; }
  rm -f "$CURSO_DIR/.aulas-raw.json"

  AULA_NUM=0
  while IFS='|' read -r AULA_URL AULA_TEXT; do
    AULA_NUM=$((AULA_NUM + 1))
    AULA_NN=$(printf '%02d' "$AULA_NUM")
    AULA_SLUG=$(slugify "$AULA_TEXT")
    BASENAME="aula-$AULA_NN-$AULA_SLUG"

    # Navega pra aula nessa mesma aba
    node "$SCRIPT_DIR/cdp.mjs" nav "$TARGET" "$AULA_URL" >/dev/null 2>&1
    sleep 5

    # Classifica
    CLS=$(node "$SCRIPT_DIR/cdp.mjs" eval "$TARGET" "({hasIframe: !![...document.querySelectorAll('iframe')].find(f => f.src.includes('cf-embed.play.hotmart')), dlCount: [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Download').length, hasContent: document.body.innerText.length > 500})" 2>&1)

    HAS_IFRAME=$(echo "$CLS" | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['hasIframe'])" 2>/dev/null || echo "false")

    if [[ "$HAS_IFRAME" == "True" ]] || [[ "$HAS_IFRAME" == "true" ]]; then
      # VÍDEO — enfileira download
      OUT_MP4="$CURSO_DIR/$BASENAME.mp4"
      if [[ -f "$OUT_MP4" ]]; then
        echo "    [$AULA_NN] vídeo (já existe, skip)"
      else
        echo "    [$AULA_NN] vídeo → enfileirado"
        echo "bash '$SCRIPT_DIR/worker-extract-lesson.sh' '$AULA_URL' '$OUT_MP4'" >> "$JOBS"
      fi
    else
      # TEXTO — extrai inline
      if [[ -f "$CURSO_DIR/$BASENAME.md" ]]; then
        echo "    [$AULA_NN] texto (já existe, skip)"
      else
        bash "$SCRIPT_DIR/text-aula-extract.sh" "$TARGET" "$CURSO_DIR" "$BASENAME" 2>&1 | tail -1 | sed 's/^/    /'
      fi
    fi
  done < "$CURSO_DIR/.aulas.txt"

  # Fecha aba do curso (já não precisa mais)
  node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Target.closeTarget "{\"targetId\":\"$TARGET\"}" >/dev/null 2>&1 || true
  rm -f "$CURSO_DIR/.aulas.txt"

done < "$URLS_FILE"

echo ""
echo "=== Discovery concluído ==="
echo "Jobs de download enfileirados: $(wc -l < "$JOBS")"
echo "Arquivo: $JOBS"
