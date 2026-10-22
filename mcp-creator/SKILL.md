---
name: mcp-creator
description: "Build MCP servers from API specs (OpenAPI, Postman, SDK codegen JSON). This skill should be used whenever the user asks to \"create an MCP server\", \"build MCP tools\", \"generate MCP from API\", \"wrap an API as MCP\", \"turn this API into tools\", \"make an MCP for [service]\", or mentions converting API specs/documentation into MCP tools. Also trigger when the user has API spec files (JSON, YAML, Postman collections) and wants to expose them through FastMCP, or when building spec-driven code generators for any REST API. Also trigger for publishing an MCP on Cloudflare Workers, packaging an MCP as .mcpb for Claude Desktop, or turning API documentation (no spec) into an MCP. Use this skill even if the user just says \"MCP\" combined with any API name (e.g., \"MCP for Stripe\", \"MCP for GitHub\", \"Shopify MCP\")."
metadata:
  version: 0.1.0
---

# MCP Creator

Build production-ready MCP servers from API specifications using FastMCP with spec-driven code generation.

## Overview

This skill encodes the battle-tested pattern from building meta-ads-mcp-codemode (1,265 tools from 119 specs). The approach: parse API specs → generate async Python tool functions → register with FastMCP → apply Code Mode for large tool counts.

## The Process

### Step 0 — Preflight & Setup (rode ANTES de tudo)

O skill roda dentro do Claude Code, então o Claude **se auto-provisiona** — não faça o usuário instalar nada na mão. Antes de gerar qualquer coisa, garanta os pré-requisitos:

**Caminho padrão (`.mcpb` / via Cloudflare) precisa só de Node 18+** — confira com `node -v` e siga pro
item 2. Python e uv abaixo são SÓ para o caminho Python avançado (Steps 2–8); não rode o setup.sh no caminho padrão.

**Pré-requisito do destino via Cloudflare: plugin oficial da Cloudflare instalado pelo marketplace.**
Confira se as skills `cloudflare:*` (ex.: `cloudflare:wrangler`, `cloudflare:agents-sdk`) aparecem na lista de skills.
Se não aparecerem, peça ao usuário para fazer no navegador, clique a clique:
1. Abrir https://claude.ai/customize/plugins/discover
2. Botão **Adicionar** → **Adicionar marketplace**
3. **Adicionar de um repositório**
4. No campo URL, digitar `cloudflare/skills` e escolher **Usar "cloudflare/skills"**
5. Deixar **Sincronizar automaticamente** ligado → clicar **Sincronizar**

Ao clicar em **Sincronizar**, o plugin "cloudflare" já aparece instalado na aba Plugins — não há passo extra
(confirmado pelo Thales em 15/09/2026). Se por acaso não aparecer, peça para abrir o marketplace sincronizado e adicionar o plugin. Em seguida o usuário fecha e abre o Claude, e você confere
as skills de novo. Você não consegue clicar nisso nem reiniciar o Claude — peça e espere a confirmação.
Não use o login do MCP que vem no plugin pelo Claude Desktop (falha com erro de redirect: a Cloudflare
recusa o endereço de retorno do Desktop desde 07/08/2026); para publicar, basta o
`npx wrangler login`.

**Pré-requisito pra documentação sem spec: Firecrawl.** Quando a plataforma não publica OpenAPI, a extração
depende dele (`references/docs-only-extraction.md`). Confira se há ferramenta `firecrawl_*` neste turno
(`ToolSearch({ query: "firecrawl", max_results: 5 })`) ou o CLI (`which firecrawl`). Se não houver, peça ao usuário para colar isto no Claude Code
(instala CLI, MCP e skills e guia o login por OAuth, sem chave): `Leia e siga as instruções de
https://www.firecrawl.dev/agent-onboarding/SKILL.md — instala tudo (CLI, MCP e skills) e me guia no login por OAuth pelo navegador.` Sem ele, só siga se a spec existir; não improvise raspagem à mão sem avisar a perda de qualidade.

