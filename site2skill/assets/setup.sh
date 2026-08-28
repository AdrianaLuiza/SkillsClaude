#!/usr/bin/env bash
# site2skill — preflight de pré-requisitos.
# O Claude roda isto no Passo 0; o usuário também pode rodar na mão a qualquer momento.
# NÃO instala nada que exija sudo — só confere o que existe e diz exatamente o que fazer.
# Uso:
#   bash assets/setup.sh                 → só diagnostica o sistema
#   bash assets/setup.sh --skill <slug>  → também cria o .venv da skill gerada e instala as deps

set -u
SLUG=""
[ "${1:-}" = "--skill" ] && SLUG="${2:-}"

echo "== site2skill · preflight =="
echo

# ── 1) Python 3 — OBRIGATÓRIO (parser + skills simple/surf) ───────────────────
PY_OK=0
if command -v python3 >/dev/null 2>&1; then
  PYV=$(python3 -c 'import sys;print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null)
  echo "✅ Python 3 ($PYV) — necessário pro parser e pra rodar as skills geradas (simple/surf)."
  PY_OK=1
  if python3 -m venv --help >/dev/null 2>&1; then
    echo "   ✅ módulo venv disponível (a skill surf monta o próprio ambiente isolado)."
  else
    echo "   ⚠  módulo 'venv' ausente — no Debian/Ubuntu: sudo apt install python3-venv"
  fi
else
  echo "❌ Python 3 NÃO encontrado — este é o ÚNICO pré-req obrigatório."
  echo "   Mac:     xcode-select --install   (ou: brew install python@3.12)"
  echo "   Windows: winget install Python.Python.3.12"
  echo "   Linux:   sudo apt install python3 python3-venv"
fi
echo

# ── 2) Node.js — OPCIONAL (só fallback cdp.mjs do modo CDP desassistido) ──────
if command -v node >/dev/null 2>&1; then
  echo "✅ Node.js ($(node --version)) — habilita o fallback cdp.mjs (modo CDP rodando sem o Claude)."
else
  echo "➖ Node.js ausente — OPCIONAL. Só precisa pro fallback cdp.mjs (modo CDP desassistido)."
  echo "   Se for usar: https://nodejs.org  (ou: brew install node)"
fi
echo

# ── 3) Chrome remote-debugging — OPCIONAL (só cdp.mjs) ────────────────────────
DBG=""
for p in "$HOME/.chrome-cdp-profile/DevToolsActivePort" \
         "$HOME/Library/Application Support/Google/Chrome/DevToolsActivePort" \
         "$HOME/.config/google-chrome/DevToolsActivePort" \
         "$HOME/.config/chromium/DevToolsActivePort"; do
  [ -f "$p" ] && DBG="$p" && break
done
if [ -n "$DBG" ]; then
  echo "✅ Chrome com remote-debugging ligado (porta $(head -1 "$DBG" 2>/dev/null)) — pronto pro cdp.mjs."
else
  echo "➖ Chrome remote-debugging desligado — OPCIONAL. Só pro fallback cdp.mjs."
  echo "   Se for usar: abra chrome://inspect/#remote-debugging no Chrome, ligue o switch e reinicie o Chrome."
fi
echo

# ── 4) Extensão chrome-MCP — não detectável por shell ─────────────────────────
echo "ℹ  Extensão do Chrome (claude-in-chrome / chrome-MCP): NÃO dá pra detectar por aqui."
echo "   Necessária SÓ pra: (a) o Claude capturar um site novo sozinho, ou (b) runtime do modo CDP."
echo "   Sem ela: exporte um HAR manual pelo DevTools (funciona igual, só dá mais trabalho)."
echo

# ── 5) (opcional) bootstrap do .venv de uma skill gerada ──────────────────────
if [ -n "$SLUG" ]; then
  echo "== bootstrap da skill '$SLUG' =="
  if [ "$PY_OK" != "1" ]; then
    echo "❌ sem Python 3 não dá pra criar o venv. Resolva o item 1 primeiro."
  else
    D="$HOME/.claude/skills/$SLUG"
    mkdir -p "$D"
    python3 -m venv "$D/.venv" && \
      "$D/.venv/bin/pip" install -q --upgrade pip >/dev/null 2>&1
    "$D/.venv/bin/pip" install -q curl_cffi browser_cookie3 && \
      echo "✅ .venv criado em $D/.venv com curl_cffi + browser_cookie3" || \
      echo "⚠  falha ao instalar as deps — confira sua conexão."
  fi
  echo
fi

echo "== resumo por caso de uso =="
echo "  • Rodar skill SIMPLES/SURF (headless):   Python 3            ← obrigatório"
echo "  • Auto-captura de site novo:             extensão chrome-MCP  (ou HAR manual)"
echo "  • Modo CDP (token rotativo):             extensão chrome-MCP  OU  Node.js + toggle chrome://inspect"
echo "== preflight concluído =="
