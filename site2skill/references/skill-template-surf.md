# Template para skill gerada pelo /site2skill (modo surf — curl_cffi + Cloudflare)

Use este template quando o site **tem Cloudflare, MAS não tem CSRF rotativo nem Bearer mintado no frontend** — ou seja, a autenticação é só por cookies de sessão, e o único empecilho é o Cloudflare barrar clientes que não parecem um Chrome de verdade.

A diferença pro modo simples: `curl` normal é bloqueado pelo Cloudflare (fingerprint de TLS não parece browser). O `curl_cffi` **impersona o TLS/JA3 do Chrome**, então passa — sem precisar Chrome rodando. Reusa os cookies do HAR, incluindo o `cf_clearance` (o "passe" que o Cloudflare deu ao Chrome real do usuário).

**Quando NÃO usar este template:**
- Site com CSRF rotativo (`X-CSRF-TOKEN`) ou Bearer mintado no frontend → use `skill-template.md` (modo CDP). Surf não renova token.
- Site sem Cloudflare → use `skill-template-simple.md` (curl puro basta).

Substitua tudo entre `{{ }}`. Crie 3 arquivos: `SKILL.md` (com frontmatter), `.env` (cookies incl. `cf_clearance`) e `.gitignore`.

---

```
---
name: {{slug}}
description: >
  Cliente para a API de {{nome-amigavel}} ({{host}}). Use quando o usuário
  quiser {{tipos-de-acao-que-o-site-faz-em-portugues}}. Aceita pedidos em
  português livre. {{exemplos-naturais-de-pedidos}}.
---

# {{nome-amigavel}} — Cliente de API (modo surf, Cloudflare)

**Host principal:** `https://{{host}}`
**Auth:** cookies de sessão lidos de `.env` (incluindo `cf_clearance` do Cloudflare)
**Transporte:** `curl_cffi` impersonando Chrome — passa pelo Cloudflare sem browser rodando

## Pré-requisito

1. **`curl_cffi` num venv da própria skill** (evita o PEP 668 "externally-managed" que quebra `pip install` global em Mac/Linux modernos):

   ```bash
   python3 -m venv ~/.claude/skills/{{slug}}/.venv
   ~/.claude/skills/{{slug}}/.venv/bin/pip install curl_cffi
   ```

   O `surf.py` se re-executa nesse `.venv` sozinho — então `python3 surf.py` funciona mesmo com o Python do sistema sem `curl_cffi`.

2. Arquivo `.env` ao lado deste `SKILL.md` com os cookies da sessão, **incluindo o `cf_clearance`**. Formato:

   ```
   COOKIES="cf_clearance=VALOR; nome_sessao=valor; outro=valor"
   ```

3. **(Opcional) auto-refresh** — instale `browser_cookie3` no venv da skill pra que o `surf.py` **renove os cookies sozinho** ao levar 401/403 (relê do seu Chrome logado):

   ```bash
   ~/.claude/skills/{{slug}}/.venv/bin/pip install browser_cookie3
   ```

   Só faz sentido em skill que roda na **sua máquina** com Chrome logado. Em servidor sem browser, deixe de fora e mantenha o `.env` estável.

## Como funciona (e por que curl_cffi)

O `{{host}}` está atrás do Cloudflare. Um `curl` comum é barrado porque o TLS handshake não parece um navegador. O `curl_cffi` com `impersonate="chrome"` copia o fingerprint TLS/JA3 do Chrome, então o Cloudflare deixa passar — desde que os cookies (principalmente `cf_clearance`) ainda sejam válidos.

`cf_clearance` é o "passe" que o Cloudflare emitiu pro Chrome real do usuário quando ele passou pelo desafio. Ele expira (tipicamente 30 min a algumas horas). Quando expirar, recapture (ver abaixo).

## Como atualizar os cookies (quando expira)

Sintoma: respostas voltam com HTML de desafio do Cloudflare (status 403 ou 503, corpo com "Just a moment...") ou 401/403 da aplicação.

**Se o auto-refresh estiver ligado** (pré-req 3): não precisa fazer nada — ao levar 401/403 o `surf.py` relê os cookies do seu Chrome logado, regrava o `.env` e repete. Basta estar logado no Chrome. (A renovação **espelha** o Chrome; se o próprio login do Chrome expirou, relogue lá primeiro.)

**Manual** (sem browser_cookie3, ou em servidor):
1. Abra o site no Chrome (logado, e deixe o Cloudflare liberar a página)
2. F12 → Application → Cookies → `{{host}}`
3. Copie **todos** os cookies — em especial `cf_clearance` — e atualize `.env`

Ou rode `/site2skill` de novo passando um HAR novo; ele regenera o `.env` com o `cf_clearance` fresco.

> **Importante:** o `cf_clearance` é amarrado ao IP e ao User-Agent que o obteve. Rode a skill **da mesma máquina/rede** onde capturou o HAR, e mantenha o mesmo impersonate (`chrome`). Se trocar de rede, recapture.

## Endpoints

{{tabela-endpoints-do-host-principal}}

### Padrão de execução

Use o helper `surf.py` (gerado junto), que já carrega os cookies do `.env` e impersona Chrome:

```bash
python3 ~/.claude/skills/{{slug}}/surf.py GET "/api/PATH"
```

**Para POST com body JSON:**

```bash
python3 ~/.claude/skills/{{slug}}/surf.py POST "/api/PATH" '{"campo":"valor"}'
```

O helper imprime o JSON da resposta no stdout. Se detectar HTML de desafio Cloudflare, avisa que o `cf_clearance` expirou.

## Tratamento de erro

