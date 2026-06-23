---
name: brand-guidelines
description: >
  Cria, identifica e trava a identidade de marca de um cliente, garantindo que todo
  conteúdo gerado pelo Claude respeite automaticamente as diretrizes. Use quando:
  (1) o usuário pede para criar identidade de marca ou brand guidelines,
  (2) o usuário quer que Claude "respeite a marca" em todo conteúdo,
  (3) Claude não tem contexto de marca e vai gerar conteúdo de marketing,
  (4) o usuário pede para "travar", "fixar", "salvar" ou "padronizar" a marca,
  (5) existe conteúdo de marca inconsistente que precisa ser unificado,
  (6) o usuário menciona cor, fonte, tom de voz, o que pode ou não dizer pela marca.
license: MIT
compatibility: Works with Claude Code and similar AI coding assistants.
allowed-tools: Read Write
metadata:
  author: alusulina
  version: 1.0.0
---

# Brand Guidelines — Criação e Travamento de Marca

Esta skill cria a identidade de marca de um cliente através de entrevista estruturada,
gera um arquivo permanente de diretrizes e garante que **todo conteúdo futuro respeite
automaticamente** essas regras — sem precisar explicar de novo.

## Fase 1 — Verificação: perfil já existe?

**SEMPRE faça isso primeiro, antes de qualquer coisa:**

- [ ] Verificar se `.agents/brand-profile.md` existe no projeto
- [ ] Se existir: ler o arquivo completo antes de continuar
- [ ] Se existir: confirmar com o usuário se quer atualizar ou apenas aplicar

