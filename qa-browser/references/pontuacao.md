# Critérios de pontuação QA

O score de saúde vai de 0 a 100. Cada categoria tem um peso e critérios objetivos.

---

## Funcional (25 pontos)

Verifica se os fluxos principais do sistema funcionam sem erro.

| Pontos | Critério |
|--------|----------|
| 25 | Todos os fluxos críticos funcionam sem erro |
| 20 | Fluxos principais funcionam, alguns secundários com problema menor |
| 15 | Fluxo principal funciona, mas com comportamento inesperado |
| 10 | Fluxo principal funciona apenas parcialmente |
| 5 | Fluxo principal tem falhas críticas mas o site carrega |
| 0 | Site não carrega ou fluxo principal completamente quebrado |

**O que testar:**
- Login e logout
- Fluxo de compra/conversão principal
- Cadastro de novo usuário
- Funcionalidade mais usada do produto

---

## Console (20 pontos)

Erros no console JavaScript indicam problemas reais que afetam usuários.

| Pontos | Critério |
|--------|----------|
| 20 | Zero erros de console |
| 15 | Apenas warnings menores (deprecações, logs de dev) |
| 10 | 1-2 erros não críticos (recurso não encontrado, minor TypeError) |
| 5 | Erros que afetam funcionalidade mas não travam o site |
| 0 | Erros críticos (scripts quebrados, APIs falhando) |

**Classificação de erros:**
- **Crítico (0 pontos):** `TypeError: Cannot read properties of undefined`, `ReferenceError`, APIs retornando 500, scripts não carregando
- **Moderado (-5 pontos):** 404 em recursos não essenciais, warnings de deprecação de API importante
- **Menor (-2 pontos):** logs de desenvolvimento esquecidos, warnings de pacotes desatualizados

---

## Acessibilidade (15 pontos)

Verifica se o site é usável por pessoas com necessidades especiais.

| Pontos | Critério |
|--------|----------|
| 15 | Todos os elementos têm labels, alt texts, roles corretos; navegação por teclado funciona |
| 12 | Maioria dos elementos acessíveis, alguns gaps menores |
| 8 | Labels faltando em alguns campos; navegação por teclado básica funciona |
| 4 | Problemas significativos de acessibilidade; difícil usar sem mouse |
| 0 | Inacessível: sem labels, sem contraste, impossível navegar por teclado |

**O que verificar:**
- Inputs têm `<label>` ou `aria-label`
- Imagens têm `alt` descritivo (não `alt="image1.jpg"`)
- Botões têm texto ou `aria-label`
- Contraste de cores (texto deve ter razão ≥ 4.5:1)
- Hierarquia de headings lógica (não pula de h1 para h4)
- Elementos interativos alcançáveis e ativáveis pelo teclado

---

## UX (15 pontos)

Verifica se a experiência do usuário é clara e eficiente.

| Pontos | Critério |
|--------|----------|
| 15 | Feedback imediato para ações; mensagens de erro claras; fluxo intuitivo |
| 12 | Boa UX na maioria dos casos; algumas mensagens pouco claras |
| 8 | Feedback inconsistente; algumas ações sem retorno visual |
| 4 | Usuário pode ficar perdido; mensagens de erro genéricas ou ausentes |
| 0 | Sem feedback de ações; erros silenciosos; interface confusa |

**O que verificar:**
- Loading states durante operações assíncronas
- Mensagens de sucesso após ações importantes
- Mensagens de erro descritivas (não apenas "Erro 500")
- Validação de formulários em tempo real (ou ao submeter)
- Confirmação antes de ações destrutivas (deletar, cancelar)

---

## Performance (10 pontos)

Tempo de carregamento percebido pelo usuário.

| Pontos | Critério |
|--------|----------|
| 10 | Carregamento < 1.5s; interativo < 3s |
| 8 | Carregamento < 2.5s; interativo < 4s |
| 6 | Carregamento < 4s; interativo < 6s |
| 3 | Carregamento 4-8s |
| 0 | Carregamento > 8s ou timeout |

**Como medir:**
- Registre o tempo entre `browser_navigate` e o momento em que a página fica usável
- Verifique se há requisições de rede lentas em `browser_network_requests()`
- Observe se há bloqueios por scripts pesados (JS síncrono grande)

---

## Visual (10 pontos)

Layout, espaçamentos e renderização visual.

| Pontos | Critério |
|--------|----------|
| 10 | Layout perfeito em todos os tamanhos; elementos bem posicionados |
| 8 | Layout correto com alguns ajustes menores em breakpoints específicos |
| 6 | Problemas visuais em mobile ou tamanhos extremos |
| 3 | Sobreposições, elementos cortados, layout quebrado em algum breakpoint |
| 0 | Layout completamente quebrado; inutilizável visualmente |

**O que verificar em screenshots:**
- Elementos se sobrepondo
- Texto cortado ou extrapolando o container
- Imagens não carregando (ícone de imagem quebrada)
- Botões muito pequenos em mobile (mín. 44×44px)
- Alinhamento inconsistente

---

## Conteúdo (5 pontos)

Textos, imagens e dados corretos.

| Pontos | Critério |
|--------|----------|
| 5 | Conteúdo correto, atualizado e sem placeholder |
| 3 | Conteúdo majoritariamente correto, alguns textos desatualizados |
| 1 | Textos placeholder visíveis ("Lorem ipsum", "[NOME]", "Teste") |
| 0 | Conteúdo incorreto, enganoso ou completamente placeholder |

**O que verificar:**
- Textos "Lorem ipsum" ou placeholder
- "[NOME]", "[DATA]", "[VALOR]" não substituídos
- Preços ou datas incorretos
- Imagens de placeholder (cinza, "no image")
- Versão ou copyright desatualizado

---

## Interpretando o score final

| Score | Status | Ação recomendada |
|-------|--------|------------------|
| 90–100 | Excelente | Deploy tranquilo |
| 85–89 | Aprovado | Deploy com confiança |
| 75–84 | Aprovado com ressalvas | Deploy + ticket para correções no próximo sprint |
| 65–74 | Atenção | Deploy apenas com aprovação explícita do responsável |
| < 65 | Bloqueante | Não faça deploy — corrija primeiro |

---

## Notas sobre o score

- O score é uma ferramenta de apoio à decisão, não uma decisão automática
- Um único bug crítico pode bloquear o deploy mesmo com score alto (ex: fluxo de pagamento quebrado com 80% nos outros critérios)
- Contexto importa: um site de conteúdo estático tolera mais pontos perdidos em "Funcional" do que um e-commerce
- Documente sempre a justificativa quando o score e a recomendação divergem
