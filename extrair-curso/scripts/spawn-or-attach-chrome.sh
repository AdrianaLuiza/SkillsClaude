#!/usr/bin/env bash
# spawn-or-attach-chrome.sh — Chrome dedicado isolado pra /extrair-curso
#
# Idempotente: se já tem Chrome dedicado vivo, reusa. Senão spawna.
# Profile separado do Chrome principal do user → não interfere com sessão dele.
# --restore-last-session preserva cookies session-only (TGC/JSESSIONID/etc) entre kills,
#   essencial pra SSO Hotmart e similares (validado empiricamente 2026-05-06).
#
# Uso: bash spawn-or-attach-chrome.sh [<url>]
# Stdout: caminho absoluto do DevToolsActivePort (pra usar em CDP_PORT_FILE)
# Exit: 0 sucesso, 1 erro de spawn, 2 binário Chrome não achado
#
# Cross-platform: detecta Chrome em macOS, Linux, Windows (Git Bash/WSL).

set -uo pipefail

PROFILE_DIR="${EXTRAIR_CURSO_PROFILE:-$HOME/.cache/extrair-curso/chrome-profile}"
DTAP_FILE="$PROFILE_DIR/DevToolsActivePort"
URL="${1:-about:blank}"

mkdir -p "$PROFILE_DIR"

# Detecta binário Chrome
find_chrome() {
  if [[ -n "${EXTRAIR_CURSO_CHROME:-}" ]]; then
    [[ -x "$EXTRAIR_CURSO_CHROME" ]] && echo "$EXTRAIR_CURSO_CHROME" && return 0
  fi
  case "$(uname -s)" in
    Darwin)
      local p="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      [[ -x "$p" ]] && echo "$p" && return 0 ;;
    Linux)
      for c in google-chrome google-chrome-stable; do
        if command -v "$c" >/dev/null 2>&1; then command -v "$c" && return 0; fi
      done ;;
    MINGW*|MSYS*|CYGWIN*)
      for p in \
        "/c/Program Files/Google/Chrome/Application/chrome.exe" \
        "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
        "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"; do
        [[ -x "$p" ]] && echo "$p" && return 0
      done ;;
  esac
  return 1
}

# Verifica se Chrome dedicado tá vivo: DevToolsActivePort existe E processo escutando
is_alive() {
  [[ -s "$DTAP_FILE" ]] || return 1
  local port
  port=$(head -1 "$DTAP_FILE" 2>/dev/null)
  [[ "$port" =~ ^[0-9]+$ ]] || return 1
  # Tenta conectar — curl com timeout curto
  curl -sf --max-time 2 "http://localhost:$port/json/version" >/dev/null 2>&1
}

if is_alive; then
  echo "$DTAP_FILE"
  exit 0
fi

# Limpa DevToolsActivePort stale (Chrome morto deixou o arquivo)
rm -f "$DTAP_FILE"

CHROME=$(find_chrome) || {
  echo "spawn-or-attach-chrome: Chrome não achado. Defina EXTRAIR_CURSO_CHROME=/caminho/pro/chrome." >&2
  exit 2
}

# nohup + setsid (Linux) ou disown (mac/bash) pra desacoplar do shell
"$CHROME" \
  --user-data-dir="$PROFILE_DIR" \
  --remote-debugging-port=0 \
  --restore-last-session \
  --no-first-run \
  --no-default-browser-check \
  "$URL" \
  >/dev/null 2>&1 &
disown 2>/dev/null || true

# Espera DevToolsActivePort aparecer (até 10s)
for i in $(seq 1 20); do
  sleep 0.5
  if is_alive; then
    echo "$DTAP_FILE"
    exit 0
  fi
done

echo "spawn-or-attach-chrome: Chrome iniciou mas DevToolsActivePort não apareceu em 10s." >&2
exit 1
