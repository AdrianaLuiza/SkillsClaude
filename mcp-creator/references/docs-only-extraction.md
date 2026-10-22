# MCP Creator — Extração quando só existe documentação

Use quando nenhuma spec machine-readable foi achada (Nível 1 vazio) **ou** quando a spec achada
pode estar velha. Validado em 15/09/2026 na Hotmart (`developers.hotmart.com/docs/en/`): 30 de 30
endpoints extraídos, spec gerada passou no validador e bateu parâmetro a parâmetro com uma spec
manual de maio nos 25 endpoints em comum — e ainda achou 2 rotas que a spec velha tinha erradas.

O fluxo é **diagnosticar → escolher ferramenta → extrair → provar → virar OpenAPI**.
Não pule o diagnóstico: é ele que decide a ferramenta.

---

## 0. Antes: a spec existe mesmo?

Teste na origem da doc **e** na origem da API:

| Caminho | Quem usa |
|---|---|
| `/openapi.json`, `/openapi.yaml`, `/swagger.json`, `/v3/api-docs` | genérico, Spring |
| `/api-reference/openapi.json` (e `.yaml`) | **Mintlify** — foi onde a spec do GPT Maker estava |
| `/llms.txt`, `/llms-full.txt` | Mintlify, GitBook e outros; lista todas as páginas |
| `<pagina>.md` | Mintlify serve markdown da página; às vezes com bloco `openapi` embutido |

**Confira o tipo do conteúdo, não só o status.** Site SPA responde `200` com HTML para qualquer
caminho (a Hotmart faz isso). Só conta como spec se vier JSON/YAML com `openapi`/`swagger`/`paths`:

```bash
curl -s -o /tmp/s -w '%{http_code} %{content_type}\n' "$ORIGEM/api-reference/openapi.json"
head -c 200 /tmp/s   # tem que começar com { ou openapi:
```

---

## 1. Diagnóstico da documentação

Responda as cinco perguntas antes de extrair:

| Pergunta | Como medir | Na Hotmart |
|---|---|---|
| Tem `llms.txt`? | curl + tipo do conteúdo | não |
| O sitemap está completo? | contar URLs de endpoint no `sitemap.xml` | 8 de 30 |
| O menu lateral é renderizado por JS? | links no HTML cru × itens no menu do navegador | 1 link × ~36 itens |
| Quantas páginas de endpoint o menu tem? | percorrer o menu no navegador | 30 |
| Tem conteúdo atrás de toggle ("show parameters")? | procurar um campo conhecido no HTML | sim, não vem |

**O número do menu é a meta.** Toda extração é comparada contra ele.

## 2. Escolha da ferramenta pelo diagnóstico

| Diagnóstico | Ferramenta |
|---|---|
| Achou spec (passo 0) | baixar e ir pro passo 4 (provar) |
| `llms.txt` ou sitemap completo | ler a lista + `firecrawl scrape` em cada página |
| Links normais no HTML | `firecrawl map` + `firecrawl scrape` |
| **Menu só aparece com JS** | **navegador percorrendo o menu lateral** (clicar item a item e anotar a URL), depois `firecrawl scrape` em cada URL |
| Conteúdo atrás de toggle | não perseguir: tirar a resposta do **exemplo JSON** da página |

Medido: `firecrawl map` achou 21 dos 30 endpoints (70%); o sitemap, 8. Só o navegador chegou em 30.

Cuidados do navegador:
- Loop de cliques em um só JS estoura timeout (~45s) — faça em lotes.
- Itens com **título repetido** ("Introduction", "Intro") casam com o primeiro elemento — use a
  posição no menu, não o texto.

## 3. Extração por página

De cada página tire: método + caminho (linha `GET/caminho` ou o `curl`), parâmetros por seção
(Path / Query / Body), tipo, obrigatório, descrição, enum, e o exemplo JSON de resposta.

**Leia sempre a página de autenticação** (fica fora das páginas de endpoint). Ela decide o MCP:

| Tipo de login | O que o MCP faz |
|---|---|
| Token fixo (ex.: GPT Maker, Bearer) | recebe no cabeçalho do conector |
| Client credentials que expiram (ex.: Hotmart) | o servidor troca `client_id`/`secret` por token e **renova no 401** |
| OAuth de usuário | fluxo OAuth no servidor |

### Erros de documentação que já apareceram (trate, não confie)

| Erro | Exemplo real (Hotmart) | Tratamento |
|---|---|---|
| Seção de resposta misturada com parâmetros | contagem inflou 8 → 10 em comissões | contar só entre "Request parameters" e a linha do método |
| Campo do corpo marcado como "Path" | negociação: 5 campos em "Path", nenhum no endereço | parâmetro "path" que não está na URL → corpo |
| Nome do parâmetro ≠ nome no endereço | reembolso: doc `transaction`, URL `:transaction_code` | 1 órfão + 1 placeholder sem doc → renomear |
| JSON de exemplo inválido | vírgula faltando, vírgula sobrando, `0000000` | consertar antes de ler; se falhar, marcar "sem schema" |
| `integerRequired` colado | tipo e obrigatório sem espaço | regex sem case-insensitive no tipo |
| Enum em campo não-texto | validador acusa `no-enum-type-mismatch` | só aplicar enum em `string` |

Toda correção fica anotada na operação (`x-origem`).

## 4. Provar que cada endpoint existe

Sem token, sem mutação:

```bash
curl -s -o /dev/null -w '%{http_code}' -X "$METODO" "$BASE$CAMINHO_COM_IDS_FALSOS"
```

- `401`/`403` = existe (pede auth).
- **Controle obrigatório:** uma rota inventada em cada prefixo de serviço tem que dar `404`.
  Se o controle também der 401, o sinal não vale para essa API — diga isso.
- Rode também contra **spec oficial ou guardada no projeto**: a spec de maio da Hotmart tinha
  `product/{id}/offers`, que hoje dá 404; o certo é `products/`.

## 5. Virar OpenAPI com origem marcada

Saída padrão: **OpenAPI 3.1** (entra no mesmo gerador de quem já tem spec). Cada operação leva:

```json
"x-origem": {
  "pagina": "https://.../v1/sales/sales-commissions",
  "endereco": "provado: HTTP 401 sem token (rota inventada dá 404)",
  "parametros": "lidos da página",
  "resposta": "montado do exemplo JSON da página"
}
```

Auth vai em `components.securitySchemes`, com o fluxo de obtenção do token na descrição.

Valide antes de gerar:

```bash
npx -y @redocly/cli@latest lint spec.json --format=summary
```

Script de referência (formato da doc da Hotmart, adaptar os regex para outro site):
`assets/docs_to_openapi_example.py`.

## 6. O que entregar ao usuário

- endpoints: menu × extraídos × provados (ex.: 30 × 30 × 30), controle 404
- quantos com schema de resposta
- erros de documentação corrigidos
- tipo de auth e o que o MCP precisa fazer com ele
- **o que não foi provado:** parâmetros só são confirmados com chamada autenticada

## Atalho: MCP pequeno

Até ~5 ferramentas, pule a spec: leia as páginas e escreva as tools direto (foi o caso do GPT Maker).
OpenAPI compensa com dezenas de endpoints ou quando o MCP vai ser regerado.
