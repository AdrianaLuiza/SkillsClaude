# GEO: Otimização para Busca com IA

Guia aprofundado para otimizar conteúdo para plataformas de busca generativa em 2026.

## Fundamentos do GEO

GEO (Generative Engine Optimization) é a prática de otimizar conteúdo para ser selecionado,
citado e recomendado por sistemas de IA em respostas geradas. No Brasil, as principais
superfícies são Google AI Overviews (Visões Gerais de IA), ChatGPT Search e Perplexity.

**Diferença crítica do SEO tradicional:**
- SEO tradicional → rankear na lista de resultados (posição 1–10)
- GEO → ser citado na resposta gerada (independente da posição de ranking)

## Fatores de Citabilidade por Plataforma

### Google AI Overviews (Visões Gerais de IA)

**Como funciona no Brasil:**
- Disponível no Brasil desde 2025, em expansão
- Fortemente correlacionado com ranking orgânico (páginas top-10 têm vantagem)
- Prioriza conteúdo com alta pontuação de E-E-A-T
- Prefere resposta específica e factual à opinião

**Fatores de seleção (ordem de impacto):**
1. Posição orgânica (estar no top-10)
2. Bloco de resposta direta nos primeiros 30% da página
3. Freshness (conteúdo atualizado nos últimos 3 meses)
4. Schema markup relevante
5. Autoridade de domínio no tópico

**Formato ideal para ser citado pelo Google AIO:**
```
## O que é [Tema]?

[Definição direta em 1-2 frases]

[Resposta autocontida de 134–167 palavras com:
- dados específicos (porcentagens, números, datas)
- formato estruturado (lista ou parágrafo único claro)
- sem cliffhanger — a resposta deve ser completa por si só]
```

### ChatGPT Search (OpenAI)

**Fontes preferidas pelo ChatGPT:**
- Wikipedia (47,9% das citações)
- Reddit (11,3% — incluindo subreddits em PT-BR)
- Sites de notícias reconhecidos (UOL, G1, Folha, Estadão)
- Sites com alta autoridade de domínio

**Estratégias para o Brasil:**
- Criar ou otimizar página na Wikipedia PT-BR sobre sua entidade/marca
- Presença ativa no Reddit (r/brasil, subreddits de nicho)
- Conseguir menções em veículos de imprensa reconhecidos
- Manter perfil no Wikidata com informações precisas

### Perplexity

**Fontes preferidas:**
- Reddit (46,7%)
- Wikipedia (frequente)
- Notícias recentes (alta prioridade de freshness)
- Sites com SSL e boa reputação de domínio

**Estratégias específicas:**
- Conteúdo de alta freshness (notícias, atualizações de produto, relatórios)
- Presença em fóruns e comunidades (Reddit, Quora PT-BR)
- Artigos com data de publicação visível e atualização recente

### Claude (Anthropic)

**Características:**
- Usa índice web + fontes autoritativas
- Valoriza muito E-E-A-T e conteúdo factual
- Prefere fontes com credenciais claras de autoria

## Fatores de Citabilidade Universal (todas as plataformas)

### 1. Blocos de Resposta Autocontidos

O bloco de resposta é o parágrafo mais importante para GEO.

**Especificações:**
- Comprimento: 134–167 palavras (testado empiricamente)
- Posicionamento: nos primeiros 30% do conteúdo
- Tom: factual, direto, sem ambiguidade
- Dados: inclua números, porcentagens e datas específicas
- Independência: o bloco deve fazer sentido sem contexto adicional

**Template:**
```
## [Pergunta como Heading]

[Definição clara em 1-2 frases.]

[Expansão com dados específicos: "Segundo [fonte confiável], X% dos casos..."]

[Contexto prático: quando isso se aplica, como funciona na prática]

[Conclusão ou próximo passo lógico]
```

### 2. Sinais de Entidade de Marca

Menções de marca em sites de terceiros correlacionam **3× mais** com visibilidade em IA
do que backlinks ou autoridade de domínio.

**Como construir entidade de marca:**
- Conseguir menções (mesmo sem link) em portais relevantes do setor
- Participar ativamente de podcasts, webinars e eventos do nicho
- Colaborar com artigos em portais de autoridade (Medium PT-BR, portais especializados)
- Criar e manter perfis em diretórios de autoridade do setor
- Responder perguntas no Quora PT-BR e Reddit com identificação da marca

**Monitoramento de menções:**
- Configurar alertas no Google Alerts para nome da marca
- Verificar menções no Mention.com ou Brand24
- Analisar co-citações (sua marca mencionada junto a concorrentes conhecidos)

### 3. Freshness e Atualização de Conteúdo

