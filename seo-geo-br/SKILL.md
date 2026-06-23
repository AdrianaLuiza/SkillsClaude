---
name: seo-geo-br
description: >
  Skill completa de SEO e GEO (Generative Engine Optimization) para o mercado brasileiro.
  Use quando o usuário pedir: (1) auditoria de SEO ou análise de site, (2) otimização para
  buscas com IA (Google AI Overviews, ChatGPT Search, Perplexity, Claude), (3) SEO técnico,
  de conteúdo, local ou de e-commerce, (4) schema markup, Core Web Vitals, E-E-A-T,
  (5) estratégia de palavras-chave ou briefing de conteúdo, (6) análise de concorrentes,
  (7) SEO local Brasil (Google Meu Negócio, citações), (8) qualquer menção a "ranquear",
  "aparecer no Google", "tráfego orgânico", "AIO", "IA Overviews" ou "IA generativa e SEO".
license: MIT
compatibility: Claude Code e assistentes de IA compatíveis com Markdown.
metadata:
  author: alusulina
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep WebFetch
---

# SEO + GEO Brasil

Guia completo de otimização para buscas tradicionais e buscas com IA para o mercado brasileiro.
SEO e GEO não são disciplinas separadas — GEO é SEO aplicado às superfícies de busca generativa.

## Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `/seo auditoria <url>` | Auditoria completa: técnico + conteúdo + GEO + local |
| `/seo pagina <url>` | Análise profunda de uma única página |
| `/seo tecnico <url>` | SEO técnico: rastreamento, indexação, CWV, segurança |
| `/seo conteudo <url>` | E-E-A-T, qualidade de conteúdo, otimização semântica |
| `/seo geo <url>` | Otimização para IA: AI Overviews, ChatGPT, Perplexity |
| `/seo local <url>` | SEO local Brasil: GMB, citações, avaliações |
| `/seo schema <url>` | Detecção e geração de dados estruturados |
| `/seo palavras-chave <tema>` | Pesquisa e clustering de palavras-chave |
| `/seo concorrentes <url>` | Análise comparativa de concorrentes |
| `/seo briefing <keyword>` | Briefing completo de conteúdo |
| `/seo cwv <url>` | Core Web Vitals: LCP, INP, CLS |
| `/seo plano <url>` | Plano estratégico de 90 dias priorizado |

## Processo de auditoria completa

Execute nesta ordem para `/seo auditoria`:

- [ ] **1. Detecção de contexto** — identifique tipo de negócio (local, e-commerce, SaaS, editorial, B2B) e setor
- [ ] **2. SEO Técnico** — rastreamento, indexação, HTTPS, Core Web Vitals (LCP/INP/CLS), mobile
- [ ] **3. On-Page** — title tags, meta descriptions, H1-H6, conteúdo, densidade semântica
- [ ] **4. Schema Markup** — detecção, validação e oportunidades de dados estruturados
- [ ] **5. Conteúdo & E-E-A-T** — experiência, especialidade, autoridade, confiabilidade
- [ ] **6. GEO / IA Overviews** — citabilidade, blocos de resposta, sinais de entidade
- [ ] **7. SEO Local** (se aplicável) — Google Meu Negócio, citações NAP, avaliações
- [ ] **8. Pontuação & Prioridades** — score 0-100, top 10 ações priorizadas por impacto/esforço

## Score de Saúde SEO (0–100)

| Categoria | Peso | O que avalia |
|-----------|------|-------------|
| Conteúdo & E-E-A-T | 23% | Qualidade, profundidade, credenciais de autoria |
| On-Page SEO | 20% | Title, meta, headings, estrutura semântica |
| SEO Técnico | 20% | Rastreamento, indexação, HTTPS, erros |
| Core Web Vitals | 12% | LCP ≤ 2,5s · INP ≤ 200ms · CLS ≤ 0,1 |
| GEO / Prontidão para IA | 15% | Citabilidade, blocos de resposta, entidade de marca |
| Schema Markup | 5% | Dados estruturados válidos e relevantes |
| Imagens | 5% | Alt text, WebP/AVIF, lazy loading, tamanhos |

> **Nota:** Use **INP** (não FID) para Core Web Vitals — FID foi aposentado em março de 2024.
> Sinais de entidade de marca têm peso elevado porque menções de marca correlacionam 3× mais
> com visibilidade em IA do que backlinks (Ahrefs, dezembro de 2025).

## Detecção automática de tipo de negócio

Ao receber uma URL, identifique sinais na homepage:

