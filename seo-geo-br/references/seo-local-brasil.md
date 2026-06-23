# SEO Local Brasil: Guia Completo

Otimização para buscas locais no Brasil — Google Meu Negócio, citações, avaliações e busca com IA.

## Por que SEO Local importa no Brasil

- 46% de todas as buscas no Google têm intenção local
- Buscas "[serviço] perto de mim" crescem >150% ao ano no Brasil
- Google Maps é a segunda busca mais comum após o Google tradicional
- AI Overviews para buscas locais favorecem fortemente negócios com GMB otimizado

## Google Meu Negócio (GMB / Google Business Profile)

### Configuração inicial

**Nome do negócio:**
- Use o nome real do negócio — sem keywords extras (viola termos do Google)
- Errado: `Pizzaria Italia - A Melhor Pizza de SP`
- Correto: `Pizzaria Italia`

**Categoria:**
- Escolha a categoria primária mais específica possível
- Adicione categorias secundárias relevantes (máximo 9)
- Categorias impactam diretamente em quais buscas você aparece

**Endereço:**
- Exatamente igual ao que aparece no site e em todas as citações
- Para negócios sem atendimento presencial: oculte o endereço, configure área de atendimento

**Telefone:**
- Número local (com DDD) como principal
- Evite apenas 0800 como número principal

**Horários:**
- Atualize para feriados e eventos especiais
- Ative horários especiais para vésperas de feriados
- Horários incorretos = avaliações negativas

### Fotos e Vídeos

**Tipos de fotos obrigatórias:**
- Logo em fundo neutro (quadrado, mínimo 250x250px)
- Foto de capa atraente (1080x608px recomendado)
- Fachada externa (de dia, visível o nome)
- Interior do estabelecimento
- Produtos ou serviços em destaque
- Equipe em ação (humaniza o negócio)

**Frequência recomendada:** adicione pelo menos 2-3 fotos novas por mês.

**Vídeos:** máximo 30 segundos, mínimo 720p — tours virtuais performam muito bem.

### Posts no Google Meu Negócio

**Tipos de post disponíveis:**
- **Novidade**: conteúdo geral sobre o negócio
- **Oferta**: promoções com data de início e fim
- **Evento**: eventos presenciais ou online
- **Produto**: destaque de produto/serviço específico

**Boas práticas:**
- Frequência mínima: 1 post por semana
- Use fotos reais (não stock photos)
- Inclua CTA claro: "Ligar", "Reservar", "Saiba mais"
- Posts ficam ativos por 7 dias (exceto Eventos e Ofertas com data)

### Perguntas & Respostas (Q&A)

- O Q&A é público — qualquer pessoa pode fazer e responder perguntas
- **MONITORE DIARIAMENTE** — respostas de terceiros podem ser incorretas
- Crie suas próprias perguntas frequentes e responda oficialmente
- Inclua palavras-chave naturalmente nas respostas

## Consistência NAP (Name, Address, Phone)

NAP deve ser **idêntico** em todas as plataformas:

| Plataforma | Verificar em |
|-----------|--------------|
| Google Meu Negócio | business.google.com |
| Site oficial | Rodapé + página Contato |
| Facebook | Sobre > Informações de contato |
| Instagram | Bio |
| LinkedIn (empresa) | Sobre |
| Yelp Brasil | yelp.com.br |
| Foursquare | foursquare.com |
| Páginas Amarelas | paginasamarelas.com.br |
| TripAdvisor | (se aplicável) |
| iFood, Rappi, etc. | (se delivery) |

**Ferramentas de auditoria de citações:**
- Whitespark Local Citation Finder
- BrightLocal
- Busca manual no Google: `"nome do negócio" "endereço"`

## Avaliações no Google

As avaliações são o sinal local de confiança mais importante para usuários E para ranqueamento.

### Estratégia de captação de avaliações

**O que PODE fazer:**
- Pedir avaliações pessoalmente após uma boa experiência
- Enviar e-mail de acompanhamento pedindo avaliação
- Colocar QR Code no local físico linkando para a avaliação
- Incluir link de avaliação na assinatura de e-mail
- Mencionar avaliações nas redes sociais

**O que NÃO pode fazer (viola termos do Google):**
- Oferecer desconto, brinde ou qualquer incentivo por avaliação
- Pedir apenas avaliações positivas (filtrar negativas é proibido)
- Usar estações/tablets no próprio estabelecimento para que clientes avaliem
- Comprar avaliações falsas

### Respondendo avaliações