**Dados críticos:**
- Conteúdo publicado há menos de 3 meses tem **3× mais** chance de ser citado
- Conteúdo com mais de 6 meses perde elegibilidade progressivamente para buscas recentes
- Datas de publicação E atualização devem ser visíveis e em schema `dateModified`

**Estratégia de atualização:**
- Audite conteúdo com mais de 6 meses trimestralmente
- Atualize dados, estatísticas e exemplos
- Mude a `dateModified` no schema após atualizações substanciais
- Adicione seção "Última atualização: [data]" visível ao leitor

### 4. Acessibilidade para Crawlers de IA

**Renderização:**
- Conteúdo principal DEVE ser visível no HTML (server-side rendered)
- Crawlers de IA não executam JavaScript — Angular, React, Vue sem SSR são problemáticos
- Teste: desative JavaScript no navegador e verifique se o conteúdo ainda aparece

**robots.txt — configuração recomendada:**
```
# Permita crawlers de IA (recomendado para visibilidade)
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Anthropic-AI
Allow: /

User-agent: OAI-SearchBot
Allow: /
```

**Bloqueie somente se tiver razão específica** (ex: conteúdo pago que não deve ser indexado por IA).

### 5. Estrutura Semântica com Perguntas

Headings em formato de pergunta aumentam a chance de seleção para GEO e Featured Snippets:

❌ `## Benefícios do Marketing de Conteúdo`
✅ `## Quais são os benefícios do marketing de conteúdo?`

❌ `## Instalação`
✅ `## Como instalar [produto]?`

❌ `## Preços`
✅ `## Quanto custa [produto]? (Preços e Planos)`

### 6. Conteúdo Multimodal

Páginas com múltiplos formatos de conteúdo têm **156% mais** chance de seleção por IA.

**Combine:**
- Texto estruturado (parágrafos + listas)
- Imagens com alt text descritivo e contextual (não apenas decorativas)
- Tabelas comparativas com dados concretos
- Infográficos com texto alternativo completo
- Vídeos com transcrição em texto na página

### 7. Autoria Declarada e Verificável

```html
<!-- Schema Person para autor -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Nome do Autor",
  "jobTitle": "Especialista em [área]",
  "url": "https://linkedin.com/in/autor",
  "sameAs": [
    "https://lattes.cnpq.br/...",
    "https://linkedin.com/in/...",
    "https://twitter.com/..."
  ]
}
</script>
```

## Checklist GEO Completo

### Conteúdo
- [ ] Bloco de resposta autocontido (134–167 palavras) nos primeiros 30% da página
- [ ] Headings em formato de pergunta nas seções principais
- [ ] Dados específicos (números, porcentagens, fontes citadas)
- [ ] Data de publicação e atualização visíveis
- [ ] Conteúdo atualizado nos últimos 3 meses (para tópicos com freshness importante)

### Técnico
- [ ] Conteúdo renderizado server-side (visível sem JavaScript)
- [ ] GPTBot, ClaudeBot, PerplexityBot permitidos no robots.txt
- [ ] Schema `datePublished` e `dateModified` implementados
- [ ] Schema de autoria (`Person`) implementado

### Entidade & Autoridade
- [ ] Menções de marca em sites externos ao nicho
- [ ] Perfil Wikipedia PT-BR (se aplicável)
- [ ] Presença em diretórios e portais do setor
- [ ] Citações em mídia relevante

### Google AI Overviews específico
- [ ] Página ranqueada no top-10 para a query-alvo
- [ ] FAQ com perguntas reais dos usuários (use Google "Pessoas também perguntam")
- [ ] Schema FAQPage implementado
- [ ] Conteúdo diferenciado de AI Mode com foco em freshness

## Diferença: AI Overviews vs. AI Mode (Google)

| Característica | AI Overviews | AI Mode |
|---------------|-------------|---------|
| Correlação com ranking | Alta | Baixa |
| Foco em freshness | Moderado | Alto |
| Autoridade de entidade | Secundária | Primária |
| Mesmo URL citado | — | Apenas 13,7% das vezes |
| Otimização principal | SEO tradicional | Freshness + Entidade |

**Implicação prática**: otimize separadamente para cada sistema.
Para AI Overviews: foque em ranking orgânico.
Para AI Mode: foque em atualização frequente e construção de entidade.

## Métricas para medir sucesso em GEO

- Frequência de aparição em AI Overviews para queries-alvo (monitore manualmente ou via tools)
- Volume de menções de marca (Google Alerts + Mention)
- Tráfego de referência de plataformas de IA (identificável via UTM e análise de referrers)
- Impressões zero-click vs. cliques no GSC (ratio indica visibilidade em AIO)
- Share of voice em buscas de marca vs. concorrentes