**1. Python 3.10+ e uv** (só caminho Python avançado) — rode via Bash:
```bash
bash ~/.claude/skills/mcp-creator/assets/setup.sh
```
O script confere Python 3.10+ e **instala o `uv` se faltar**. Se o Python for < 3.10, oriente: Mac `brew install python@3.12`, ou python.org/downloads.

**2. Busca de specs (Exa) — caminho principal:**
Confira se a Exa está disponível neste turno: `ToolSearch({ query: "exa", max_results: 5 })`.
- **`web_search_exa` aparece** → use na discovery (o aluno normalmente já conectou a Exa no Kit de Partida da F1).
- **Não aparece** → peça pro usuário conectar (setup único, uma vez só):
  > "Pra achar as specs das APIs eu uso a busca da Exa. Cria uma conta grátis em https://exa.ai (sem cartão) e me cola a API key aqui."

  Com a key, conecte por ele no **terminal puro** (fora do Claude):
  ```bash
  claude mcp add --transport http exa "https://mcp.exa.ai/mcp?tools=web_search_exa,web_fetch_exa&exaApiKey=SUA_KEY"
  ```
  Depois reabra o Claude.
- **Rede de segurança:** se o usuário não quiser conectar agora, **NÃO trave** — caia pro `WebSearch` nativo na discovery (Níveis 1/2/3). A busca nativa acha specs bem o suficiente; só perde a consistência/qualidade da Exa.

Só depois do preflight, siga pro Step 1.

### Step 1: Research & Discovery (3 níveis)

**Caminho curto — o usuário só passou uma URL.** Se a invocação foi `/mcp-creator <url>` (ou uma URL solta
na mensagem), NÃO faça perguntas antes de tentar. Baixe a URL e resolva sozinho:

| O que você precisa | De onde tirar sem perguntar |
|---|---|
| A spec | A própria URL. Se ela devolver HTML em vez de JSON/YAML, tente `/openapi.json`, `/swagger.json`, `/openapi.yaml`, `/v3/api-docs`, `/api-reference/openapi.json` (Mintlify), `/llms.txt` na mesma origem, e procure link pra spec no HTML. **Confira o conteúdo, não o status**: SPA devolve 200 com HTML pra tudo. Nada achado → `references/docs-only-extraction.md` |
| Nome do MCP | `info.title` da spec, em kebab-case (ex.: "API Operação" → `operacao`) |
| URL base | `servers[0].url` da spec; se faltar, a origem da URL informada |
| Precisa de token? | Três sinais, nesta ordem: (1) `security`/`securitySchemes` da spec; (2) a documentação (página de autenticação, exemplos de `curl` com `Authorization`/`x-api-key`); (3) **a prova**: chame 1 GET sem token — `401`/`403` = precisa, mesmo que a spec não declare; `200` com dados = não precisa. Se discordarem, vale a prova, e diga a divergência ao usuário. |

Só pergunte se sobrar dúvida real: a spec exige auth e você não tem a credencial, ou a URL não devolveu
spec nenhuma. Exceção fixa: o **destino** (Step 1.5) é sempre perguntado, logo depois da spec pronta. Pergunte **uma vez**, com o que já descobriu na mão — nunca um questionário antes de tentar.

O objetivo é que `/mcp-creator https://exemplo.com/openapi.json` funcione de ponta a ponta sem mais
nenhuma digitação. Isso é usado ao vivo, em aula, com gente leiga.

Se o usuário já tem specs prontas, detectar o formato e pular pro Step 2:

| Source | Format | Adapter |
|--------|--------|---------|
| OpenAPI/Swagger | JSON/YAML with `paths` | OpenAPI adapter |
| Postman Collection | JSON with `item[].request` | Postman adapter |
| SDK Codegen | JSON with `apis[]` and `fields[]` | Direct (native format) |
| Raw docs/URL | HTML/Markdown | Diagnóstico → ferramenta → extração → prova 401/404 → OpenAPI (`references/docs-only-extraction.md`) |

**Spec guardada ou oficial também passa pela prova** (chamada sem token: 401 = existe; rota inventada = 404). Spec envelhece: a da Hotmart de maio tinha 2 rotas que hoje dão 404.

