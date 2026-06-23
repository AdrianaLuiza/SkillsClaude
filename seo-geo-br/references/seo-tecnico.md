# SEO Técnico: Guia Completo

Referência detalhada para auditoria e implementação de SEO técnico.

## Rastreamento e Indexação

### robots.txt

**Localização**: `https://seusite.com.br/robots.txt`

**Verificar:**
- Arquivo acessível e retornando status 200
- Nenhuma diretiva `Disallow` bloqueando páginas importantes
- Referência ao sitemap XML incluída
- Crawlers de IA permitidos (GPTBot, ClaudeBot, PerplexityBot)

**Template base:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /wp-admin/
Disallow: /checkout/
Disallow: /?s=

Sitemap: https://seusite.com.br/sitemap.xml
```

### Sitemap XML

**Boas práticas:**
- Máximo de 50.000 URLs por sitemap (use índice de sitemaps se necessário)
- Inclua apenas páginas indexáveis (status 200, sem noindex)
- `<lastmod>` com data real de modificação (não gerada automaticamente)
- `<priority>` e `<changefreq>` são ignorados pelo Google — foque em `lastmod`
- Submeta no Google Search Console e Bing Webmaster Tools

**Tipos de sitemap:**
- `sitemap.xml` — páginas gerais
- `sitemap-news.xml` — Google News (para portais)
- `sitemap-images.xml` — imagens (para e-commerce e fotografia)
- `sitemap-video.xml` — vídeos hospedados no site

### Cobertura de Indexação (Google Search Console)

**Verificar no GSC > Indexação > Páginas:**
- **Erros críticos**: corrigir imediatamente
- **Páginas válidas**: comparar com total de páginas do site
- **Excluídas por noindex**: validar se é intencional
- **Páginas alternativas sem URL canônica**: sinal de conteúdo duplicado
- **Rastreadas mas não indexadas**: identificar causa (thin content, qualidade baixa)

## URLs e Estrutura

### Estrutura de URLs

**Boas práticas:**
- Lowercase apenas: `/sobre-nos` (não `/Sobre-Nos`)
- Hífens como separadores: `/marketing-digital` (não `marketing_digital` ou `marketingdigital`)
- Curtas e descritivas: máximo 3-4 níveis de hierarquia
- Palavras-chave na URL quando natural
- Evite parâmetros de URL desnecessários em páginas indexáveis

**Hierarquia recomendada:**
```
/categoria/subcategoria/slug-da-pagina
/blog/marketing-digital/o-que-e-seo
/produtos/eletronicos/smartphone-samsung-galaxy
```

### Redirecionamentos

- Prefira 301 (permanente) sobre 302 (temporário) para redirecionamentos definitivos
- Evite cadeias longas de redirecionamento (máximo 2 saltos)
- Corrija loops de redirecionamento imediatamente
- Audite redirecionamentos após migrações de site

### Canonical Tags

```html
<!-- Na página canônica e em duplicatas -->
<link rel="canonical" href="https://www.seusite.com.br/pagina-principal/" />
```

**Erros comuns:**
- Canonical apontando para página diferente da atual sem intenção
- Conflito entre canonical e hreflang
- Canonical em páginas paginadas apontando para a primeira página (use `rel="next/prev"` em vez disso)
- Falta de canonical em páginas com parâmetros de URL (filtros, ordenação)

## Core Web Vitals (2026)

### LCP — Largest Contentful Paint
**Alvo**: ≤ 2,5 segundos | Ruim: > 4,0 segundos

**Elemento medido**: maior elemento visível no viewport inicial (geralmente imagem hero ou H1)

**Otimizações:**
- Pré-carregue a imagem LCP: `<link rel="preload" as="image" href="hero.webp">`
- Use formatos modernos: WebP, AVIF (30-50% menores que JPEG)
- Implemente CDN para assets estáticos
- Elimine render-blocking CSS e JavaScript críticos
- Use `fetchpriority="high"` na imagem hero

### INP — Interaction to Next Paint ⚠️
**Alvo**: ≤ 200ms | Ruim: > 500ms

> **Atenção**: INP substituiu o FID em março de 2024. FID não é mais uma métrica de CWV.

**O que mede**: tempo desde a primeira interação do usuário até a próxima renderização visual

**Otimizações:**
- Minimize JavaScript de terceiros (analytics, chat, publicidade)
- Quebre tarefas longas de JavaScript (Long Tasks > 50ms)
- Use `scheduler.postTask()` para priorizar tarefas de UI
- Evite manipulação excessiva do DOM em resposta a cliques
- Audite com Chrome DevTools > Performance > INP

### CLS — Cumulative Layout Shift
**Alvo**: ≤ 0,1 | Ruim: > 0,25

**O que mede**: instabilidade visual causada por elementos que mudam de posição

**Causas comuns e soluções:**
- Imagens sem dimensões → sempre especifique `width` e `height`
- Anúncios sem espaço reservado → reserve espaço com CSS antes do carregamento
- Fontes web causando FOUT/FOIT → use `font-display: optional` ou pré-carregue fontes
- Conteúdo injetado dinamicamente acima do fold → evite ou reserve espaço

### Dados de Campo vs. Laboratório

| Tipo | Ferramentas | Confiabilidade |
|------|------------|----------------|
| Campo (CrUX) | GSC, PageSpeed Insights, CrUX API | Alta — dados reais de usuários |
| Laboratório | Lighthouse, WebPageTest, GTmetrix | Média — condições controladas |

**Regra**: dados de campo sempre têm prioridade. Laboratório serve para identificar problemas,
campo serve para confirmar impacto real.

## HTTPS e Segurança

### Verificações essenciais

- [ ] Todas as páginas em HTTPS com redirecionamento automático de HTTP → HTTPS
- [ ] Certificado SSL válido e com pelo menos 30 dias antes do vencimento
- [ ] Sem conteúdo misto (imagens, scripts ou CSS carregados via HTTP)
- [ ] HSTS implementado (`Strict-Transport-Security` header)
- [ ] Sem avisos de segurança no Google Search Console

### Headers de Segurança Recomendados

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configurar conforme site]
```

