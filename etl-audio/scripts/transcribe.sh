#!/usr/bin/env bash
# transcribe.sh — Transcrição com diarization via Mistral Voxtral
# Uso: bash scripts/transcribe.sh [--srt] <input_audio_or_video> <output_json>
# Requer: MISTRAL_API_KEY, ffmpeg, python3, curl
#
# Outputs (sempre):
#   <output_json>          — raw Voxtral, source of truth
#   <output_json%.json>.md — view LLM/humano (YAML frontmatter + ## [HH:MM:SS] headers)
# Output condicional:
#   <output_json%.json>.srt — só com flag --srt (pra carregar legenda em VLC/IINA)

set -euo pipefail

WANT_SRT=false
if [[ "${1:-}" == "--srt" ]]; then
  WANT_SRT=true
  shift
fi

INPUT="$1"
OUTPUT="$2"
BASE="${OUTPUT%.json}"
MD_OUT="${BASE}.md"
SRT_OUT="${BASE}.srt"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: Arquivo não encontrado: $INPUT" >&2
  exit 1
fi

if [ -z "${MISTRAL_API_KEY:-}" ]; then
  echo "ERROR: MISTRAL_API_KEY não definido." >&2
  exit 1
fi

# Extrai áudio se for vídeo
EXT="${INPUT##*.}"
AUDIO_FILE="$INPUT"
CLEANUP=false

if [[ "$EXT" == "mp4" || "$EXT" == "mov" || "$EXT" == "webm" ]]; then
  AUDIO_FILE="/tmp/etl-audio-extract-$$.mp3"
  echo "Extraindo áudio do vídeo..."
  ffmpeg -y -i "$INPUT" -vn -acodec libmp3lame -q:a 2 "$AUDIO_FILE" 2>/dev/null
  CLEANUP=true
fi

echo "Transcrevendo com Mistral Voxtral (diarization ativada)..."
RESPONSE=$(curl -s "https://api.mistral.ai/v1/audio/transcriptions" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -F "model=voxtral-mini-latest" \
  -F "file=@${AUDIO_FILE}" \
  -F "diarize=true" \
  -F "timestamp_granularities[]=segment" \
  -F "language=pt")

# Cleanup
$CLEANUP && rm -f "$AUDIO_FILE"

# Valida resposta
if ! echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'segments' in d else 1)" 2>/dev/null; then
  echo "ERROR: Resposta inesperada da API:" >&2
  echo "$RESPONSE" | head -10 >&2
  exit 1
fi

# Salva JSON bruto — source of truth
echo "$RESPONSE" | python3 -c "
import sys, json

data = json.load(sys.stdin)
segments = []

for seg in data.get('segments', []):
    segments.append({
        'speaker': seg.get('speaker', 0),
        'text': seg.get('text', '').strip(),
        'start': seg.get('start', 0),
        'end': seg.get('end', 0)
    })

output = {
    'model': data.get('model', 'voxtral-mini-latest'),
    'language': data.get('language', 'pt'),
    'text': data.get('text', ''),
    'segments': segments
}

json.dump(output, sys.stdout, ensure_ascii=False, indent=2)
" > "$OUTPUT"

# Gera MD a partir do JSON — view LLM/humano
WANT_SRT_FLAG=$($WANT_SRT && echo 1 || echo 0)
INPUT_NAME=$(basename "$INPUT")
python3 - "$OUTPUT" "$MD_OUT" "$SRT_OUT" "$WANT_SRT_FLAG" "$INPUT_NAME" <<'PYEOF'
import json, sys, datetime
from pathlib import Path

json_path, md_path, srt_path, want_srt, input_name = sys.argv[1:]
want_srt = want_srt == "1"

data = json.load(open(json_path))
segs = data.get("segments", [])

# Speakers presentes — define se mostra label no header
speaker_ids = sorted({s.get("speaker", 0) for s in segs})
multi_speaker = len(speaker_ids) > 1

duration = segs[-1]["end"] if segs else 0
def fmt_hms(s):
    s = float(s)
    h = int(s // 3600); m = int((s % 3600) // 60); sec = int(s % 60)
    return f"{h:02d}:{m:02d}:{sec:02d}"

def fmt_srt(s):
    s = float(s)
    h = int(s // 3600); m = int((s % 3600) // 60); sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",")

# YAML frontmatter
lines = [
    "---",
    "schema: transcript/v1",
    f'source_file: "{input_name}"',
    f'language: {data.get("language") or "pt"}',
    f"duration_seconds: {round(float(duration), 2)}",
    f"segments_count: {len(segs)}",
    f"speakers_count: {len(speaker_ids)}",
    f'model: {data.get("model", "voxtral-mini-latest")}',
    f"generated_at: {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
    "---",
    "",
    "# Transcrição",
    "",
    f"Duração: {fmt_hms(duration)} · {len(segs)} segmentos" + (f" · {len(speaker_ids)} speakers" if multi_speaker else ""),
    "",
]

for seg in segs:
    ts = fmt_hms(seg["start"])
    text = seg["text"].strip()
    if not text:
        continue
    if multi_speaker:
        lines.append(f"## [{ts}] Speaker {seg.get('speaker', 0)}")
    else:
        lines.append(f"## [{ts}]")
    lines.append(text)
    lines.append("")

Path(md_path).write_text("\n".join(lines), encoding="utf-8")

# SRT condicional
if want_srt:
    srt_lines = []
    for i, seg in enumerate(segs, 1):
        text = seg["text"].strip()
        if not text:
            continue
        srt_lines.append(str(i))
        srt_lines.append(f"{fmt_srt(seg['start'])} --> {fmt_srt(seg['end'])}")
        srt_lines.append(text)
        srt_lines.append("")
    Path(srt_path).write_text("\n".join(srt_lines), encoding="utf-8")
PYEOF

SEGMENT_COUNT=$(python3 -c "import json; d=json.load(open('$OUTPUT')); print(len(d['segments']))")
SPEAKERS=$(python3 -c "import json; d=json.load(open('$OUTPUT')); print(sorted(set(s['speaker'] for s in d['segments'])))")

OUTPUTS="$OUTPUT + $MD_OUT"
$WANT_SRT && OUTPUTS="$OUTPUTS + $SRT_OUT"
echo "OK: $SEGMENT_COUNT segmentos | Speakers detectados: $SPEAKERS"
echo "  → $OUTPUTS"