**Regra de ouro:** responda TODAS as avaliações — positivas e negativas.

**Avaliações positivas:**
```
Obrigado, [Nome]! Ficamos felizes em saber que [mencione algo específico da avaliação].
Esperamos vê-lo novamente em breve! 😊
```

**Avaliações negativas (template):**
```
Olá, [Nome]. Agradecemos seu feedback — ele é muito importante para nós.
Lamentamos que sua experiência [mencione o problema específico] não tenha sido a esperada.
Por favor, entre em contato conosco diretamente pelo [telefone/e-mail] para que possamos
resolver isso da melhor forma. — [Nome do responsável]
```

**Prazo**: responda em até 24 horas (48h no máximo).

## Schema LocalBusiness em PT-BR

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Nome do Negócio",
  "description": "Descrição clara do negócio em português",
  "url": "https://www.seusite.com.br",
  "telephone": "+55-11-1234-5678",
  "email": "contato@seusite.com.br",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Exemplo, 123",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01310-100",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -23.561684,
    "longitude": -46.655981
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "13:00"
    }
  ],
  "priceRange": "$$",
  "image": "https://www.seusite.com.br/images/fachada.jpg",
  "sameAs": [
    "https://www.facebook.com/seunegocio",
    "https://www.instagram.com/seunegocio",
    "https://maps.app.goo.gl/seunegocio"
  ]
}
```

**Para subcategorias:**
- Restaurante: `"@type": "Restaurant"` — adicione `"servesCuisine"`, `"menu"`, `"acceptsReservations"`
- Médico: `"@type": "MedicalClinic"` ou `"Physician"`
- Advogado: `"@type": "LegalService"` com `"areaServed"`
- Loja: `"@type": "Store"` com `"paymentAccepted"`, `"currenciesAccepted": "BRL"`

## Pack Local e Ranqueamento no Google Maps

### Fatores de ranqueamento local (por peso)

1. **Relevância** — quão bem o perfil GMB corresponde à busca
2. **Distância** — distância física entre o negócio e o buscador
3. **Proeminência** — autoridade geral: avaliações, backlinks, citações

### Táticas para melhorar ranqueamento local

**Relevância:**
- Categoria GMB ultra-específica
- Descrição do GMB com palavras-chave naturais
- Produtos/Serviços detalhados no GMB
- Posts regulares com palavras-chave de nicho

**Proeminência:**
- Volume e nota de avaliações (meta: 4,5+ com 50+ avaliações)
- Citações consistentes em diretórios relevantes
- Backlinks de sites locais (associações comerciais, portais da cidade, imprensa local)
- Cobertura em mídia local online

**Página local no site:**
- URL dedicada por localização (ex: `/sao-paulo/`, `/campinas/`)
- Embed do Google Maps
- Schema LocalBusiness
- Conteúdo único por local (não copie/cole a mesma descrição)
- Link bidirecional: site → GMB, GMB → site

## GEO Local: AI Overviews para Buscas Locais

Para buscas como "dentista em Campinas" ou "restaurante japonês SP", o Google AIO frequentemente
aparece com uma lista de negócios. Para aparecer:

1. **GMB otimizado** é pré-requisito absoluto
2. **Avaliações altas** (4,5+) com volume relevante (20+)
3. **Fotos recentes** e de qualidade
4. **Conteúdo local na página** com schema correto
5. **Menções em portais locais**: "O Dia", "A Gazeta", site da prefeitura, portais de bairro

## Checklist SEO Local Completo

### Google Meu Negócio
- [ ] Perfil verificado
- [ ] Nome, endereço e telefone corretos e completos
- [ ] Categoria primária específica + categorias secundárias
- [ ] Horários completos e atualizados
- [ ] Mínimo de 10 fotos de qualidade
- [ ] Pelo menos 1 post por semana
- [ ] Q&A monitorado e respondido
- [ ] Website linkado corretamente

### Avaliações
- [ ] Processo de captação de avaliações ativo
- [ ] 100% das avaliações respondidas
- [ ] Nota média ≥ 4,5 (se < 4,0, prioridade crítica)
- [ ] Avaliações recentes (últimos 30 dias) presentes

### Consistência NAP
- [ ] NAP idêntico no GMB e no site
- [ ] NAP idêntico nos principais diretórios brasileiros
- [ ] Auditoria de citações realizada

### On-Page Local
- [ ] Página de localização com schema LocalBusiness
- [ ] Google Maps embedado
- [ ] Endereço e telefone no rodapé do site
- [ ] Conteúdo local único (não duplicado entre localizações)