Se não tem specs, rodar o **pipeline de 3 níveis** (consultar `references/spec-discovery.md` para detalhes completos):

**Nível 1 — Busca de Specs** (paralelo): APIs.guru + Postman + vendor repos + SwaggerHub + GitHub. Todas as fontes ao mesmo tempo via Exa (`web_search_exa`). Apresentar achados ao usuário para aprovação antes de prosseguir.

**Nível 2 — Busca de Contexto** (paralelo, após aprovação): docs oficiais da API, changelog, rate limits, auth patterns, SDKs existentes, enum definitions. Entender a API profundamente antes de gerar código. Apresentar resumo ao usuário.

**Nível 3 — Complemento** (após primeiro draft): gaps identificados durante geração — endpoints faltando, enums incompletos, edge cases. Busca cirúrgica nos pontos específicos.

Human-in-the-loop entre cada nível: apresentar o que achou, usuário aprova antes de prosseguir.

### Step 1.5: Escolher o destino (SEMPRE pergunte, uma vez, aqui)

**Momento exato:** depois que a spec está pronta como **OpenAPI JSON validado** (baixada, ou extraída da
documentação e convertida) e ANTES de montar qualquer projeto. Nunca antes — o aluno escolhe vendo o que
foi achado. Vale também no caminho curto (`/mcp-creator <url>`): essa é a única pergunta obrigatória.

Pergunte com o que já sabe na mão, em linguagem de gente:

> "Achei a API de {nome}, com {N} funções. Onde você usa o Claude?
> 1. **Só no Claude Desktop deste computador** → arquivo `.mcpb` (2 cliques para instalar)
> 2. **No navegador, no celular, no Claude Code ou em mais de um computador** → via Cloudflare
> 3. **Os dois** → gero o `.mcpb` e publico via Cloudflare"

Na opção 3, faça os dois destinos com a mesma spec e avise ao entregar: **não ligue os dois no mesmo Claude Desktop**
(as ferramentas duplicam). Uso típico: `.mcpb` para mandar a outras pessoas que só usam o Desktop, Cloudflare para
o próprio uso no navegador/celular.

São só essas três opções. O destino local NÃO entra na pergunta (ver nota avançada no fim desta seção).

Se o usuário já disse o destino no pedido, não pergunte de novo. Depois da escolha: `.mcpb` → confira Node 18+ (`node -v`);
Cloudflare → confira o plugin da Cloudflare (pré-requisito no Step 0) e o login do wrangler (`npx wrangler whoami`). Mais de ~80 funções → avise e ofereça cortar a spec na mesma pergunta.

Descoberta e spec são as mesmas. Um **modelo TypeScript único** (`assets/openapi-ts/`) lê o OpenAPI
e cria uma tool por operação; o mesmo núcleo (`src/tools.ts`) sai em 2 destinos:

| Destino | Para quem | Onde aparece | Token fica |
|---|---|---|---|
| **.mcpb** | só usa o Claude Desktop, num computador | só no Desktop daquela máquina | campo seguro do Desktop |
| **Via Cloudflare** (plano grátis) | navegador, celular, Claude Code ou vários computadores; compartilhar e manter | conector em todo lugar | no conector (cabeçalho) |

Plano grátis da Cloudflare: 100 mil requisições/dia e **10 ms de CPU por requisição**. Medido 15/09/2026:
montar 74 tools custa ~3 ms (relógio) / ~6,7 ms (CPU somada) por requisição — cabe, mas com pouca folga.
Muitas funções → ofereça "só leitura" na mesma pergunta. Não validado ainda numa conta grátis real.

Validado em 15/09/2026 com a spec do GPT Maker (74 operações) nos 3 destinos: `tools/list` = 74,
sem token volta o erro da API, com token `get_workspaces` e `get_workspace_by_credits` OK — incluindo
o servidor de dentro do `.mcpb` desempacotado e o Worker publicado.

