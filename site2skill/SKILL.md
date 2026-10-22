---
name: site2skill
description: >
  Cria automaticamente uma skill cliente de API para qualquer site web. Use
  sempre que o usuário invocar /site2skill, ou disser "cria uma skill pra
  [site]", "quero integrar com [site]", "analisa o tráfego de [site]". O
  fluxo: usuário exporta um arquivo HAR pelo DevTools do Chrome dele, Claude
  parseia o HAR e gera a skill. O parser detecta automaticamente se o site
  tem Cloudflare/CSRF e escolhe entre 3 modos: (1) modo simples — curl com
  cookies em .env, sem Chrome rodando; (2) modo surf — curl_cffi impersonando
  Chrome, pra sites com Cloudflare mas sem CSRF/Bearer rotativo; (3) modo CDP —
  Chrome real faz as chamadas, pra sites com CSRF rotativo ou Bearer mintado.
---

# site2skill — gerador de skill conversacional

A skill é **conversacional**, não baseada em flags. O fluxo é uma conversa em português entre você (Claude) e o usuário. Você guia, captura, gera. O usuário não precisa saber o que é HAR, endpoint, fetch, ou cookie.

## Princípio chave

A skill gerada **nunca armazena cookies ou tokens**. Ela manda o Chrome (que já está logado) executar `fetch()` dentro da aba do site. Cookies + TLS + auth são providos pelo browser. Isso resolve Cloudflare, sessão expirada e tokens rotativos automaticamente.

---

## Passo 0 — preflight (rode ANTES de tudo)

Rode o preflight, que confere **todos** os pré-requisitos e diz o que é obrigatório vs opcional por caso de uso (Python, Node, toggle CDP, extensão):

```bash
bash assets/setup.sh
```

- **Python 3** é o único **obrigatório** (parser + skills simple/surf). Se faltar, o script mostra como instalar (Mac `xcode-select --install`; Windows `winget install Python.Python.3.12`; Linux `apt install python3 python3-venv`).
- Node.js, toggle `chrome://inspect` e extensão chrome-MCP são **opcionais** — só entram nos modos CDP / auto-captura. O preflight sinaliza cada um.

**Ao gerar uma skill surf/simple**, rode o bootstrap do venv da skill filha num comando (cria `.venv` + instala `curl_cffi` e `browser_cookie3`):

```bash
bash assets/setup.sh --skill <slug>
```

> **Não confunda:** o `/site2skill` só *gera*. Os pré-requisitos de **runtime** de cada skill gerada ficam documentados na própria skill filha (os templates cobrem). O preflight aqui é pra desbloquear a geração e o bootstrap.

### No Windows

Rode tudo pelo **Git Bash** (a ferramenta Bash do Claude já é Git Bash), assim `python3`, `~/` e os scripts `.sh` funcionam igual. Diferenças:

