# Schema Markup: Guia com Exemplos PT-BR

Dados estruturados para sites brasileiros — exemplos prontos para usar.

## Por que Schema Markup importa em 2026

- **Featured Snippets e Rich Results**: schema aumenta chance de rich snippets no Google
- **GEO / AI Overviews**: dados estruturados ajudam IAs a interpretar e citar seu conteúdo
- **Pesquisa por voz**: schema melhora respostas para perguntas em PT-BR
- **Knowledge Panel**: schema Organization e Person alimentam o Knowledge Graph do Google

## Implementação

### Via JSON-LD (recomendado)

```html
<head>
  <script type="application/ld+json">
  {
    // seu schema aqui
  }
  </script>
</head>
```

### Via Google Tag Manager

Para sites sem acesso direto ao HTML, use GTM com variável de JavaScript customizada.

### Validação

- **Google Rich Results Test**: search.google.com/test/rich-results
- **Schema.org Validator**: validator.schema.org
- **Google Search Console**: relatório de Melhorias com alertas de erros

## Templates por Tipo de Negócio

### 1. Organização / Empresa (base para todos)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nome da Empresa",
  "legalName": "Razão Social Ltda",
  "url": "https://www.seusite.com.br",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.seusite.com.br/logo.png",
    "width": 400,
    "height": 100
  },
  "description": "Descrição clara da empresa em português",
  "foundingDate": "2010",
  "telephone": "+55-11-1234-5678",
  "email": "contato@seusite.com.br",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Paulista, 1234, Conjunto 56",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01310-100",
    "addressCountry": "BR"
  },
  "sameAs": [
    "https://www.facebook.com/suaempresa",
    "https://www.instagram.com/suaempresa",
    "https://www.linkedin.com/company/suaempresa",
    "https://twitter.com/suaempresa",
    "https://www.youtube.com/c/suaempresa"
  ],
  "identifier": {
    "@type": "PropertyValue",
    "name": "CNPJ",
    "value": "XX.XXX.XXX/XXXX-XX"
  }
}
```

### 2. Negócio Local

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Nome do Negócio",
  "image": [
    "https://www.seusite.com.br/fachada.jpg",
    "https://www.seusite.com.br/interior.jpg"
  ],
  "url": "https://www.seusite.com.br",
  "telephone": "+55-11-1234-5678",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua das Flores, 456",
    "addressLocality": "Campinas",
    "addressRegion": "SP",
    "postalCode": "13010-000",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -22.906847,
    "longitude": -47.063240
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "12:00"
    }
  ],
  "hasMap": "https://maps.app.goo.gl/...",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "areaServed": {
    "@type": "City",
    "name": "Campinas"
  }
}
```

### 3. Artigo de Blog / Notícia

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Título do Artigo com Palavra-chave",
  "description": "Meta description do artigo — resumo de 150-160 caracteres",
  "image": {
    "@type": "ImageObject",
    "url": "https://www.seusite.com.br/artigo-imagem-principal.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Nome do Autor",
    "url": "https://www.seusite.com.br/autor/nome",
    "sameAs": [
      "https://linkedin.com/in/nome-autor",
      "http://lattes.cnpq.br/..."
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nome do Site",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.seusite.com.br/logo.png"
    }
  },
  "datePublished": "2026-01-15T08:00:00-03:00",
  "dateModified": "2026-06-20T10:00:00-03:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.seusite.com.br/artigos/slug-do-artigo"
  },
  "inLanguage": "pt-BR",
  "wordCount": 2500,
  "keywords": ["palavra-chave 1", "palavra-chave 2", "palavra-chave 3"]
}
```

### 4. FAQ (FAQPage)

> **Nota 2026**: FAQPage foi rebaixado para Info-level no Google (maio 2026) — não gera mais
> rich snippets tão frequentemente, mas ainda é válido para GEO e organização semântica.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é [termo em português]?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Resposta completa e autocontida de 134–167 palavras. Inclua dados específicos. Evite 'cliffhangers' — a resposta deve ser útil por si só."
      }
    },
    {
      "@type": "Question",
      "name": "Como funciona [processo] no Brasil?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Explicação do processo adaptada ao contexto brasileiro, com referências à legislação, órgãos reguladores ou normas locais quando relevante."
      }
    }
  ]
}
```