## Mobile-First

O Google usa indexação mobile-first desde 2019. O Googlebot rastreia a versão mobile.

### Verificações mobile

- [ ] Site responsivo ou com versão mobile dedicada equivalente
- [ ] Mesmo conteúdo e links na versão mobile e desktop
- [ ] Texto legível sem zoom (fonte mínima de 16px no body)
- [ ] Elementos tap-friendly (espaçamento mínimo de 48px entre elementos clicáveis)
- [ ] Sem pop-ups intrusivos que cobrem conteúdo principal no mobile
- [ ] Teste no Google Mobile-Friendly Test

## Performance de Servidor

### TTFB — Time to First Byte
**Alvo**: < 800ms (campo) | < 200ms (laboratório)

**Otimizações:**
- Use CDN para entregar conteúdo próximo ao usuário
- Implemente cache de servidor (Redis, Varnish, cache de CDN)
- Otimize consultas de banco de dados
- Use hospedagem com servidores no Brasil para audiência brasileira

### Compressão

- Ative Brotli (preferível a Gzip) no servidor
- Comprima HTML, CSS e JavaScript
- Verifique: `curl -I -H 'Accept-Encoding: br' https://seusite.com.br` → deve retornar `content-encoding: br`

## Hreflang (Para Sites Multilíngues)

Para sites em PT-BR que também têm versões em PT-PT ou outros idiomas:

```html
<link rel="alternate" hreflang="pt-BR" href="https://seusite.com.br/pagina/" />
<link rel="alternate" hreflang="pt-PT" href="https://seusite.pt/pagina/" />
<link rel="alternate" hreflang="en" href="https://seusite.com/page/" />
<link rel="alternate" hreflang="x-default" href="https://seusite.com/page/" />
```

**Erros comuns:**
- Hreflang unilateral (deve ser recíproco — todas as versões devem se referenciar mutuamente)
- Usar `pt` em vez de `pt-BR` quando o conteúdo é específico para o Brasil
- Conflito entre hreflang e canonical

## Checklist de Auditoria Técnica Completa

### Rastreamento
- [ ] robots.txt acessível e correto
- [ ] Sitemap XML válido e submetido no GSC
- [ ] Google Search Console configurado e sem erros críticos
- [ ] Bing Webmaster Tools configurado

### URLs e Estrutura
- [ ] Redirecionamentos corretos (301, sem cadeias longas)
- [ ] Canonical tags em todas as páginas
- [ ] Sem erros 404 em páginas importantes
- [ ] Sem páginas com código de status 5xx

### Performance
- [ ] LCP ≤ 2,5s no campo (CrUX)
- [ ] INP ≤ 200ms no campo (CrUX)
- [ ] CLS ≤ 0,1 no campo (CrUX)
- [ ] TTFB < 800ms
- [ ] Imagens em WebP ou AVIF
- [ ] Brotli/Gzip ativado

### Segurança
- [ ] HTTPS em todas as páginas
- [ ] Certificado SSL válido
- [ ] Sem conteúdo misto
- [ ] HSTS implementado

### Mobile
- [ ] Site responsivo
- [ ] Mesmo conteúdo mobile e desktop
- [ ] Sem pop-ups intrusivos no mobile

### Internacional (se aplicável)
- [ ] Hreflang correto e recíproco
- [ ] `pt-BR` como valor de hreflang (não apenas `pt`)