- **venv:** os executáveis ficam em `.venv/Scripts/` (não `.venv/bin/`). Onde este guia disser `.venv/bin/pip` ou `.venv/bin/python`, use `.venv/Scripts/pip` / `.venv/Scripts/python`. O `setup.sh --skill` e o `surf.py` do template já detectam isso sozinhos.
- **Auto-refresh de cookie (`browser_cookie3`) não funciona:** o Chrome no Windows criptografa os cookies com uma chave ligada ao próprio app, que outros programas não conseguem ler. Pule o passo opcional de auto-refresh; a renovação é sempre por HAR manual.
- **Modo CDP:** prefira a extensão chrome-MCP. O fallback `cdp.mjs` já acha o `DevToolsActivePort` em `%LOCALAPPDATA%\Google\Chrome\User Data\`.
- **Arquivos temporários:** use uma pasta de caminho curto (ex.: `~/AppData/Local/Temp/<slug>`) em vez de `/tmp`. O Windows não cria `.venv` em caminhos muito longos (erro `WinError 206`).
- **Paths que começam com `/`:** o Git Bash converte um argumento como `"/api/x"` em `C:/Program Files/Git/api/x` antes de passá-lo a programas do Windows. O `surf.py` do template já desfaz isso. Em outros comandos (ex.: `curl` com path relativo, `bundle_scrape.py --prefix /api/`), prefixe com `MSYS_NO_PATHCONV=1`.

---

## Fluxo conversacional (passo a passo)

### Passo 1 — pedir o HAR

Pergunte ao user uma vez:

> "Pra capturar o tráfego, exporta um arquivo HAR do seu Chrome. Faz assim:
>
> 1. Abre o site no seu Chrome (logado, se for área autenticada)
> 2. Aperta **F12** pra abrir o DevTools
> 3. Clica na aba **Network**
> 4. Marca a checkbox ✅ **Preserve log** (importante!)
> 5. Limpa o log com 🚫 (canto superior esquerdo)
> 6. Navega no site fazendo as ações que você quer expor pro agente: busca, abre detalhes, vê pedidos. (1-3 min)
> 7. Botão direito em qualquer linha → **Save all as HAR with content**
> 8. Salva o arquivo (vai pro Downloads) e me passa o caminho"

Espere o user mandar o caminho. Quando mandar, pule direto pro Passo 2 (parse).

**Por que sempre o Chrome REAL do user (nunca perfil dedicado):**
- Chrome principal do user já tem trust score do Cloudflare (cookies, JS challenges resolvidos historicamente). Bot Fight Mode não dispara — coisa que dogfood real em 2026-05-04 mostrou ser problema crítico em sites BR (Clubinho de Ofertas bloqueou perfil dedicado de cara).
- Login real do user, com 2FA/captcha já resolvidos no histórico do Chrome principal.
- HAR contém TUDO: requests + responses + headers + cookies + timing. Nada se perde.
- Aluno pode revisar o HAR antes de mandar, pra checar dado sensível.
- Funciona em qualquer OS sem precisar Chrome dedicado.

> **Regra de ouro:** tanto o HAR manual quanto a auto-captura (abaixo) rodam no **Chrome principal, logado, do usuário**. Nunca use um perfil Chrome dedicado/limpo (o antigo `capture.mjs` fazia isso e tomava bloqueio do Cloudflare; foi removido). É o trust score do Chrome real que faz o Cloudflare deixar passar.

**"Save all as HAR with content"** vs **"Save as HAR"** simples: a primeira inclui response bodies, a segunda não. **Sempre peça a "with content"** — sem o body de response, o parser não consegue inferir shapes.

### Passo 1-alt — auto-captura no Chrome real (opcional, via chrome-MCP)

Se o chrome-MCP estiver disponível (tools `mcp__claude-in-chrome__*`), você pode **capturar sozinho**, sem o usuário mexer no DevTools. O chrome-MCP anexa ao **Chrome real do usuário** (mesmo trust score do HAR manual — não é perfil dedicado), então não reintroduz o bloqueio do Cloudflare.

Ofereça: "Posso capturar direto no seu Chrome, sem você exportar nada. Só preciso que você esteja logado no site. Topa?" Se sim:

1. **Abra/foque a aba do site** no Chrome real: `mcp__claude-in-chrome__navigate` (ou `tabs_create_mcp`) pra `https://{site}`. Confirme que o user está logado (senão, peça pra logar).
2. **Faça as ações que expõem a API** (buscar, abrir detalhes, listar pedidos) — dirigindo você mesmo via `computer`/`find`/`form_input`, ou pedindo pro user clicar por 1-2 min enquanto você observa.
3. **Descubra os endpoints** com `mcp__claude-in-chrome__read_network_requests` — ele traz URL, método e status de cada chamada. Filtre trackers e resource types Image/Font/Media/Stylesheet.
4. **Pegue os bodies reais** re-executando cada endpoint GET **dentro da aba** via `mcp__claude-in-chrome__javascript_tool` (REPL com top-level await):
   ```js
   const r = await fetch('/api/PATH', {headers:{Accept:'application/json'}});
   ({ status:r.status, ct:r.headers.get('content-type'), cfray:r.headers.get('cf-ray'), server:r.headers.get('server'), body:(await r.text()).slice(0,2000) })
   ```
   O `fetch` same-origin volta o body real (testado: retornou o JSON de verdade) **e** os headers de resposta — inclusive `cf-ray`/`server`, que o parser usa pra detectar Cloudflare.
5. **Monte um HAR** `{"log":{"entries":[...]}}` juntando URL/método (passo 3) + status/headers/body (passo 4). Cada entry: `request:{method,url,headers}` e `response:{status,headers:[{name,value}],content:{text}}`. Rode o parse (Passo 2).

**Duas limitações medidas (por isso o fallback é obrigatório, não opcional):**
- **Valor de cookie:** a extensão **bloqueia** a leitura de cookie (`document.cookie` → `[BLOCKED]`). Ela nunca te dá o `cf_clearance`/sessão literais. Pra o modo **CDP** isso não importa (o `fetch` na aba carrega os cookies sozinho). Mas pra o modo **surf**, que precisa do cookie **escrito no `.env`**, a auto-captura **não serve** → cair pro **HAR manual** ("with content"), que traz o header `Cookie` real.
- **Bodies parciais:** se algum endpoint não puder ser re-fetchado (POST com efeito colateral, ou 401), o shape daquele fica mais fraco (o parser degrada, não quebra).