### 5. Produto (E-commerce)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nome do Produto",
  "image": [
    "https://www.seusite.com.br/produto-frente.jpg",
    "https://www.seusite.com.br/produto-lateral.jpg"
  ],
  "description": "Descrição detalhada do produto em português",
  "sku": "SKU-12345",
  "brand": {
    "@type": "Brand",
    "name": "Nome da Marca"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://www.seusite.com.br/produto/slug",
    "priceCurrency": "BRL",
    "price": "299.90",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Nome da Loja"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "89",
    "bestRating": "5"
  }
}
```

### 6. Médico / Clínica

```json
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr(a). Nome Completo",
  "description": "Especialidade e experiência em português",
  "medicalSpecialty": "https://schema.org/Dermatology",
  "url": "https://www.clinica.com.br/dr-nome",
  "telephone": "+55-11-1234-5678",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua da Clínica, 789, Sala 10",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01234-000",
    "addressCountry": "BR"
  },
  "memberOf": {
    "@type": "MedicalOrganization",
    "name": "Nome da Clínica"
  },
  "identifier": {
    "@type": "PropertyValue",
    "name": "CRM",
    "value": "CRM-SP 123456"
  },
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "degree",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Universidade de São Paulo"
    }
  }
}
```

### 7. Advogado / Escritório Jurídico

```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "Nome do Escritório",
  "description": "Áreas de atuação em direito — adaptado para PT-BR",
  "url": "https://www.escritorio.com.br",
  "telephone": "+55-11-9876-5432",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Brasil, 100, 5º andar",
    "addressLocality": "Rio de Janeiro",
    "addressRegion": "RJ",
    "postalCode": "20040-020",
    "addressCountry": "BR"
  },
  "areaServed": [
    {"@type": "State", "name": "Rio de Janeiro"},
    {"@type": "State", "name": "São Paulo"}
  ],
  "knowsAbout": [
    "Direito Trabalhista",
    "Direito do Consumidor",
    "Direito Empresarial"
  ],
  "employee": {
    "@type": "Person",
    "name": "Dr(a). Nome do Advogado",
    "jobTitle": "Advogado",
    "identifier": {
      "@type": "PropertyValue",
      "name": "OAB",
      "value": "OAB/RJ 123456"
    }
  }
}
```

### 8. WebSite com SearchAction (Sitelinks Search Box)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Nome do Site",
  "url": "https://www.seusite.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.seusite.com.br/?s={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "pt-BR"
}
```

### 9. Breadcrumb (obrigatório em páginas internas)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://www.seusite.com.br"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Categoria",
      "item": "https://www.seusite.com.br/categoria"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Título da Página Atual"
    }
  ]
}
```

## Erros Comuns de Schema no Brasil

| Erro | Problema | Correção |
|------|---------|----------|
| `"addressCountry": "Brasil"` | Formato inválido | Use `"BR"` (ISO 3166-1 alpha-2) |
| `"addressRegion": "São Paulo"` | Pode ser ambíguo | Use `"SP"` |
| `"priceCurrency": "R$"` | Formato inválido | Use `"BRL"` |
| Datas em formato `DD/MM/AAAA` | Inválido para schema | Use ISO 8601: `2026-06-23` |
| Fuso horário ausente | Ambiguidade | Use `2026-06-23T08:00:00-03:00` |
| HowTo para rich results | Depreciado | Remova ou use apenas para estrutura interna |

## Múltiplos Schemas na Mesma Página

É válido e recomendado combinar schemas:

```html
<!-- Página de artigo com autor e FAQ -->
<script type="application/ld+json">{"@type": "Article", ...}</script>
<script type="application/ld+json">{"@type": "FAQPage", ...}</script>
<script type="application/ld+json">{"@type": "BreadcrumbList", ...}</script>
```

Ou use `@graph` para combinar em um único bloco:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "WebPage", ...},
    {"@type": "Article", ...},
    {"@type": "BreadcrumbList", ...}
  ]
}
```

## Schemas Depreciados — NUNCA implementar

| Schema | Status | Alternativa |
|--------|--------|-------------|
| `HowTo` rich results | Depreciado (maio 2023) | Use apenas para estrutura semântica interna |
| `FAQPage` rich snippets | Info-level (maio 2026) | Ainda válido para GEO, não para rich snippets |
| `NewsArticle` para conteúdo evergreen | Não recomendado | Use `Article` ou `BlogPosting` |
| `Product` sem `Offer` | Incompleto | Sempre inclua `Offer` com preço |
