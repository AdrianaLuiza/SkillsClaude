---
name: planejar
description: >
  Metodologia completa para planejar produtos digitais antes de escrever uma linha de codigo.
  Cobre desde brainstorm ate plano de implementacao auditado e corrigido.
  Use quando o usuario quiser planejar um novo produto (web app, mobile, extensao, SaaS, API),
  quando disser "vamos planejar", "quero construir X", "tenho uma ideia pra Y",
  ou quando mencionar que precisa de um plano antes de codar.
  Tambem use quando o usuario pedir pra transformar uma ideia vaga em especificacao tecnica.
  NAO use para tarefas de implementacao — esta skill produz o PLANO, nao o codigo.
---

# Planejar

Metodologia em 8 fases para transformar uma ideia em um plano de implementacao production-ready. O plano passa por design UX/UI e auditoria tecnica multi-skill antes de qualquer codigo ser escrito, eliminando retrabalho e decisoes ruins.

**Anuncie no inicio:** "Estou usando a skill `/planejar` para conduzir o planejamento. Vou guiar voce por ate 8 fases — algumas podem ser puladas dependendo do produto. Vamos comecar pelo brainstorm."

**Antes de comecar:** Pergunte o que o usuario ja tem resolvido. Se ele ja tem stack definida, pule Fase 3. Se nao ha cliente especifico, pule Fase 2. Se nao ha interface, pule Fase 4. Nunca force fases que o usuario ja resolveu — confirme antes de pular.

## Por que esse processo existe

Codigo escrito sem planejamento solido gera retrabalho. Mas um plano escrito sem pesquisa e auditoria tambem gera retrabalho — so que mais tarde, quando custa mais caro corrigir. Esta skill resolve isso: pesquisa antes de planejar, audita antes de executar.

## As 8 Fases

```
Fase 1: Brainstorm ─── explorar o problema, alternativas, escopo
    │ usuario aprova direcao
    ▼
Fase 2: Discovery ──── pesquisar cliente/persona/mercado
    │ usuario confirma entendimento
    ▼
Fase 3: Pesquisa Tecnica ─── stack, trade-offs, dados reais
    │ usuario aprova stack
    ▼
Fase 4: Design ──── UX/UI, fluxos, wireframes, sistema visual
    │ usuario aprova design
    ▼
Fase 5: Escrita do Plano ─── implementacao detalhada com codigo
    │ plano salvo
    ▼
Fase 6: Auditoria ─── skills especializadas contra o plano
    │ relatorio de achados
    ▼
Fase 7: Correcao ─── aplicar achados no plano
    │ plano corrigido
    ▼
Fase 8: Montagem ─── plano final consolidado, pronto pra executar
```

**Regra inviolavel:** human-in-the-loop entre cada fase. Nao pular fases sem aprovacao.

---

## Scraping com fallback

Sempre que precisar raspar uma URL (Fases 2 e 3), usar essa ordem:

1. `firecrawl_scrape(url)` — melhor resultado, lida com JS pesado
2. `Bash: curl -s "https://r.jina.ai/<url>"` — fallback gratuito, markdown limpo, ~10s
3. `WebFetch(url)` — ultimo recurso: resume/parafraseia, nao extrai verbatim
4. Pular URL, anotar como indisponivel

Usar o mesmo fallback tanto no scrape do site do cliente (Fase 2) quanto nos artigos tecnicos (Fase 3).

---

## Fase 1 — Brainstorm

**Objetivo:** Explorar o espaco do problema antes de convergir em solucao.

**Como executar:**

1. Invocar `superpowers:brainstorming` — seguir o fluxo completo da skill
2. Explorar: o que o produto faz, pra quem, qual problema resolve
3. Mapear alternativas existentes no mercado (usar `perplexity_search` nivel 1 se necessario)
4. Definir escopo do MVP — o que entra, o que fica pra depois
5. Nomear o produto (brainstorm de nomes se necessario)