Se o arquivo existir, ir diretamente para a [Fase 4 — Enforcement](#fase-4--enforcement).
Se não existir, iniciar a [Fase 2 — Entrevista de Descoberta](#fase-2--entrevista-de-descoberta).

---

## Fase 2 — Entrevista de Descoberta

Conduza a entrevista de forma **conversacional e progressiva**:
- Apresente o processo ao usuário antes de começar
- Faça **no máximo 3 perguntas por vez**
- Use linguagem simples (o cliente pode ser não-técnico)
- Se a resposta for vaga, use perguntas de aprofundamento
- Ao terminar cada bloco, resuma o que capturou antes de avançar

Ver banco completo de perguntas em [references/brand-discovery-questions.md](references/brand-discovery-questions.md).

### Bloco 1 — Identidade

- Qual é o nome da marca/empresa?
- Em uma frase: o que vocês fazem e para quem?
- Se a marca fosse uma pessoa, como ela seria descrita em 3 adjetivos?

### Bloco 2 — Público

- Quem é o cliente ideal? (perfil, idade, situação de vida)
- Qual é a maior dor ou medo que ele tem, que a marca resolve?
- Que palavras ou expressões esse cliente usa para descrever o problema?

### Bloco 3 — Personalidade e Tom

- Escolha entre os pares (pode marcar quantos quiser):
  - Formal ↔ Descontraído
  - Sério ↔ Bem-humorado
  - Técnico ↔ Acessível
  - Tradicional ↔ Inovador
  - Próximo ↔ Institucional
- A marca trata o cliente como "você" ou "tu"? (ou outra forma?)
- Se a marca fosse um canal de TV, qual seria? Por quê?

### Bloco 4 — Voz Verbal

- Cite 3-5 palavras ou expressões que **definem** a voz da marca (que sempre devem aparecer)
- Cite 3-5 palavras ou expressões que **nunca** devem ser usadas
- Tem um slogan ou tagline? Qual é a ideia por trás dele?

### Bloco 5 — Proibições Absolutas

- Existem temas, assuntos ou contextos que a marca NUNCA deve abordar?
- Já aconteceu alguma vez de um conteúdo "não soar como vocês"? Como foi?
- Tem concorrentes cujo estilo de comunicação vocês querem se distanciar?

### Bloco 6 — Visual

- Quais são as cores principais da marca? (hex se possível, ou descrição: "azul marinho escuro")
- Qual é a fonte dos títulos? E do texto normal?
- Como você descreveria o visual geral: clean, vibrante, elegante, rústico, moderno?

### Bloco 7 — Pilares de Mensagem

- Quais são os 3-5 benefícios ou valores que a marca SEMPRE deve comunicar?
- Qual é a única coisa que, se o cliente lembrasse, seria suficiente?
- Tem alguma prova social forte? (números, depoimentos, selos, prêmios)

---

## Fase 3 — Geração do Perfil

Após completar a entrevista:

- [ ] Resumir todas as informações coletadas em formato estruturado
- [ ] Apresentar o resumo ao usuário para aprovação
- [ ] **Aguardar confirmação** antes de salvar
- [ ] Salvar como `.agents/brand-profile.md` (criar o diretório `.agents/` se necessário)
- [ ] Informar ao usuário que o perfil está salvo e como o lock funciona

Ver template em [references/brand-profile-template.md](references/brand-profile-template.md).

### Mensagem pós-criação (dizer ao usuário):

> "✅ Perfil de marca salvo em `.agents/brand-profile.md`.
>
> A partir de agora, **todo conteúdo que eu gerar neste projeto** vai respeitar
> automaticamente essas diretrizes — cores, tom, vocabulário, pilares e proibições.
>
> Se quiser atualizar alguma coisa, é só pedir. Para ver as diretrizes ativas, leia o arquivo."

---

## Fase 4 — Enforcement

**Esta é a fase mais importante. Aplica-se sempre que o perfil existir.**

Antes de gerar qualquer conteúdo (post, legenda, email, copy, campanha, script):

- [ ] Ler `.agents/brand-profile.md` completamente
- [ ] Identificar: cores ativas, fonte, tom, vocabulário permitido, proibições
- [ ] Gerar o conteúdo respeitando todas as diretrizes
- [ ] Ao final, incluir uma nota de conformidade:

```
[Conformidade de marca: ✅ tom [adjetivo], ✅ vocabulário permitido, ✅ sem proibições]
```

Se o conteúdo solicitado **conflitar** com as diretrizes (ex: cliente pede tom "agressivo"
mas a marca é "acolhedora"), sinalizar o conflito e propor alternativa dentro da marca.

---

## Quick Reference

### Estrutura do `.agents/brand-profile.md`

```markdown
# Perfil de Marca — [Nome da Marca]

## Identidade
- Nome: ...
- Setor: ...
- Missão: ...
- Tagline: ...

## Público
- Perfil: ...
- Dor principal: ...
- Linguagem que usa: ...

## Personalidade
- Adjetivos: ...
- Tom: ...
- Tratamento: ...

## Voz — O que SEMPRE usar
- Palavras/expressões: ...
- Exemplos de frases no tom certo: ...

## Voz — O que JAMAIS usar
- Palavras proibidas: ...
- Temas proibidos: ...
- Contextos a evitar: ...

## Visual
- Cores: ...
- Tipografia: ...
- Estética geral: ...

## Pilares de Mensagem
1. ...
2. ...
3. ...

## Provas Sociais
- ...
```

---

## Reference Files

- [Brand Discovery Questions](references/brand-discovery-questions.md) — Banco completo de perguntas com versões simples e profundas por bloco
- [Voice Archetypes](references/voice-archetypes.md) — 12 arquetipos de voz com vocabulário, exemplos e anti-padrões
- [Brand Profile Template](references/brand-profile-template.md) — Template completo do arquivo BRAND.md com exemplos preenchidos

---

## Ground Rules

- SEMPRE verificar `.agents/brand-profile.md` antes de gerar qualquer conteúdo
- SEMPRE ler o perfil completo, não apenas partes dele
- NUNCA violar proibições listadas em "O que JAMAIS usar"
- NUNCA perguntar mais de 3 pontos de uma vez durante a entrevista
- NUNCA salvar o perfil sem confirmação explícita do usuário
- SEMPRE incluir nota de conformidade ao final de conteúdos gerados
- PREFER perguntas simples e diretas — o cliente pode não ter linguagem de branding
- PREFER aprofundar respostas vagas antes de avançar para o próximo bloco
- Se conteúdo solicitado conflitar com a marca: SINALIZE e proponha alternativa
- NUNCA ignorar o perfil mesmo que o usuário peça algo que o contradiga — explique o conflito