Pré-requisito: **Node 18+** (o Claude Desktop já traz Node para rodar `.mcpb`; para gerar, o aluno precisa do Node).
API gigante (centenas de endpoints) → filtre a spec ou use o caminho Python com Code Mode (Steps 2–8).

#### Montar (comum aos destinos)

```bash
cp -R ~/.claude/skills/mcp-creator/assets/openapi-ts <nome>-mcp && cd <nome>-mcp
cp <spec-openapi.json> src/spec.json          # OpenAPI 3.x em JSON (YAML: converter antes)
sed -i '' 's/openapi-mcp/<nome>-mcp/' wrangler.jsonc package.json mcpb/manifest.json
npm install
```

**API sem token** (spec sem `security`): no `mcpb/manifest.json` apague `user_config` e o `env` de `mcp_config`
(senão o Desktop pede um token obrigatório que não existe); no claude.ai o conector entra com "Sem login" e sem cabeçalho.
Validado 15/09/2026 com a API Operação (23 funções GET): `.mcpb` e Cloudflare responderam `listar_produtos`.

Auth pelo `securitySchemes`: `http bearer` → padrão. `apiKey` em header → Cloudflare: `"vars": {"AUTH_HEADERS": "x-api-key"}`;
local/.mcpb: env `API_AUTH_HEADER=x-api-key` e `API_AUTH_PREFIX=""`. URL base errada → `API_BASE`.
Token que expira via client credentials (ex.: Hotmart) → o modelo NÃO resolve; precisa gerar e renovar o token no servidor.

#### Destino — via Cloudflare

```bash
npx wrangler dev --port 8799     # teste local: tools/list + 1 chamada read-only com token (curl em /mcp,
                                 # headers Content-Type: application/json e Accept: application/json, text/event-stream)
npx wrangler deploy              # → https://<nome>-mcp.<conta>.workers.dev/mcp  (repita o teste na URL publicada)
```

claude.ai → Configurações → Conectores → Adicionar personalizado → URL → Request headers:
`authorization` = `Bearer <token>` (vai exatamente como digitado; não dá para editar depois).

#### Destino — .mcpb (Claude Desktop)

Ajuste `display_name`, `description` e o título do campo `api_token` em `mcpb/manifest.json`, depois:

```bash
npm run pack                                   # gera mcpb/server/index.js (bundle único) + <nome>.mcpb
npx -y @anthropic-ai/mcpb@2.1.2 validate mcpb/manifest.json
```

Teste antes de entregar: `mcpb unpack` e rode `node unpacked/server/index.js` com `API_TOKEN=<token>`
(initialize → tools/list → 1 chamada). Instalar: dar dois cliques no `.mcpb` (ou arrastar para Claude Desktop
→ Configurações → Extensões) e colar o token no campo. O pacote sai **sem assinatura** — o Desktop avisa; é esperado.

#### Nota avançada — Local (fora do menu; só se o usuário pedir explicitamente)

Faz sentido só quando a API existe apenas no computador/rede da empresa, quando os dados não podem passar
por servidor na nuvem, ou para API gigante com Code Mode sem plano pago (caminho Python, Steps 2–8).
Claude Code comum deve usar a opção via Cloudflare (conecta pela URL).

```bash
npm run build:stdio
```

Registrar editando `~/.claude.json` (mesmo procedimento do Step 7, com backup):
`{"type":"stdio","command":"node","args":["/caminho/absoluto/<nome>-mcp/mcpb/server/index.js"],"env":{"API_TOKEN":"<token>"}}`
Depois `claude mcp list` e pedir para o usuário fechar e abrir o Claude Code.

### Step 2: Scaffold the Project

Create the project structure. Consult `references/architecture.md` for the full layout.

```bash
mkdir -p my-api-mcp/{specs,src/my_api_mcp/tools,scripts,tests}
touch my-api-mcp/src/my_api_mcp/__init__.py my-api-mcp/src/my_api_mcp/tools/__init__.py
```

Key files to create:
1. **`pyproject.toml`** — Package metadata + dependencies
2. **`src/my_api_mcp/client.py`** — Async HTTP client (start from `assets/client_template.py`)
3. **`src/my_api_mcp/generator.py`** — Spec parser + code generator
4. **`src/my_api_mcp/server.py`** — FastMCP entry point

