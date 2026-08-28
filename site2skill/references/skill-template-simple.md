# Template para skill gerada pelo /site2skill (modo simples — curl + cookies)

Use este template quando o site **NÃO tem Cloudflare nem CSRF rotativo**. Senão, use `skill-template.md` (modo CDP).

Substitua tudo entre `{{ }}`. Crie 2 arquivos: `SKILL.md` (com frontmatter) e `.env` (com cookies). Adicione `.gitignore` na pasta da skill com `.env` dentro.

---

```
---
name: {{slug}}
description: >
  Cliente para a API de {{nome-amigavel}} ({{host}}). Use quando o usuário
  quiser {{tipos-de-acao-que-o-site-faz-em-portugues}}. Aceita pedidos em
  português livre. {{exemplos-naturais-de-pedidos}}.
---

# {{nome-amigavel}} — Cliente de API (modo simples)

**Host principal:** `https://{{host}}`
**Auth:** cookies de sessão lidos de `.env` ao lado deste arquivo

## Pré-requisito

1. Arquivo `.env` ao lado deste `SKILL.md` com os cookies da sessão. Formato:

   ```
   COOKIES="nome1=valor1; nome2=valor2; nome3=valor3"
   ```

2. Curl instalado (vem por padrão em Mac/Linux/Windows 10+).

## Como atualizar os cookies (quando expira)

Os cookies de sessão expiram (de 1 dia a 30 dias dependendo do site). Quando começar a dar 401/403:

1. Logue no site no Chrome
2. F12 → Application → Cookies → `{{host}}`
3. Copie os valores dos cookies de sessão e atualize `.env`

Alternativa: rode `/site2skill` de novo passando um HAR novo, ele regenera o `.env`.

## Endpoints

{{tabela-endpoints-do-host-principal}}

### Padrão de execução

Carregue cookies do `.env` e use em `curl -b`:

```bash
source ~/.claude/skills/{{slug}}/.env

curl -s "https://{{host}}/api/PATH" \
  -H "Accept: application/json" \
  -b "$COOKIES"
```

**Para POST com body JSON:**

```bash
curl -s "https://{{host}}/api/PATH" \
  -X POST \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -b "$COOKIES" \
  -d '{"campo":"valor"}'
```

**Para várias chamadas em paralelo (xargs):**

```bash
echo "id1 id2 id3" | xargs -n1 -P3 -I{} curl -s -b "$COOKIES" \
  "https://{{host}}/api/items/{}"
```

{{#if has_third_party}}
## APIs auxiliares (3rd party — chaves públicas)

{{tabela-endpoints-third-party-com-curls-prontos}}
{{/if}}

## Tratamento de erro

- **401/403** → cookies expiraram. Veja "Como atualizar os cookies" acima.
- **`COOKIES: unbound variable`** → arquivo `.env` está faltando. Recriar via `/site2skill` com HAR novo.
- **Empty response** → o endpoint pode exigir referer. Adicionar `-H "Referer: https://{{host}}"`.

## Notas

- `.env` está no `.gitignore` desta skill — **não comite cookies em repositório público**.
- Se você compartilhar a pasta da skill com outra pessoa, **não inclua o `.env`**. Ela precisa gerar o dela rodando `/site2skill`.
- Cookies dão acesso à sua conta. Tratar como senha.
```

---

## Estrutura final dos arquivos gerados

```
~/.claude/skills/{{slug}}/
├── SKILL.md         (com instruções acima)
├── .env             (cookies — NÃO COMITAR)
└── .gitignore       (com `.env` dentro)
```

**Conteúdo do `.gitignore`:**
```
.env
```

**Conteúdo do `.env` gerado:**
```bash
# Cookies de sessão de {{nome-amigavel}}
# Gerado em {{data}} a partir de HAR
# Atualize quando começar a dar 401/403
COOKIES="cookie1=valor1; cookie2=valor2; cookie3=valor3"
```