- **Local/Serviços**: endereço físico, horários, área de atendimento → ativar SEO Local
- **E-commerce**: listagens de produto, carrinho, preços → ativar schema Product/Offer
- **SaaS/B2B**: trial, pricing tiers, demo → foco em conteúdo de funil e authority
- **Editorial/Blog**: muitos artigos, autores, datas → E-E-A-T e schema Article
- **Profissional Liberal**: médico, advogado, dentista → E-E-A-T crítico + schema Person

## GEO: Otimização para Busca Generativa

> **Princípio central**: GEO é SEO aplicado às superfícies de IA. Não é uma disciplina separada.

### Plataformas prioritárias no Brasil (2026)

| Plataforma | Fontes preferidas | Foco de otimização |
|-----------|-------------------|--------------------|
| Google AI Overviews | Páginas ranqueadas top-10 | Citabilidade + freshness |
| ChatGPT Search | Wikipedia, Reddit, Reddit BR, mídia | Entidade de marca |
| Perplexity | Reddit (46,7%), Wikipedia, notícias | Menções e co-citações |
| Claude (Anthropic) | Web atual + fontes autoritativas | E-E-A-T forte |

### Sete fatores de citabilidade por IA

1. **Blocos de resposta autocontidos** (134–167 palavras) posicionados nos primeiros 30% da página
2. **Freshness**: conteúdo < 3 meses tem 3× mais chance de ser citado; > 6 meses perde elegibilidade
3. **Entidade de marca**: menções em outros sites correlacionam 3× mais com visibilidade em IA do que DA/DR
4. **Renderização server-side**: crawlers de IA não executam JavaScript — conteúdo deve ser visível no HTML
5. **Estrutura de headings**: hierarquia H1→H6 clara com perguntas como headings
6. **Dados multimodais**: imagens com alt descritivo aumentam seleção em 156%
7. **Autoria declarada**: nome + credenciais + data de atualização visíveis

### Configuração crítica de robots.txt

Permita os crawlers de IA (exceto se houver razão específica para bloquear):

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

### Google AI Overviews vs. AI Mode

São sistemas distintos com comportamentos diferentes:

- **AI Overviews**: correlacionado com ranking tradicional — otimize posição orgânica
- **AI Mode**: prioriza freshness e autoridade de entidade — atualize conteúdo frequentemente
- Citam a mesma URL em apenas 13,7% dos casos — estratégias precisam ser separadas

## SEO Técnico: Checklist principal

### Rastreamento & Indexação
- [ ] `robots.txt` acessível e configurado corretamente
- [ ] Sitemap XML presente, válido e submetido no Google Search Console
- [ ] Canonical tags consistentes (sem conflitos com hreflang ou redirect)
- [ ] Nenhuma página importante bloqueada por `noindex` ou `nofollow` incorretos
- [ ] Status de indexação no GSC monitorado

### Core Web Vitals (2026)
- [ ] **LCP** ≤ 2,5s (Largest Contentful Paint) — imagem hero ou H1
- [ ] **INP** ≤ 200ms (Interaction to Next Paint) — substitui FID
- [ ] **CLS** ≤ 0,1 (Cumulative Layout Shift) — reservar espaço para imagens/ads
- [ ] Dados de campo (CrUX) disponíveis — dados de laboratório sozinhos não bastam

### Segurança & HTTPS
- [ ] HTTPS em todas as páginas com redirecionamento correto de HTTP
- [ ] Certificado SSL válido e não expirado
- [ ] Sem conteúdo misto (mixed content)
- [ ] Sem vulnerabilidades de segurança reportadas no GSC

## On-Page SEO: Padrões

### Title Tags
- Comprimento ideal: 50–60 caracteres
- Palavra-chave principal próxima ao início
- Nome da marca no final: `Palavra-chave Principal – Nome da Marca`
- Único por página — sem duplicatas

### Meta Descriptions
- Comprimento ideal: 140–160 caracteres
- CTA claro + proposta de valor
- Inclua variações semânticas da palavra-chave principal
- Não é fator de ranking mas impacta CTR

### Estrutura de Headings
- Um único H1 por página (contém palavra-chave principal)
- H2s para seções principais (inclua variações e perguntas)
- H3s para sub-seções
- Use formato de pergunta para headings quando possível → aumenta chance de Featured Snippet e GEO

## E-E-A-T: Experiência, Especialidade, Autoridade, Confiança

E-E-A-T é crítico para conteúdo YMYL (saúde, finanças, jurídico, segurança).

### Sinais de autoria
- Nome completo do autor + bio + foto
- Credenciais relevantes (CRM, OAB, CFA, Lattes, LinkedIn)
- Data de publicação E data de última atualização visíveis
- Links para perfis de autoridade (Lattes, Google Scholar, LinkedIn)

### Sinais de site
- Página "Sobre" detalhada com história e equipe
- Política de privacidade e termos de uso
- Informações de contato claras e acessíveis
- Citações em outros sites relevantes do setor