Resumo: auto-captura pela extensão = ótima pra **descobrir endpoints e gerar skill CDP**. Pra **surf** (ou qualquer coisa que precise do valor do cookie), **HAR manual é o padrão-ouro**.

### Passo 2 — parsear e decidir o modo

```bash
python3 ~/.claude/skills/site2skill/scripts/parse_har.py <caminho-do-har>
```

O parser retorna:
- `main_host` — host principal da API (ranqueado por presença de `Authorization: Bearer`, com fallback pra contagem de calls em `/api/`; trackers como usermaven/contentsquare/posthog/linkedin já são excluídos)
- `recommended_mode` — **`simple`**, **`surf`** ou **`cdp`**
- `detection.has_cloudflare` — header `cf-ray` ou `server: cloudflare`
- `detection.has_csrf_header` — `X-CSRF-TOKEN` em alguma request
- `detection.has_bearer` — Bearer JWT em alguma request do main_host
- `detection.auth_flow` — `cookie` / `csrf` / `bearer-mint` / `unknown`
- `detection.auth_provider` — `auth0` / `okta` / `cognito` / etc (decodificado do `iss` do JWT)
- `detection.auth_audience` — `aud` do JWT (host alvo do token)
- `detection.response_shape` — `array` / `paginated` / `object` (sample de uma response GET)
- `detection.mint_endpoint` — endpoint que minta o Bearer (inferido por timeline; pode vir `null` se não detectado, aí Claude precisa sondar `/api/access-token`, `/api/auth/me`, etc.)
- `detection.has_clearance_cookie` — se o HAR trouxe um `cf_clearance` (o "passe" do Cloudflare). Sem ele, o modo `surf` provavelmente não passa — recapture pedindo pro user deixar o Cloudflare liberar a página antes de salvar o HAR.
- `detection.client_pattern` — `proxy-envelope` / `graphql` / `rest`. Padrão do cliente que muda como as chamadas são montadas (ver Passo 3.5).
- `detection.proxy_envelope` — quando o site roteia tudo por um endpoint único com uma chave de roteamento no body (`{proxy_url, routes}`); `null` se não for o caso.
- `detection.graphql` — quando o site usa GraphQL (`{is_graphql, endpoint, persisted_queries, operations}`); `null` caso contrário.
- `detection.reason` — frase em PT explicando a escolha
- `endpoints[]` — método, path parametrizado, status codes, `is_third_party`
- `auth.session_cookies` — cookies de sessão **filtrados pelo domínio do main_host** (não polui com cookies de tracker)
- `auth.bearer_sample_payload` — payload do Bearer decodificado (útil pra ver `iss`, `aud`, `exp`)

**Decisão de modo (o parser já aplica isto; a ordem importa):**
- `cdp` se: `has_csrf_header` OR `auth_flow == 'bearer-mint'` — token rotativo, só o Chrome renova
- `surf` se: `has_cloudflare` (e não caiu em `cdp`) — Cloudflare barra curl comum, mas cookies bastam; `curl_cffi` impersona o Chrome
- `simple` caso contrário — sem Cloudflare nem token rotativo, curl puro basta

> **Por que surf antes de "Cloudflare → CDP":** manter o Chrome rodando é frágil (aba tem que ficar aberta e logada). Se a auth é só cookie e o único obstáculo é o Cloudflare, o `curl_cffi` impersonando Chrome + `cf_clearance` do HAR resolve sem browser. CDP fica reservado pra quando o token **rotaciona** (CSRF/Bearer mintado), aí não tem como reusar cookie estático.

**Mostre o modo detectado pro usuário em uma frase**, ex:
> "Site usa Cloudflare + CSRF rotativo → modo CDP (Chrome faz as chamadas)."
> "Site usa Cloudflare, auth só por cookie → modo surf (curl_cffi impersona Chrome, sem browser rodando)."
> "Site sem Cloudflare nem CSRF → modo simples (curl com cookies, sem Chrome)."
> "Site usa Auth0 com Bearer JWT mintado → modo CDP (frontend mint do token, mais simples reusar a aba)."