**Entrega:** Documento de escopo com:
- Problema e publico
- Fluxos principais (quem faz o que)
- MVP vs futuro
- Nome do produto

**Nao avance sem:** Usuario confirmar escopo e nome.

---

## Fase 2 — Discovery

**Objetivo:** Entender profundamente o cliente/persona e o contexto de negocio.

**Quando pular:** Se o produto nao tem um cliente especifico (projeto pessoal, SaaS generico), pule direto pra Fase 3. Informe o usuario antes de pular.

**Ferramentas:**
- `firecrawl_scrape` (ou fallback jina.ai) — site do cliente/empresa
- `perplexity_search` com sources `["social", "web"]` — redes sociais, presenca online
- Leitura de documentos existentes no projeto

**Como executar:**

1. **Scrape do site** do cliente/empresa (se existir), usando a ordem de fallback acima:
   - Identidade visual (cores, fontes, tom)
   - Servicos/produtos oferecidos
   - Posicionamento e linguagem

2. **Pesquisa de redes sociais** (Instagram, LinkedIn, YouTube):
   - Tipo de conteudo publicado
   - Publico-alvo visivel
   - Tom e estilo de comunicacao

3. **Consolidar em documento de referencia:**
   - Salvar como `docs/<nome>-perfil.md`
   - Incluir: quem e, formacao, servicos, numeros, identidade visual, contexto pro produto

**Entrega:** Documento de perfil que qualquer pessoa consiga ler e entender o cliente.

**Nao avance sem:** Usuario confirmar que o perfil esta correto.

---

## Fase 3 — Pesquisa Tecnica

**Objetivo:** Tomar decisoes de stack baseadas em dados, nao achismo.

**Quando pular:** Se o usuario ja definiu a stack completa e nao quer revisar, pule esta fase. Confirme antes.

**Ferramentas:**
- `perplexity_search` — varredura rapida de alternativas
- `perplexity_reason` — comparativos e trade-offs
- `context7` (resolve-library-id + query-docs) — documentacao oficial atualizada
- `firecrawl_scrape` (ou fallback jina.ai) — artigos tecnicos, benchmarks, issues (ver "Scraping com fallback" acima)

**Como executar:**

1. **Listar componentes do sistema** (frontend, backend, banco de dados, infra, etc.)
2. **Para cada componente, pesquisar:**
   - 2-3 alternativas viaveis
   - Trade-offs reais (performance, experiencia de desenvolvimento, maturidade, ecossistema)
   - Issues conhecidas, breaking changes recentes
   - Documentacao oficial para confirmar patterns atuais
3. **Montar tabela de decisao:**

```markdown
| Camada | Escolha | Alternativas | Razao |
|--------|---------|--------------|-------|
| Frontend | Next.js 16 | Remix, Astro | App Router maduro, Vercel deploy |
| DB | Supabase | Firebase, PlanetScale | Auth + Storage + Realtime integrado |
```

4. **Validar patterns com context7** — nao confiar em memoria, buscar docs atuais
5. **Documentar decisoes que impactam a arquitetura** (ex: WXT vs CRXJS, qual biblioteca de animacao)

**Entrega:** Stack definida com justificativa baseada em pesquisa.

**Nao avance sem:** Usuario aprovar stack.

---

## Fase 4 — Design

**Objetivo:** Definir a experiencia do usuario e o sistema visual antes de escrever codigo.

**Quando pular:** CLIs, APIs sem interface, scripts de automacao — qualquer produto sem UI visual. Informe o usuario antes de pular.

Construir sem design e como construir uma casa sem planta — funciona, mas voce vai derrubar paredes depois. Esta fase garante que a interface seja pensada como produto, nao como "coisa que o dev fez".

**Como executar:**