Customize the client template:
- Replace `{{API_NAME}}`, `{{BASE_URL}}`, `{{API_VERSION}}`, `{{ENV_VAR_TOKEN}}`
- Adapt auth strategy (bearer token, API key, OAuth2)
- Adapt pagination pattern (cursor-based, offset, link headers)

### Step 3: Write the Generator

The generator is the core — it reads spec files and outputs Python async functions. Consult `references/generator-patterns.md` for complete patterns.

Key decisions:
1. **Function naming**: `{method}_{entity}_{edge}` (e.g., `get_campaign_adsets`)
2. **Parameter handling**: Required params as positional, optional as keyword with `None` default
3. **Reserved words**: Use `_safe_param_name()` to append `_` to Python keywords
4. **Enum values**: Include ALL enum values in docstrings — never truncate. This is critical because agents discover valid parameter values through `get_schema`, and truncated values mean the agent can't find what it needs
5. **Field hints**: For GET endpoints, list available fields in the `fields` parameter docstring
6. **Structured output (condicional)**: emit `outputSchema` só quando a spec fornece o schema de resposta (OpenAPI). SDK codegen/Postman/GET fields-driven → mantém `-> str`. Ver `references/generator-patterns.md` §9.

### Step 4: Instalar o ambiente e gerar as tools (NESTA ORDEM)

**A ordem importa.** Com layout `src/`, o pacote só existe depois do install editável. Rodar o gerador
antes disso falha SEMPRE com `ModuleNotFoundError: No module named '<pacote>'` — erro determinístico,
não é ambiente do usuário. Instale primeiro:

```bash
cd <project-dir>
uv venv && uv pip install -e .        # cria o pacote; sem isso o passo seguinte quebra
.venv/bin/python -m <pacote>.generator
```

Se por algum motivo precisar gerar antes de instalar, use `PYTHONPATH=src python3 -m <pacote>.generator`.
Nunca chame `python -m <pacote>.generator` cru numa pasta recém-criada.

Verify:
- Each module has the right function count
- Functions have proper signatures and docstrings
- Enum values appear in docstrings
- No duplicate function names across modules

### Step 5: Configure the Server

```python
from fastmcp import FastMCP
from fastmcp.experimental.transforms.code_mode import CodeMode, MontySandboxProvider

mcp = FastMCP("my-api", instructions="...")

# Code Mode is always enabled — collapses all tools into 3 meta-tools
# (search, get_schema, execute) for a consistent agent interface
sandbox = MontySandboxProvider(
    limits={"max_duration_secs": 30, "max_memory": 100_000_000},
)
mcp.add_transform(CodeMode(sandbox_provider=sandbox))

def main():
    """CLI entry point — called by the [project.scripts] command."""
    mcp.run()
```

**Code Mode is always enabled by default.** It collapses all tools into 3 meta-tools (`search`, `get_schema`, `execute`), which scales better regardless of tool count and provides a consistent interface for agents.

**Convenção do `execute` — documente isso para quem for usar (medido em fastmcp 3.4.7):**
dentro do código enviado ao `execute`, as funções geradas **NÃO** existem soltas no escopo. Só existe
`call_tool(nome: str, params: dict)`, e a saída sai por `return`. Chamar a função direto devolve
`NameError: name '<tool>' is not defined` — o erro mais comum de quem testa Code Mode pela primeira vez.

```python
# certo
r = await call_tool("listar_vendas", {"status": "aprovada", "limite": 5})
return r

# errado -> NameError
r = await listar_vendas(status="aprovada")
```

O `get_schema` recebe o argumento `tools` (lista de nomes), não `tool_names`.

### Step 6: Test (você roda, não o usuário)

**Quem roda os testes é VOCÊ via Bash. Não cole comandos pro usuário rodar manualmente.**

**Passo 1 — Smoke test sem token** (só confere imports e CodeMode):