- **403/503 com "Just a moment..." no corpo** → `cf_clearance` expirou ou está amarrado a outro IP. Veja "Como atualizar os cookies".
- **401/403 JSON da aplicação** → cookie de sessão (login) expirou. Recapture.
- **`COOKIES: unbound variable` / arquivo não encontrado** → `.env` faltando. Recriar via `/site2skill`.
- **`ModuleNotFoundError: curl_cffi`** → rode `pip install curl_cffi`.

## Notas

- `.env` está no `.gitignore` desta skill — **não comite cookies em repositório público**.
- Cookies (e o `cf_clearance`) dão acesso à sua conta e à sua sessão Cloudflare. Tratar como senha.
- Se compartilhar a pasta da skill, **não inclua o `.env`**. A outra pessoa gera o dela rodando `/site2skill`.
```

---

## Arquivo `surf.py` (helper gerado junto)

Crie `~/.claude/skills/{{slug}}/surf.py` com este conteúdo (substitua `{{host}}`):

```python
#!/usr/bin/env python3
"""Cliente surf — curl_cffi impersonando Chrome, cookies de .env (incl. cf_clearance)."""
import os, sys, json, pathlib

HOST = "{{host}}"
HERE = pathlib.Path(__file__).parent

try:
    from curl_cffi import requests
except ImportError:
    # sistema sem curl_cffi (ex.: PEP 668) → re-executa no venv da própria skill.
    # sentinel evita loop (o python do venv costuma ser symlink pro mesmo interpretador).
    _venv_py = HERE / ".venv" / "bin" / "python"
    if _venv_py.exists() and not os.environ.get("_SURF_REEXEC"):
        os.environ["_SURF_REEXEC"] = "1"
        os.execv(str(_venv_py), [str(_venv_py), __file__, *sys.argv[1:]])
    sys.exit("curl_cffi ausente e sem .venv utilizável. Rode:\n"
             f"  python3 -m venv {HERE}/.venv && {HERE}/.venv/bin/pip install curl_cffi")

def load_cookies():
    env = HERE / ".env"
    if not env.exists():
        return ""
    for line in env.read_text().splitlines():
        line = line.strip()
        if line.startswith("COOKIES="):
            return line[len("COOKIES="):].strip().strip('"')
    return ""

def refresh_from_chrome():
    """Relê os cookies do HOST do Chrome e regrava o .env. Retorna a string nova ou None.
    Auto-refresh: precisa de `browser_cookie3` (pip install) e de estar logado no Chrome.
    Só use em skill que roda na SUA máquina — não faz sentido em servidor sem browser."""
    try:
        import browser_cookie3
        cj = browser_cookie3.chrome(domain_name=HOST)
        pairs = [(c.name, c.value) for c in cj]
    except Exception:
        return None
    if not pairs:
        return None
    s = "; ".join(f"{n}={v}" for n, v in pairs)
    (HERE / ".env").write_text('# Cookies auto-renovados do Chrome. Gitignored, tratar como senha.\n'
                               f'COOKIES="{s}"\n')
    return s

def _cookies_dict(s):
    return dict(c.strip().split("=", 1) for c in s.split(";") if "=" in c)

def do_request(method, url, body, cookies_str):
    headers = {"Accept": "application/json", "Referer": f"https://{HOST}/"}
    if body:
        headers["Content-Type"] = "application/json"
    return requests.request(method, url, headers=headers,
                            cookies=_cookies_dict(cookies_str) or None,
                            data=body, impersonate="chrome")

def _is_challenge(r, txt):
    # challenge REAL = status de bloqueio + corpo de interstício. (páginas HTML normais
    # servidas via Cloudflare referenciam 'challenge-platform' e dariam falso-positivo.)
    return r.status_code in (403, 429, 503) and (
        "just a moment" in txt.lower() or "cdn-cgi/challenge" in txt or "cf-mitigated" in txt.lower())

def main():
    if len(sys.argv) < 3:
        sys.exit('uso: surf.py <METHOD> <PATH> [JSON_BODY]')
    method, path = sys.argv[1].upper(), sys.argv[2]
    body = sys.argv[3] if len(sys.argv) > 3 else None
    url = f"https://{HOST}{path}"

    cookies = load_cookies()
    r = do_request(method, url, body, cookies)

    # sessão/cookie expirado → tenta renovar do Chrome e repetir UMA vez
    if r.status_code in (401, 403, 419, 429, 503):
        new = refresh_from_chrome()
        if new and new != cookies:
            print("(sessão expirada — renovei os cookies do Chrome e repeti)", file=sys.stderr)
            r = do_request(method, url, body, new)

    txt = r.text
    if _is_challenge(r, txt):
        sys.exit(f"[{r.status_code}] Cloudflare barrou mesmo após renovar. Abra {HOST} no Chrome (logado).")
    if r.status_code in (401, 403, 419):
        sys.exit(f"[{r.status_code}] não autorizado mesmo após renovar. Faça login em {HOST} no Chrome.")
    print(txt)

if __name__ == "__main__":
    main()
```

---

## Estrutura final dos arquivos gerados

```
~/.claude/skills/{{slug}}/
├── SKILL.md         (com instruções acima)
├── surf.py          (helper curl_cffi, com bootstrap pro .venv)
├── .venv/           (venv com curl_cffi — NÃO COMITAR)
├── .env             (cookies incl. cf_clearance — NÃO COMITAR)
└── .gitignore       (com `.env` e `.venv/` dentro)
```

**Conteúdo do `.gitignore`:**
```
.env
.venv/
```

**Conteúdo do `.env` gerado:**
```bash
# Cookies de sessão de {{nome-amigavel}} (Cloudflare)
# Gerado em {{data}} a partir de HAR
# Inclui cf_clearance — expira em minutos/horas. Recapture quando der desafio Cloudflare.
COOKIES="cf_clearance=valor; cookie_sessao=valor; outro=valor"
```