1. Invocar a skill `designing-beautiful-websites` — seguir o workflow completo:
   - **Step 0 (Inputs):** Usar dados da Fase 2 (perfil do cliente) + Fase 3 (stack)
   - **Step 1 (Strategy):** Objetivos do usuario + metricas de sucesso
   - **Step 2 (Scope):** Paginas/telas + features prioritarias
   - **Step 3 (Structure):** Arquitetura de informacao + navegacao + fluxos principais
   - **Step 4 (Skeleton):** Wireframes + inventario de componentes
   - **Step 5 (Surface):** Sistema visual (cores, tipografia, espacamento, sombras)
   - **Step 6 (Validate):** Teste de primeiro olhar + verificacao de acessibilidade
   - **Step 7 (Hand-off):** Especificacoes para implementacao

2. **Consolidar em documento de design:**
   - Salvar como `docs/<nome-produto>-design.md`
   - Incluir: brief de design, variaveis CSS, inventario de componentes, regras responsivas

3. **Se o cliente tem marca existente** (identidade visual capturada na Fase 2):
   - Usar cores, fontes e tom da marca como base
   - Adaptar, nao reinventar

**Entrega:** Documento de design com especificacoes visuais e lista de componentes.

**Nao avance sem:** Usuario aprovar a direcao visual.

---

## Fase 5 — Escrita do Plano

**Objetivo:** Plano de implementacao detalhado, com passos pequenos e codigo completo.

**Como executar:**

1. Invocar `superpowers:writing-plans` — seguir o fluxo completo da skill
2. O plano deve incluir:
   - Header com objetivo, arquitetura, stack escolhida
   - Estrutura de arquivos completa (quais arquivos criar/modificar)
   - Tarefas com checkboxes, codigo completo, comandos exatos
   - Testes antes da implementacao de cada modulo
   - Commits frequentes ao longo do desenvolvimento
3. Salvar em `docs/superpowers/plans/YYYY-MM-DD-<nome-produto>.md`

**Formato de referencia:** Ver skill `superpowers:writing-plans` para estrutura exata.

**Entrega:** Plano salvo no filesystem.

**Nao avance sem:** Plano escrito e salvo.

---

## Fase 6 — Auditoria

**Objetivo:** Encontrar bugs, vulnerabilidades, e problemas de arquitetura ANTES de implementar.

Esta e a fase que diferencia esta metodologia de "so escrever um plano". O plano passa por review de skills especializadas como se fosse codigo real.

**Como executar:**

1. **Identificar skills relevantes** baseado na stack escolhida na Fase 3
2. **Consultar `references/audit-skills.md`** para o mapeamento dominio → skills. Selecionar apenas as skills relevantes para este projeto.
3. **Se o arquivo nao existir:** usar bom senso — para React/Next.js usar `react-best-practices`, para Supabase usar `supabase-audit-rls`, para extensoes Chrome usar `chrome-extension-wxt`.
4. **Para cada skill, auditar o plano** perguntando:
   - O codigo proposto segue as boas praticas dessa tecnologia?
   - Tem vulnerabilidades de seguranca?
   - Tem problemas de performance?
   - Faltam patterns recomendados?
5. **Rodar auditorias em paralelo** quando possivel — invocar multiplas skills de uma vez para agilizar
6. **Consolidar achados em relatorio** com prioridades:
   - **P0**: Bugs e seguranca — corrigir antes do MVP
   - **P1**: Performance e arquitetura — corrigir durante MVP
   - **P2**: UX e boas praticas — corrigir pos-MVP
   - **P3**: Melhorias opcionais
7. **Salvar relatorio** em `docs/<nome-produto>-audit.md`

**Entrega:** Relatorio de auditoria com achados priorizados.

**Nao avance sem:** Relatorio completo.

---

## Fase 7 — Correcao

**Objetivo:** Aplicar todos os achados da auditoria de volta no plano.

**Como executar:**

1. **Agrupar achados por secao do plano** (backend, frontend, banco de dados, extensao, etc.)
2. **Para cada grupo, gerar arquivo de correcao** com:
   - O que estava errado
   - O que foi corrigido
   - Codigo corrigido completo
3. **Aplicar correcoes no plano original** via find-and-replace ou reescrita de secoes
4. **Verificar que nenhum achado P0/P1 ficou sem correcao**