```bash
cd <project-dir> && uv venv && uv pip install -e .
.venv/bin/python -c "
from <package>.server import mcp
import asyncio
async def check():
    tools = await mcp.list_tools()
    assert len(tools) == 3, f'Esperava 3 meta-tools (CodeMode), achei {len(tools)}'
    print('✓ CodeMode OK — 3 meta-tools registradas')
asyncio.run(check())
"
```

Se o `uv pip install` falhar na resolução citando `pydantic-monty`, confira que o `pyproject.toml` **não** tem pin próprio desse pacote — o extra `[code-mode]` já traz a versão exata. Se falhar com `Monty.__new__() got unexpected keyword argument 'external_functions'`, é a mesma causa: alguma versão do monty foi forçada por fora da que o fastmcp pede.

**Passo 2 — Live test com token** (uma chamada real contra a API):

1. Pedir o token ao usuário **uma única vez** com mensagem do tipo: *"Cola seu `<NOME>_API_TOKEN` que eu rodo um smoke test contra a API real e em seguida registro o servidor no Claude Code."*

2. Criar `scripts/smoke_test.py` com 1-2 chamadas read-only (ex.: `list_*` com `limit=2`).

3. **Você** roda o script via Bash, passando o token inline:

```bash
cd <project-dir> && <NOME>_API_TOKEN="<valor-colado>" .venv/bin/python scripts/smoke_test.py
```

4. Apresentar a saída ao usuário. Se houver erro 401/403, o token tá errado — pedir de novo. Se 200, prosseguir pro Step 7 **com o mesmo token** (não pedir de novo).

### Step 7: Registrar localmente no Claude Code (OBRIGATÓRIO)

**NUNCA use `claude mcp add` via CLI** — a flag `-e` é variadic e engole o nome do server, gerando erros confusos como `missing required argument 'name'`. Edite `~/.claude.json` direto.

**Procedimento:**

1. **Reusar o token coletado no Step 6** — não pedir de novo. Se chegou aqui, o smoke test live passou com esse token, então tá certo.

2. Editar `~/.claude.json` programaticamente (faz backup, lê, injeta, escreve):

```python
import json, shutil
p = '/Users/<USUARIO>/.claude.json'
shutil.copy(p, p + '.bak')
d = json.load(open(p))
d.setdefault('mcpServers', {})['<nome-do-mcp>'] = {
    "type": "stdio",
    "command": "/caminho/absoluto/.venv/bin/<entry-point>",
    "args": [],
    "env": {
        "<API_TOKEN_ENV>": "<valor-coletado-do-usuario>"
    }
}
json.dump(d, open(p, 'w'), indent=2)
```

3. Verificar com `claude mcp list | grep <nome-do-mcp>` — esperar `✓ Connected` no output.

4. Avisar o usuário que precisa **sair e abrir de novo o Claude Code** (`/exit`) pra carregar o servidor — sem isso ele não aparece nas tools.

**Por que editar direto e não usar `claude mcp add`:** o CLI tem UX ruim com flags variadic. Quando você pode fazer 3 linhas de Python sem ambiguidade, faça.

**Se o arquivo já tiver muitos MCPs**: o Python script preserva tudo via merge — só adiciona a chave nova. O `.bak` te protege se algo der errado.

### Step 8: Package and Document

1. Update `pyproject.toml` version
2. Write CHANGELOG.md
3. Add maintenance scripts (`scripts/update_and_regenerate.sh`)
4. Document in README: setup, Claude Desktop config, endpoint coverage table

## Decisões e limites (registrados em 15/09/2026)

- **Dependências:** o modelo `openapi-ts` trava versões (`@modelcontextprotocol/server` 2.0.0, `agents` 0.23.0,
  wrangler 4.132.0, esbuild 0.28.2). Worker publicado e `.mcpb` ficam congelados com o código do dia — nada
  quebra sozinho. Atualize só por falha de segurança ou mudança na API, e gere/publique de novo.
  O caminho Python (FastMCP) é o que exige atenção a atualização.