### Para profissionais liberais no Brasil
- Registro profissional visível (CRM, OAB, CRO, CRC, CREA)
- Currículo Lattes linkado (para área acadêmica/médica)
- Avaliações no Google Meu Negócio integradas ao site
- Schema `MedicalOrganization`, `LegalService`, ou `ProfessionalService`

## Schema Markup: Tipos prioritários para Brasil

### Sempre aplicar
- `Organization` — nome, logo, contato, redes sociais, CNPJ como `identifier`
- `WebSite` — com `SearchAction` para sitelinks search box
- `BreadcrumbList` — em todas as páginas internas

### Por tipo de negócio
- **Local**: `LocalBusiness` com endereço, horário, telefone, área de atendimento
- **E-commerce**: `Product` + `Offer` + `AggregateRating`
- **Blog/Editorial**: `Article` + `Person` (autor) + `FAQPage`
- **Médico**: `MedicalOrganization` + `Physician` + `MedicalCondition`
- **Jurídico**: `LegalService` + `Attorney`

### Schema depreciados — NUNCA usar
- `HowTo` schema para rich results (depreciado maio 2023)
- `FAQPage` como crítico — agora Info-level desde maio 2026 (ainda válido mas com impacto reduzido)

## SEO Local Brasil

> Consulte [seo-local-brasil.md](references/seo-local-brasil.md) para o guia completo.

### Checklist essencial Google Meu Negócio
- [ ] Perfil verificado com nome, endereço e telefone (NAP) exatos
- [ ] Fotos de alta qualidade (interior, exterior, equipe, produtos)
- [ ] Posts regulares (mínimo semanal)
- [ ] Resposta a todas as avaliações (positivas e negativas) em até 24h
- [ ] Atributos relevantes ativados (acessibilidade, pagamentos, idiomas)
- [ ] Perguntas & Respostas monitoradas e respondidas

### Consistência NAP
- Nome, Endereço e Telefone idênticos em: site, GMB, Facebook, Instagram, LinkedIn, Yelp Brasil, Foursquare

## Análise de Palavras-chave (para `/seo palavras-chave`)

1. **Seed keywords** — colete do usuário ou extraia do conteúdo existente
2. **Expansão semântica** — inclua sinônimos, co-ocorrências, perguntas relacionadas
3. **Intenção de busca** — classifique: informacional / navegacional / transacional / comercial
4. **Clustering** — agrupe por tópico semântico (não apenas similaridade de string)
5. **Mapeamento de páginas** — associe cada cluster a uma URL (nova ou existente)
6. **Priorização** — volume × dificuldade × relevância × potencial de GEO

## Referências

- [SEO Técnico](references/seo-tecnico.md) — rastreamento, indexação, performance, segurança
- [GEO & Busca com IA](references/geo-ia.md) — otimização para AI Overviews, ChatGPT, Perplexity
- [SEO Local Brasil](references/seo-local-brasil.md) — Google Meu Negócio, citações, avaliações
- [E-E-A-T & Conteúdo](references/eeat-conteudo.md) — qualidade de conteúdo, sinais de autoridade
- [Schema PT-BR](references/schema-ptbr.md) — dados estruturados com exemplos em português

## Formato de relatório padrão

Todo relatório de auditoria deve incluir:

```
## Resumo Executivo
Score SEO: [X/100] | Score GEO: [X/100]
Top 3 problemas críticos: ...

## Análise por Categoria
[Resultados com evidências específicas — não generalizações]

## Plano de Ação Priorizado
| Prioridade | Ação | Impacto | Esforço | Prazo |
|-----------|------|---------|---------|-------|
| 1 | ... | Alto | Baixo | 1 semana |

## Próximos Passos
[3 ações imediatas específicas]
```

## Regras fundamentais

- SEMPRE use evidências específicas da URL analisada — nunca generalize sem dados
- SEMPRE mencione INP (não FID) ao falar de Core Web Vitals
- NUNCA recomende HowTo schema para rich results (depreciado)
- NUNCA bloqueie GPTBot, ClaudeBot ou PerplexityBot sem justificativa explícita
- SEMPRE inclua data de publicação e atualização em análises de freshness
- SEMPRE priorize ações por impacto × esforço com prazo estimado
- PREFIRA dados de campo (CrUX, GSC) a dados de laboratório quando disponíveis
- SEMPRE adapte recomendações ao tipo de negócio detectado automaticamente
- Para YMYL (saúde, finanças, jurídico): E-E-A-T é não-negociável e deve ser auditado com rigor
- SEMPRE pergunte ao usuário se quer analisar o site em PT-BR ou também outras línguas (hreflang)
