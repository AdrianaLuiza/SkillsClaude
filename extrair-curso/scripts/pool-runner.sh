#!/usr/bin/env bash
# pool-runner.sh — executa N comandos em paralelo (Bash 3.2 compatível)
#
# Uso: bash pool-runner.sh <max_parallel> <jobs_file> [<status_dir>]

set -uo pipefail

MAX_PARALLEL="${1:?usage: pool-runner.sh <max_parallel> <jobs_file> [<status_dir>]}"
JOBS_FILE="${2:?missing jobs_file}"
STATUS_DIR="${3:-/tmp/pool-$$}"

[[ ! -s "$JOBS_FILE" ]] && { echo "pool-runner: jobs_file vazio ou não existe" >&2; exit 1; }
mkdir -p "$STATUS_DIR"

# Lê jobs
JOBS=()
while IFS= read -r line; do
  [[ -z "${line// }" ]] && continue
  [[ "${line:0:1}" == "#" ]] && continue
  JOBS+=("$line")
done < "$JOBS_FILE"
TOTAL="${#JOBS[@]}"

[[ "$TOTAL" -eq 0 ]] && { echo "pool-runner: nenhum job válido" >&2; exit 1; }

# Inicializa status
> "$STATUS_DIR/status.txt"
i=0
while [[ $i -lt $TOTAL ]]; do
  echo "$i pending" >> "$STATUS_DIR/status.txt"
  i=$((i + 1))
done

echo "pool-runner: $TOTAL jobs, max $MAX_PARALLEL paralelos, status_dir=$STATUS_DIR"

# Marca status atomicamente via Python
mark_status() {
  local idx="$1"
  local state="$2"
  python3 -c "
import os, fcntl
path = '$STATUS_DIR/status.txt'
with open(path, 'r+') as f:
    fcntl.flock(f, fcntl.LOCK_EX)
    lines = f.readlines()
    while len(lines) <= $idx: lines.append('')
    lines[$idx] = '$idx $state\n'
    f.seek(0); f.truncate()
    f.writelines(lines)
" 2>/dev/null || true
}

# Executa job em background, gerencia status
run_job() {
  local idx="$1"
  local cmd="${JOBS[$idx]}"
  local log="$STATUS_DIR/job-$(printf '%04d' "$idx").log"
  local start end dur

  start=$(date +%s)
  echo "[start $idx] $(date '+%H:%M:%S')"
  mark_status "$idx" "running"
  bash -c "$cmd" > "$log" 2>&1
  local rc=$?
  end=$(date +%s)
  dur=$((end - start))

  if [[ "$rc" -eq 0 ]]; then
    echo "[OK $idx dur=${dur}s]"
    mark_status "$idx" "done $dur"
  else
    echo "[FAIL $idx exit=$rc dur=${dur}s log=$log]"
    mark_status "$idx" "fail $dur exit=$rc"
  fi
}

# Pool: dispara até MAX_PARALLEL, espera slot livre via polling
NEXT=0
while [[ $NEXT -lt $TOTAL ]]; do
  # Conta jobs ativos olhando status.txt
  RUNNING=$(grep -c ' running$' "$STATUS_DIR/status.txt" 2>/dev/null || echo 0)
  RUNNING=${RUNNING//[^0-9]/}
  RUNNING=${RUNNING:-0}

  if [[ $RUNNING -lt $MAX_PARALLEL ]]; then
    run_job "$NEXT" &
    NEXT=$((NEXT + 1))
    sleep 0.5
  else
    sleep 2
  fi
done

# Aguarda todos terminarem
wait

# Resumo final
DONE_COUNT=$(grep -c ' done ' "$STATUS_DIR/status.txt" 2>/dev/null || echo 0)
FAIL_COUNT=$(grep -c ' fail ' "$STATUS_DIR/status.txt" 2>/dev/null || echo 0)

echo ""
echo "=== POOL CONCLUÍDO ==="
echo "Total: $TOTAL | OK: $DONE_COUNT | FAIL: $FAIL_COUNT"
echo "Logs: $STATUS_DIR/job-*.log"

[[ "$FAIL_COUNT" -gt 0 ]] && exit 1
exit 0