- **Code Mode na Cloudflare** exige Dynamic Workers: beta aberto só para conta **paga** de Workers
  (taxa de US$ 0,002/Worker carregado suspensa no beta). Aluno no plano grátis não usa. Code Mode reduz
  contexto, mas **não** tira o risco de apagar/alterar — isso só o corte "só leitura" resolve.
- **Funções destrutivas:** a spec inteira gera tools de apagar/alterar (GPT Maker: `delete_agent_by`,
  `delete_chat_by`...). Para aluno, ofereça "só leitura" (só GET) na pergunta do destino. Ainda não implementado
  no modelo — hoje é preciso filtrar `src/spec.json` à mão antes de montar.
- **ChatGPT:** `.mcpb` não é instalado pelo ChatGPT. Ele conecta MCP remoto por URL com OAuth ou sem login;
  não foi achado suporte a token fixo em cabeçalho — o modelo via Cloudflare provavelmente não conecta lá. Não testado.
- **Nome das tools:** spec sem `operationId` gera nome a partir do endereço (`get_workspace_by_credits`). Funciona;
  se quiser nomes melhores, preencha `operationId` na spec antes de montar.
- **Mais de um destino ligado ao mesmo tempo** duplica as tools (Claude vê 74×N e escolhe qualquer uma). Um por ambiente.
- **Remover depois:** Cloudflare → `npx wrangler delete --name <nome>-mcp --force` e remover o conector no claude.ai;
  `.mcpb` → Claude Desktop → Configurações → Extensões → Desinstalar; local → tirar a chave de `~/.claude.json` (com backup).

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Install falha na resolução citando `pydantic-monty`, ou `execute` quebra com `Monty.__new__() got unexpected keyword argument 'external_functions'` | Remova qualquer pin próprio de `pydantic-monty` do pyproject.toml. O extra `[code-mode]` do fastmcp já fixa a versão certa (3.4.x → `0.0.17`); um pin paralelo colide com ele. Medido 11/08/2026 |
| Agent can't find enum values | Include ALL values in docstrings, never truncate |
| `SyntaxError` from reserved words | Use `_safe_param_name()` for all parameter names |
| `list<enum>` not resolved | Extract inner name: `ptype[5:-1]` from `list<name>` |
| Duplicate function names | Prefix with entity name: `get_campaign_adsets` not `get_adsets` |
| Rate limits during generation | Generator creates static code — rate limits only affect runtime |
| `firecrawl map` / sitemap acham menos endpoints que o menu | Menu renderizado por JS: percorra o menu no navegador. Hotmart: map 21/30, sitemap 8/30 |
| MCP da API com token que expira falha depois de um tempo | Ler a página de autenticação; client credentials → servidor gera e renova o token no 401 |

## Additional Resources

### Reference Files
- **`references/architecture.md`** — Project structure, pipeline, dependencies, design decisions
- **`references/generator-patterns.md`** — Spec parsing, function generation, adapters for OpenAPI/Postman
- **`references/docs-only-extraction.md`** — Quando só há documentação (ou a spec pode estar velha): diagnóstico, ferramenta, erros comuns de doc, prova 401/404, OpenAPI com origem
- **`references/example-brasilapi.md`** — Exemplo trabalhado e rodável: spec da BrasilAPI (12 grupos) → 16 tools geradas → Code Mode, com exemplos de uso reais pra demo

### Asset Files
- **`assets/client_template.py`** — Starter HTTP client with auth, pagination, rate limiting
- **`assets/openapi-ts/`** — OpenAPI (`src/spec.json`) → MCP com o mesmo núcleo: via Cloudflare (`worker.ts`) e `.mcpb` (`stdio.ts`); local só como nota avançada
- **`assets/docs_to_openapi_example.py`** — Páginas de doc raspadas → OpenAPI 3.1 com `x-origem` (formato da doc Hotmart; adaptar regex)

### Reference Implementation
Public starter repo: **https://github.com/thaleslaray/meta-ads-claude-starter** — demonstrates every pattern in this skill (spec-driven generation, Code Mode, FastMCP setup). Use como base de comparação quando estiver construindo MCPs complexos.
