# Template para skill gerada pelo /site2skill (modo CDP — browser vivo)

Este é o modo pra sites que precisam de uma **página viva** (CSRF rotativo ou Bearer mintado no frontend). A chamada roda como `fetch()` **dentro da aba logada** do usuário — o browser anexa cookies (incl. `httpOnly`) e resolve o token sozinho.

Há **dois transportes** pra rodar esse `fetch` na aba, e a skill gerada deve documentar os dois:

- **Primário — extensão chrome-MCP** (`mcp__claude-in-chrome__*`): o Claude roda o `fetch` na aba via `javascript_tool`. **Não precisa de toggle nem de modal** — a extensão já foi instalada uma vez. É o caminho do uso conversacional normal (o Claude está dirigindo). *Limite:* a extensão **bloqueia a leitura do valor dos cookies** (`document.cookie` volta `[BLOCKED]`) — mas pra rodar a chamada isso não importa, o `fetch` same-origin carrega os cookies sozinho.
- **Fallback — `cdp.mjs`** (embutido no `/site2skill`): script de terminal que roda o mesmo `fetch` via CDP. Serve pro caso **desassistido** (cron, servidor, sem Claude no meio). Exige o toggle de remote debugging ligado + aprovar o modal uma vez.

Substitua tudo entre `{{ }}`.

---

```
---
name: {{slug}}
description: >
  Cliente para a API de {{nome-amigavel}} ({{host}}). Use quando o usuário
  quiser {{tipos-de-acao-que-o-site-faz-em-portugues}}. Aceita pedidos em
  português livre. {{exemplos-naturais-de-pedidos}}.
---

# {{nome-amigavel}} — Cliente de API

**Host principal:** `https://{{host}}` (chamadas rodam como `fetch` dentro da aba logada do seu Chrome real)
{{#if has_third_party}}
**APIs auxiliares:** {{lista-de-third-party-hosts}}
{{/if}}

## Pré-requisito

**Aba aberta em `https://{{host}}`** no seu Chrome, com login feito (se for usar endpoints autenticados). Só isso pro caminho primário.

O **fallback desassistido** (`cdp.mjs`, pra cron/script sem o Claude dirigindo) tem pré-requisitos extras — ver a seção "Fallback" mais abaixo.

## Como usar

1. Identifique o tipo de pedido:
   - **Busca pública** (3rd party) → curl direto
   - **Site principal** → `fetch` na aba logada
2. Rode a chamada (ver "Padrão de execução").
3. Apresente o resultado em português, nunca JSON bruto.

## Endpoints — site principal

{{tabela-endpoints-do-host-principal}}

### Padrão de execução — primário (extensão chrome-MCP)

Se as tools `mcp__claude-in-chrome__*` estiverem disponíveis, este é o caminho. **Não precisa de toggle nem modal.**

1. **Ache a aba do site** com `mcp__claude-in-chrome__tabs_context_mcp`. Se nenhuma estiver em `{{host}}`, navegue uma (`navigate` pra `https://{{host}}`) e confirme login.
2. **Rode o `fetch` na aba** com `mcp__claude-in-chrome__javascript_tool` (REPL: use top-level `await`, última expressão é o retorno):

   ```js
   const r = await fetch('/api/PATH', {headers:{Accept:'application/json'}});
   await r.json()
   ```

   **POST com CSRF (token rotativo lido do DOM em runtime):**
   ```js
   const r = await fetch('/api/PATH', {
     method:'POST',
     headers:{
       'Content-Type':'application/json',
       'Accept':'application/json',
       'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
     },
     body: JSON.stringify({ campo:'valor' })
   });
   await r.json()
   ```

   **Várias em paralelo:**
   ```js
   await Promise.all([3954,2942,18].map(id => fetch('/api/PATH/'+id).then(r=>r.json())))
   ```

### Padrão de execução — fallback (`cdp.mjs`, desassistido)

Use quando a extensão não estiver disponível (cron, servidor, sem Claude). Pré-requisitos:

1. **Skill `/site2skill` instalada** (traz o `cdp.mjs`): `ls ~/.claude/skills/site2skill/scripts/cdp.mjs`
2. **Toggle de remote debugging ligado:** `chrome://inspect/#remote-debugging` no Chrome principal. Reinicie o Chrome na primeira vez. A 1ª chamada mostra um modal "Permitir depuração remota?" — aprove.
   > **Privacidade:** com o toggle ligado, qualquer processo pode acessar qualquer aba aberta (cookies, storage, conteúdo). Desligue quando não estiver usando.

```bash
# achar a aba (copie o targetId de 8 chars hex da linha do {{host}})
~/.claude/skills/site2skill/scripts/cdp.mjs list
# se nenhuma aba no host: ~/.claude/skills/site2skill/scripts/cdp.mjs nav <target> "https://{{host}}"

# chamar API (o eval aguarda a Promise e devolve o JSON)
~/.claude/skills/site2skill/scripts/cdp.mjs eval <target> \
  "fetch('/api/PATH', {headers:{'Accept':'application/json'}}).then(r => r.json())"
```

## Endpoints — APIs auxiliares (via curl direto)

{{tabela-endpoints-third-party-com-curls-prontos}}

## Convenções importantes (lições registradas)

- **Shape de resposta:** algumas APIs retornam array direto (`[...]`), outras paginadas (`{results: [...], total, page}`). Pra ser robusto sempre escreva `r.results || r` — **nunca** `r.results || []` (esse último silenciosamente esconde dados quando a API retorna array).
- **Query params capturados ≠ funcionais:** `parse_har.py` lista os params que apareceram em chamadas reais, mas não testa se filtram. Em sites como Pluggy, `?from=YYYY-MM-DD&to=...` foi ignorado pelo backend. Padrão recomendado: **puxar com `pageSize` alto e filtrar client-side** (data, descrição, categoria) usando JS dentro do `fetch`. É mais previsível e funciona em qualquer endpoint.
- **Categoria automática vs descrição:** APIs financeiras categorizam errado com frequência (ex: Rappi de mercado vira "Groceries" em vez de "Food delivery"). Quando o usuário pedir um nome de marca/loja, **buscar pela descrição** (`desc.toUpperCase().includes('AMAZON')`) é mais confiável que filtrar por `category`.
- **Mint de Bearer JWT:** quando a API do main_host pede `Authorization: Bearer <JWT>`, mintar o token **sempre via endpoint same-origin do site** (descoberto na geração — paths comuns: `/api/access-token`, `/api/auth/access-token`, `/api/auth/session`). Não confundir com endpoints de "connect-token" — esses costumam ser pra widgets de OAuth com escopo limitado e dão 403 nos endpoints de dados.

## Tratamento de erro

- **Nenhuma aba em `{{host}}`** → peça pro usuário abrir uma aba e logar (ou navegue via `navigate`/`cdp.mjs nav`).
- **Status 401/403** → sessão expirou no Chrome. "Abra `https://{{host}}` no Chrome e faça login de novo."
- **`document.cookie` volta `[BLOCKED]` na extensão** → esperado, é trava de privacidade da extensão. Não afeta o `fetch` (os cookies vão sozinhos). Só afeta extração de valor de cookie — que este modo não precisa.
- **Extensão indisponível** → caia pro fallback `cdp.mjs` (ver acima).
- **`cdp.mjs list` falha com "WebSocket error" ou "No DevToolsActivePort"** → toggle de remote debugging desligado. Ligue em `chrome://inspect/#remote-debugging` e reinicie o Chrome.
- **`TypeError: Failed to fetch`** → o `fetch`/`eval` rodou numa aba que não é do `{{host}}`. Confirme a aba/targetId.
```
