#!/usr/bin/env bash
# capture.sh - baixa stream HLS via ffmpeg, áudio-only por padrão.
#
# Uso:
#   capture.sh <m3u8-url> <output-mp3> [cookies] [referer] [user-agent]
#   capture.sh --video <m3u8-url> <output-mp4> [cookies] [referer] [user-agent]
#
# Cookies: string formato Cookie HTTP — "k=v; k2=v2". Vazio se não precisar.
# Referer: URL da página da aula. Maioria dos players valida.
# User-agent: opcional, default Chrome 120.
#
# Sinais de saída:
#   exit 0  : sucesso (output válido)
#   exit 2  : erro de auth (403/401) — cookies provavelmente expiraram
#   exit 3  : output inválido ou vazio (download incompleto)
#   exit 1  : qualquer outro erro do ffmpeg
#
# Stderr é preservado pra inspeção pelo chamador.

set -uo pipefail

MODE="audio"
if [[ "${1:-}" == "--video" ]]; then
  MODE="video"
  shift
fi

URL="${1:?usage: capture.sh [--video] <url> <output> [cookies] [referer] [ua]}"
OUT="${2:?missing output path}"
COOKIES="${3:-}"
REFERER="${4:-}"
UA="${5:-Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}"

mkdir -p "$(dirname "$OUT")"

# Monta string de headers. Cada header termina em \r\n (formato HTTP).
HEADERS=""
[[ -n "$REFERER" ]] && HEADERS+=$'Referer: '"$REFERER"$'\r\n'
[[ -n "$COOKIES" ]] && HEADERS+=$'Cookie: '"$COOKIES"$'\r\n'

STDERR_LOG=$(mktemp -t capture-stderr.XXXXXX)
trap 'rm -f "$STDERR_LOG"' EXIT

if [[ "$MODE" == "audio" ]]; then
  # -vn descarta vídeo, libmp3lame força MP3, 64k é suficiente pra voz.
  ffmpeg -hide_banner -loglevel error -stats \
    -user_agent "$UA" \
    ${HEADERS:+-headers "$HEADERS"} \
    -i "$URL" \
    -vn -c:a libmp3lame -b:a 64k \
    -y "$OUT" 2> >(tee "$STDERR_LOG" >&2)
else
  # -c copy: sem reencode, rápido e sem perda.
  ffmpeg -hide_banner -loglevel error -stats \
    -user_agent "$UA" \
    ${HEADERS:+-headers "$HEADERS"} \
    -i "$URL" \
    -c copy \
    -y "$OUT" 2> >(tee "$STDERR_LOG" >&2)
fi

FFMPEG_EXIT=$?

# Diagnóstico do erro pra retornar exit code semântico
if [[ $FFMPEG_EXIT -ne 0 ]]; then
  if grep -qE '\b40[13]\b|Forbidden|Unauthorized' "$STDERR_LOG"; then
    echo "capture.sh: auth error (cookies provavelmente expiraram)" >&2
    exit 2
  fi
  echo "capture.sh: ffmpeg falhou com exit $FFMPEG_EXIT" >&2
  exit 1
fi

# Sanity check do output: precisa existir, ter > 0 bytes, e ser arquivo de mídia válido.
if [[ ! -s "$OUT" ]]; then
  echo "capture.sh: output vazio ou ausente: $OUT" >&2
  exit 3
fi

# ffprobe valida que é arquivo de mídia legível (detecta truncamento).
# Fallback gracioso se ffprobe estiver quebrado (libs faltando, etc.):
# checa só tamanho mínimo (>50KB pra áudio, >500KB pra vídeo).
if command -v ffprobe >/dev/null; then
  PROBE_OUT=$(ffprobe -v error -show_format "$OUT" 2>&1)
  PROBE_EXIT=$?
  if [[ $PROBE_EXIT -ne 0 ]]; then
    # Distinguir "arquivo inválido" de "ffprobe quebrado"
    if echo "$PROBE_OUT" | grep -qi 'Library not loaded\|symbol not found\|cannot open shared'; then
      echo "capture.sh: ffprobe indisponível, fallback pra tamanho mínimo" >&2
      MIN_SIZE=$([[ "$MODE" == "video" ]] && echo 500000 || echo 50000)
      ACTUAL=$(stat -f %z "$OUT" 2>/dev/null || stat -c %s "$OUT")
      if [[ "$ACTUAL" -lt "$MIN_SIZE" ]]; then
        echo "capture.sh: output suspeito de truncado ($ACTUAL bytes < $MIN_SIZE)" >&2
        exit 3
      fi
    else
      echo "capture.sh: output inválido (não é mídia legível): $OUT" >&2
      exit 3
    fi
  fi
fi

exit 0