**Dica:** Se o plano for grande (mais de 2000 linhas), trabalhar por secoes para evitar erros. Criar arquivos temporarios de correcao (`/tmp/<produto>-fix-<secao>.md`) e aplicar um a um.

**Entrega:** Plano corrigido com todos os achados P0 e P1 resolvidos.

---

## Fase 8 — Montagem

**Objetivo:** Plano final consolidado, limpo, pronto para execucao.

**Como executar:**

1. **Verificar consistencia** — nomes, paths, imports, referencias cruzadas
2. **Remover artefatos de correcao** — comentarios temporarios, marcacoes de diff
3. **Validar que o plano e auto-contido** — alguem (ou um agente) consegue executar so lendo o plano
4. **Limpar arquivos temporarios** (fix files, rascunhos)
5. **Apresentar resumo ao usuario:**

```markdown
## Resumo do Planejamento

**Produto:** [nome]
**Plano:** `docs/superpowers/plans/YYYY-MM-DD-<nome>.md`
**Auditoria:** `docs/<nome>-audit.md`

### Numeros
- [N] tarefas de implementacao
- [N] achados de auditoria ([N] P0, [N] P1, [N] P2, [N] P3)
- Todos P0/P1 corrigidos no plano

### Proximo passo
Quando quiser executar, use `superpowers:subagent-driven-development`
apontando para o plano.
```

**Entrega:** Plano final + resumo.

**Nao executar codigo sem aprovacao explicita do usuario.**

---

## Documentos Produzidos

Ao final das 8 fases, o projeto tera:

| Documento | Path | Conteudo |
|-----------|------|----------|
| Perfil do cliente | `docs/<nome>-perfil.md` | Persona, marca, contexto |
| Design system | `docs/<nome>-design.md` | Sistema visual, componentes, regras responsivas |
| Plano de implementacao | `docs/superpowers/plans/YYYY-MM-DD-<nome>.md` | Tarefas com codigo completo |
| Relatorio de auditoria | `docs/<nome>-audit.md` | Achados priorizados |

---

## Atalhos

Nem todo produto precisa das 8 fases completas. Sempre confirme com o usuario antes de pular uma fase.

| Cenario | Fases |
|---------|-------|
| Produto com cliente + UI | Todas as 8 |
| Projeto pessoal / tech com UI | Pular Fase 2 → 1 → 3 → 4 → 5 → 6 → 7 → 8 |
| CLI / API / sem interface | Pular Fases 2 e 4 → 1 → 3 → 5 → 6 → 7 → 8 |
| Prototipo rapido | Fases 1 → 3 → 4 → 5 (sem auditoria) |
| Refactoring de produto existente | Fases 3 → 5 → 6 → 7 → 8 |
| Usuario ja tem stack definida | Pular Fase 3 — perguntar antes |

---

## Integracao com Outras Skills

Esta skill orquestra outras skills. Ela nao substitui nenhuma — ela define QUANDO e POR QUE usar cada uma.

| Fase | Skills / ferramentas invocadas |
|------|-------------------------------|
| 1. Brainstorm | `superpowers:brainstorming`, `perplexity_search` (alternativas no mercado, opcional) |
| 2. Discovery | `firecrawl_scrape` (ou fallback jina.ai), `perplexity_search` (redes sociais) |
| 3. Pesquisa Tecnica | `perplexity_search`, `perplexity_reason`, `context7`, `firecrawl_scrape` (ou fallback jina.ai) |
| 4. Design | `designing-beautiful-websites` |
| 5. Escrita | `superpowers:writing-plans` |
| 6. Auditoria | Skills especializadas por dominio (ver `references/audit-skills.md`) — rodadas em paralelo |
| 7. Correcao | — (aplica achados da fase 6) |
| 8. Montagem | — |

**Execucao do plano** (pos-skill): `superpowers:subagent-driven-development` ou `superpowers:execute-plan`