Se o modo for `surf` mas `has_clearance_cookie == false`, avise: "Detectei Cloudflare mas o HAR não trouxe o `cf_clearance`. Sem ele o curl_cffi pode ser barrado — refaça o HAR deixando a página carregar por completo (o Cloudflare libera e grava o cookie) antes de salvar."

### Passo 2.5 — descobrir mint_endpoint quando vier `null` (modo CDP com bearer-mint)

Se `auth_flow == 'bearer-mint'` mas `mint_endpoint` veio `null`, sondar paths típicos de mint **dentro da aba autenticada via CDP** antes de gerar a skill (assim a skill já fica documentando o endpoint correto). Padrões frequentes:

- `@auth0/nextjs-auth0`: `/api/access-token`, `/api/auth/access-token`, `/api/auth/me` (este último expõe perfil, não token)
- `next-auth`: `/api/auth/session`
- Custom: `/api/token`, `/api/auth/token`

Com a aba aberta, rodar uma sonda:

```bash
~/.claude/skills/site2skill/scripts/cdp.mjs eval <target> "
(async () => {
  const tries = ['/api/access-token','/api/auth/access-token','/api/auth/session','/api/auth/me','/api/token'];
  const out = {};
  for (const p of tries) {
    const r = await fetch(p);
    out[p] = { status: r.status, body: (await r.text()).slice(0,200) };
  }
  return out;
})()
"
```

O endpoint que retornar `{accessToken: "..."}` é o mint correto. Documentar na skill gerada.

**Lição registrada (Pluggy, 2026-05-04):** `/api/connect-token` parece auth mas é só pro Pluggy Connect widget (escopo limitado). O endpoint real do user-API era `/api/access-token`. Ao gerar a skill, adicionar nota explícita: "**Não confundir** com `/api/connect-token`/`/api/auth/me`/etc — esses não autorizam chamadas autenticadas no main_host."

### Passo 2.7 — varredura de bundle (descobrir endpoints escondidos) — opcional mas recomendado

O HAR só vê o que foi navegado. O **JS compilado do site conhece TODAS as rotas** — inclusive as que nenhum clique alcança (checkout, área logada, admin). Vale rodar sempre que quiser cobertura além do que foi clicado:

```bash
python3 ~/.claude/skills/site2skill/scripts/bundle_scrape.py "https://<main_host>" --prefix /api/ --verify
```

- `--prefix` = prefixo(s) que o parser viu nos endpoints do HAR (repita pra cada, ex.: `--prefix /api/ --prefix /v1/`). Aumenta a precisão (bate rota do bundle com o que já se sabe ser API).
- `--verify` = sonda as rotas **GET estáticas** (sem `{id}`) via `curl_cffi` e marca `{status, json}`. Rotas com `{id}` ou POST ficam `verified: null` (não dá pra sondar sem param/efeito colateral).
- **Cloudflare:** o script usa `curl_cffi` (mesmo do surf). Rode no venv que tem ele (ex.: `~/.claude/skills/<slug>/.venv/bin/python …`; no Windows `.venv/Scripts/python`), senão cai pro `urllib` e toma 403 em site protegido.

O script segue os **chunks de code-splitting** (Vite/webpack) por BFS — é onde a API mora nas SPAs modernas, não no `app.js`.

**Como usar o resultado (seja honesto sobre a proveniência):**
- `from_call: true` → a rota veio de um `fetch()/axios` real no código → **alta confiança**.
- `verified: {json:true}` → sondada e respondeu JSON → **confirmada alcançável**.
- Rota só no bundle, sem verify → **descoberta, não observada**. Inclua na skill **marcada como "não testada"** (o método pode estar errado, pode exigir login). Nunca apresente como confirmada.
- **Reconcilie com o HAR:** uma rota do bundle tipo `/api/{id}/price/{id}` costuma ser a mesma que o HAR observou concreta (`/api/rio-de-janeiro/price/2682`). Use o exemplo real do HAR pra documentar; o bundle só confirma o shape/param.

