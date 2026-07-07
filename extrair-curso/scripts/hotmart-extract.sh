#!/usr/bin/env bash
# hotmart-extract.sh — extrai m3u8 + baixa MP4 de uma aula no Hotmart Player nativo.
# Transação atômica: o token Akamai expira em ~8min, então extrair-e-baixar tem
# que ser uma operação só por aula. Não bate em batch.
#
# Uso:
#   hotmart-extract.sh <iframe-url> <output-mp4> [referer]
#
# Onde:
#   iframe-url  = https://cf-embed.play.hotmart.com/embed/<mediaCode>?...
#                 (pega via cdp.mjs eval no target da page lendo iframe.src)
#   output-mp4  = caminho final do .mp4
#   referer     = URL da aula no Club (default https://hotmart.com/)
#
# Pré-requisito: cookies da page hotmart.com já capturados em arquivo.
#   Salve antes via: node cdp.mjs evalraw <page-target> Network.getCookies \
#                    '{"urls":["https://hotmart.com/"]}' > /tmp/hotmart-cookies.json
#
# Exits:
#   0 sucesso · 2 sem __NEXT_DATA__ ou m3u8 ausente · 3 download falhou

set -uo pipefail

IFRAME_URL="${1:?usage: hotmart-extract.sh <iframe-url> <output> [referer]}"
OUT="${2:?missing output path}"
REFERER="${3:-https://hotmart.com/}"
COOKIES_FILE="${HOTMART_COOKIES_FILE:-/tmp/hotmart-cookies.json}"

if [[ ! -s "$COOKIES_FILE" ]]; then
  echo "hotmart-extract: cookies file ausente: $COOKIES_FILE" >&2
  echo "Capture com: node cdp.mjs evalraw <page-target> Network.getCookies '{\"urls\":[\"https://hotmart.com/\"]}' > $COOKIES_FILE" >&2
  exit 2
fi

COOKIE_HEADER=$(python3 -c "
import json, sys
data = json.load(open('$COOKIES_FILE'))
cookies = data.get('result', {}).get('cookies') or data.get('cookies', [])
print('; '.join(f\"{c['name']}={c['value']}\" for c in cookies))
")

if [[ -z "$COOKIE_HEADER" ]]; then
  echo "hotmart-extract: nenhum cookie extraído de $COOKIES_FILE" >&2
  exit 2
fi

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

HTML=$(curl -sS \
  -H "Cookie: $COOKIE_HEADER" \
  -H "Origin: https://hotmart.com" \
  -H "Referer: $REFERER" \
  -H "User-Agent: $UA" \
  "$IFRAME_URL")

if [[ -z "$HTML" ]]; then
  echo "hotmart-extract: iframe HTML vazio (auth?)" >&2
  exit 2
fi

# Parse __NEXT_DATA__ → mediaAssets[0].url
M3U8=$(python3 -c "
import re, json, sys
html = sys.stdin.read()
m = re.search(r'<script id=\"__NEXT_DATA__\"[^>]*>(.*?)</script>', html, re.S)
if not m:
    sys.exit('no __NEXT_DATA__')
data = json.loads(m.group(1))
assets = data.get('props', {}).get('pageProps', {}).get('applicationData', {}).get('mediaAssets', [])
if not assets:
    sys.exit('no mediaAssets')
url = assets[0].get('url')
if not url:
    sys.exit('no url in mediaAssets[0]')
print(url)
" <<< "$HTML")

PARSE_EXIT=$?
if [[ $PARSE_EXIT -ne 0 || -z "$M3U8" ]]; then
  echo "hotmart-extract: falhou ao extrair m3u8 do __NEXT_DATA__" >&2
  exit 2
fi

echo "hotmart-extract: m3u8 obtido, baixando..." >&2

mkdir -p "$(dirname "$OUT")"

# Trap pra remover MP4 parcial em SIGTERM/SIGINT (pitfall #14: MP4 corrompido
# silencioso). MP4 < 1MB em sucesso é improvável; em interrupção é parcial.
cleanup_partial() {
  if [[ -f "$OUT" ]]; then
    local size
    size=$(stat -f %z "$OUT" 2>/dev/null || stat -c %s "$OUT" 2>/dev/null || echo 0)
    if [[ "$size" -lt 1000000 ]]; then
      rm -f "$OUT"
      echo "hotmart-extract: removido MP4 parcial ($size bytes)" >&2
    fi
  fi
}
trap cleanup_partial INT TERM

ffmpeg -hide_banner -loglevel error -stats \
  -user_agent "$UA" \
  -headers $'Origin: https://cf-embed.play.hotmart.com\r\nReferer: https://cf-embed.play.hotmart.com/\r\n' \
  -i "$M3U8" \
  -c copy \
  -y "$OUT"

FFEXIT=$?
if [[ $FFEXIT -ne 0 || ! -s "$OUT" ]]; then
  echo "hotmart-extract: ffmpeg falhou ($FFEXIT) ou output vazio" >&2
  rm -f "$OUT"  # garante que MP4 parcial corrupto não fique em disco
  exit 3
fi

# Validação final: ffprobe pra garantir MP4 não está corrompido (moov atom missing)
if command -v ffprobe >/dev/null 2>&1; then
  if ! ffprobe -v error -show_entries format=duration "$OUT" >/dev/null 2>&1; then
    echo "hotmart-extract: MP4 gerado é inválido (ffprobe falhou) — removendo" >&2
    rm -f "$OUT"
    exit 3
  fi
fi

trap - INT TERM
exit 0
