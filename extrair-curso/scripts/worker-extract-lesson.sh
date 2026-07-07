#!/usr/bin/env bash
# worker-extract-lesson.sh — extrai 1 aula (vídeo) atomicamente
#
# Cada worker do pool abre nova aba no Chrome dedicado, captura iframe URL fresca
# (token Akamai válido), chama hotmart-extract.sh, fecha a aba. Token é capturado
# imediatamente antes do download → sem risco de expirar pelo tempo de fila.
#
# Uso:
#   bash worker-extract-lesson.sh <lesson_url> <output_mp4>
#
# Pré-requisito:
#   $CDP_PORT_FILE exportado apontando pro DevToolsActivePort do Chrome dedicado

set -uo pipefail

LESSON_URL="${1:?usage: worker-extract-lesson.sh <lesson_url> <output_mp4>}"
OUTPUT_MP4="${2:?missing output_mp4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# CDP_PORT_FILE fallback: se não veio do parent (caso comum quando rodando via
# pool-runner que usa `bash -c` em subshell limpo), aponta pro path padrão do
# Chrome dedicado spawned por spawn-or-attach-chrome.sh.
export CDP_PORT_FILE="${CDP_PORT_FILE:-$HOME/.cache/extrair-curso/chrome-profile/DevToolsActivePort}"

if [[ ! -s "$CDP_PORT_FILE" ]]; then
  echo "worker-extract-lesson: CDP_PORT_FILE inválido ($CDP_PORT_FILE) — Chrome dedicado não está rodando?" >&2
  echo "Rode primeiro: bash $SCRIPT_DIR/spawn-or-attach-chrome.sh" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUTPUT_MP4")"

# Trap pra limpar MP4 parcial se worker for morto (SIGTERM/SIGINT)
# evita pitfall #14: MP4 corrompido passando silencioso pra fase de transcrição
cleanup_partial() {
  if [[ -f "$OUTPUT_MP4" ]]; then
    local size
    size=$(stat -f %z "$OUTPUT_MP4" 2>/dev/null || stat -c %s "$OUTPUT_MP4" 2>/dev/null || echo 0)
    if [[ "$size" -lt 1000000 ]]; then
      rm -f "$OUTPUT_MP4"
      echo "worker-extract-lesson: removido MP4 parcial ($size bytes) em $OUTPUT_MP4" >&2
    fi
  fi
}
trap cleanup_partial EXIT INT TERM

# Abre nova aba na URL da aula
OPEN_OUT=$(node "$SCRIPT_DIR/cdp.mjs" open "$LESSON_URL" 2>&1)
TARGET=$(echo "$OPEN_OUT" | grep -oE '[A-F0-9]{8}' | head -1)

if [[ -z "$TARGET" ]]; then
  echo "worker-extract-lesson: falha ao abrir aba — $OPEN_OUT" >&2
  exit 3
fi

# Espera iframe Hotmart Player carregar (até 15s)
IFRAME_URL=""
for i in $(seq 1 30); do
  sleep 0.5
  IFRAME_URL=$(node "$SCRIPT_DIR/cdp.mjs" eval "$TARGET" "[...document.querySelectorAll('iframe')].find(f => f.src.includes('cf-embed.play.hotmart'))?.src || ''" 2>&1 | tr -d '"' | grep -oE 'https://cf-embed[^ ]*' | head -1)
  [[ -n "$IFRAME_URL" ]] && break
done

if [[ -z "$IFRAME_URL" ]]; then
  echo "worker-extract-lesson: iframe Hotmart não apareceu em 15s na URL $LESSON_URL (target $TARGET)" >&2
  # Fecha aba mesmo em erro
  node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Target.closeTarget "{\"targetId\":\"$TARGET\"}" >/dev/null 2>&1 || true
  exit 4
fi

# Captura cookies hotmart.com (uma vez por aba)
node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Network.enable '{}' >/dev/null 2>&1
node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Network.getCookies '{"urls":["https://hotmart.com/"]}' > "/tmp/hotmart-cookies-$$.json" 2>&1

# Chama hotmart-extract.sh com iframe URL fresca
HOTMART_COOKIES_FILE="/tmp/hotmart-cookies-$$.json" \
  bash "$SCRIPT_DIR/hotmart-extract.sh" "$IFRAME_URL" "$OUTPUT_MP4" "$LESSON_URL"
RC=$?

# Cleanup: fecha aba + remove cookies temp
node "$SCRIPT_DIR/cdp.mjs" evalraw "$TARGET" Target.closeTarget "{\"targetId\":\"$TARGET\"}" >/dev/null 2>&1 || true
rm -f "/tmp/hotmart-cookies-$$.json"

exit $RC