**Verificar endpoints AUTENTICADOS ao vivo (alternativa ao HAR manual, pros GET):** se o chrome-MCP está disponível e o usuário está logado na aba, dá pra confirmar os endpoints logados **sem extrair cookie**: rode cada path descoberto como `fetch()` na aba (o browser anexa a sessão). Foi assim que a superfície logada do Clubinho foi confirmada (`/api/my-account/orders/{id}` → JSON real). Regras:
- **Só leitura.** Nunca dispare os de escrita (`checkout/order`, `add-to-cart`, `*/reverse`, `apply-discount-code`) — um `fetch` neles cria pedido/estorna de verdade. Deixe mapeados, não testados.
- **Precisa de um `{id}` real.** Pegue navegando na área logada (ex.: a página "Meus pedidos" mostra os ids).
- **Lista SSR:** se o path de "lista" volta **HTML** em vez de JSON (ex.: `/minha-conta/pedidos` no Clubinho, um Laravel), não há API de lista — a página é renderizada no servidor. Documente que a lista sai de parsear o HTML, e que os endpoints JSON são só de **detalhe** (`/orders/{id}`).
- Isso confirma método + shape, mas pra rodar **headless** (surf.py) ainda é preciso o cookie no `.env` (HAR manual). O fetch-na-aba serve pra *confirmar*; o headless precisa do cookie.

### Passo 3 — gerar a skill auto-contida

Crie a pasta:

```bash
mkdir -p ~/.claude/skills/<slug>
```

**Se `recommended_mode == "simple"`:**

Use `references/skill-template-simple.md`. Crie 3 arquivos:

1. `~/.claude/skills/<slug>/SKILL.md` — preencher template com endpoints e curls prontos
2. `~/.claude/skills/<slug>/.env` — `COOKIES="nome1=valor1; nome2=valor2; ..."` (montado a partir de `auth.session_cookies` do parser)
3. `~/.claude/skills/<slug>/.gitignore` — uma linha: `.env`

Avise o usuário: "Cookies estão em `.env` (gitignored). Quando expirar (401/403), rode `/site2skill` de novo."

**Se `recommended_mode == "surf"`:**

Use `references/skill-template-surf.md`. Crie os arquivos:

1. `~/.claude/skills/<slug>/SKILL.md` — preencher template com endpoints
2. `~/.claude/skills/<slug>/surf.py` — helper `curl_cffi` do template (substituir `{{host}}`)
3. `~/.claude/skills/<slug>/.env` — `COOKIES="cf_clearance=...; sessao=...; ..."` — **inclua o `cf_clearance`** de `auth.session_cookies` (o parser já classifica cookies Cloudflare como sessão). Se só houver endpoints públicos (nenhum cookie necessário), use `COOKIES=""` e documente que os autenticados precisam de HAR manual.
4. `~/.claude/skills/<slug>/.gitignore` — duas linhas: `.env` e `.venv/`
5. **Crie o `.venv` e instale o `curl_cffi`** (o `surf.py` se re-executa nele — evita o PEP 668):
   ```bash
   python3 -m venv ~/.claude/skills/<slug>/.venv && ~/.claude/skills/<slug>/.venv/bin/pip install curl_cffi
   # Windows: ~/.claude/skills/<slug>/.venv/Scripts/pip install curl_cffi   (ou só: bash assets/setup.sh --skill <slug>)
   ```
   Depois **rode um smoke test você mesmo** (`python3 ~/.claude/skills/<slug>/surf.py GET "<endpoint-público-real>"`) e confirme que volta JSON antes de entregar.
6. **(Opcional, só pra skill que roda na máquina do usuário) auto-refresh de cookie:** instale `browser_cookie3` no venv (`~/.claude/skills/<slug>/.venv/bin/pip install browser_cookie3`). Aí o `surf.py` renova os cookies sozinho ao levar 401/403, relendo do Chrome logado. Em servidor sem browser, pule — mantenha o `.env` estável. **No Windows, pule sempre** (o `browser_cookie3` não lê os cookies do Chrome lá).

> **O cookie do surf SEMPRE vem de HAR manual, nunca da auto-captura.** A extensão chrome-MCP bloqueia a leitura de valor de cookie (`[BLOCKED]`, medido) — ela não te dá o `cf_clearance` literal. Então, se você chegou no modo surf via auto-captura pela extensão, peça agora o **HAR manual** ("Save all as HAR with content") só pra montar o `.env`. Sem o HAR manual não há como preencher os cookies do surf.

Avise o usuário: "Cookies (incluindo o passe do Cloudflare `cf_clearance`) estão em `.env`. O `cf_clearance` expira rápido (minutos a horas) e é amarrado ao seu IP — quando der desafio Cloudflare, rode `/site2skill` de novo. Precisa de `pip install curl_cffi`."

**Se `recommended_mode == "cdp"`:**

Use `references/skill-template.md`. A skill-filha **não tem scripts próprios** — o `fetch` roda na aba logada do Chrome real. Crie só:

```bash
mkdir -p ~/.claude/skills/<slug>
```

E gere `~/.claude/skills/<slug>/SKILL.md` a partir do template CDP. **Não** crie `.env` — modo CDP não precisa, o Chrome resolve auth.

O template documenta **dois transportes** (o gerador copia os dois; não escolha por ele):
- **Primário — extensão chrome-MCP** (`mcp__claude-in-chrome__javascript_tool`): roda o `fetch` na aba. **Sem toggle, sem modal.** É o caminho do uso conversacional. Testado: `fetch` na página volta 200 + JSON real, com os cookies (incl. `httpOnly`) anexados pelo browser.
- **Fallback — `cdp.mjs`** (embutido no `/site2skill`): pro caso desassistido (cron/servidor). Exige toggle `chrome://inspect/#remote-debugging` + aprovar o modal.

Pré-requisito comum (avise se falhar): **aba do site aberta e logada** no Chrome real.

**Nos três modos, preencha:**
- `slug` — slug do site (ex: `clubinho`)
- `nome-amigavel` — nome legível (ex: "Clubinho de Ofertas")
- `host` — main_host
- `tipos-de-acao-em-portugues` — inferir pelos endpoints (ex: "buscar ingressos, ver preços, pedidos")
- `exemplos-naturais` — 2-3 exemplos de pedido em português
- Tabela de endpoints do main_host
- Tabela de endpoints 3rd party (via curl direto, com chaves chumbadas — funciona em qualquer modo)

### Passo 3.5 — ajustar pro padrão do cliente (`client_pattern`)

Alguns sites não expõem um endpoint REST por recurso. Se `detection.client_pattern` não vier `rest`, a tabela de endpoints muda de forma:

**`proxy-envelope`** (`detection.proxy_envelope = {proxy_url, routes}`): o site manda tudo por um endpoint único (ex.: `POST /api/rpc`) e escolhe a operação por uma chave no body (`{"method":"orders.list", ...}`). Não gere uma linha por path — gere **uma linha por rota** de `routes`, todas batendo no mesmo `proxy_url`, variando só a chave de roteamento. Documente na skill: "Todas as chamadas vão pra `{proxy_url}`; o que muda é o campo de roteamento no body."

**`graphql`** (`detection.graphql = {endpoint, persisted_queries, operations}`): o site usa GraphQL. Gere a skill em torno do `endpoint` único (`POST`), listando as `operations` como as "ações" disponíveis. Se `persisted_queries == true`, o servidor só aceita queries pré-registradas (hash em `extensions.persistedQuery`) — a skill precisa **reusar o hash + variables** capturados no HAR, não montar query nova. Documente isso explicitamente (query arbitrária será rejeitada).

Se `client_pattern == "rest"`, siga com a tabela de endpoints normal (uma linha por path).

### Passo 4 — confirmar e ensinar

> "✓ Skill /<slug> criada! Mapeei N endpoints (X principal + Y de APIs auxiliares).
>  
>  Agora você pode pedir coisas como:
>  - /<slug> <exemplo concreto baseado em endpoints reais>
>  - /<slug> <outro exemplo>
>  
>  Lembre: o Chrome precisa estar aberto na aba de [site] (logado) na hora de usar."

---

## Tratamento de problemas

**Capture sem requests (0 entries após filtro):**
- Confirme que o usuário navegou de fato. Pode ter pedido stop antes de fazer qualquer ação.
- Pergunte: "Não capturei nenhuma chamada. Você navegou no site após eu começar? Quer tentar de novo?"

**Endpoints todos retornando 401/403 mesmo via CDP:**
- A aba do Chrome não está logada. Avisar o usuário.

**Aba fecha durante a captura:**
- A auto-captura perde a sessão. Avisar e oferecer recomeçar.

**Site sem nenhuma chamada de API (HTML puro):**
- Avisar que o site não tem API JSON e essa abordagem não funciona. Sugerir `/agent-browser` ou similar para automação UI.

---

## Notas importantes

- **NÃO copie cookies/tokens pra dentro da skill gerada.** O Chrome resolve auth.
- **CSRF tokens rotativos** vivem em `<meta name="csrf-token">` da página. A skill gerada lê de lá em runtime.
- **3rd party hosts** (Algolia, Stripe public keys) podem ter chaves chumbadas — elas vivem em query params da URL e são públicas.
- **Resource types Image/Font/Media/Stylesheet:** filtre na auto-captura (o `parse_har.py` também ignora trackers).
- A skill gerada precisa instruir o aluno a abrir o site no Chrome antes de cada uso.
