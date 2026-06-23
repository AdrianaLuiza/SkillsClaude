# Template — Perfil de Marca (BRAND.md)

Use este template para gerar o arquivo `.agents/brand-profile.md` após a entrevista.
Substitua todos os campos entre colchetes com as informações do cliente.
Remova as seções não preenchidas apenas se o cliente confirmar que são irrelevantes.

---

```markdown
# Perfil de Marca — [Nome da Marca]

> **⚠️ ARQUIVO DE TRAVAMENTO DE MARCA**
> Este arquivo define a identidade oficial da marca.
> Todo conteúdo gerado pelo Claude DEVE respeitar estas diretrizes.
> Atualizado em: [data]

---

## 🏷️ Identidade

| Campo | Valor |
|-------|-------|
| **Nome** | [Nome oficial da marca] |
| **Setor** | [Segmento / nicho] |
| **Missão** | [Em uma frase: por que a marca existe] |
| **Posicionamento** | [Como se diferencia no mercado] |
| **Tagline** | [Slogan ou frase de posicionamento] |
| **Arquetipo principal** | [Ex: O Cuidador] |
| **Arquetipo secundário** | [Ex: O Sábio] |

---

## 👥 Público-Alvo

### Perfil primário
- **Quem é:** [Descrição demográfica e comportamental]
- **Situação de vida:** [Contexto em que chegam à marca]
- **Maior dor ou medo:** [O problema central que a marca resolve]
- **O que deseja:** [Resultado que busca]

### Como fala (linguagem do cliente)
> "[Exemplo de como o cliente descreve o problema com as próprias palavras]"
> "[Outro exemplo de voz do cliente]"

### Objeções comuns
- "[Objeção 1]"
- "[Objeção 2]"

---

## 🎭 Personalidade e Tom

### Adjetivos que definem a marca
[adjetivo 1] | [adjetivo 2] | [adjetivo 3] | [adjetivo 4] | [adjetivo 5]

### Escalas de tom (1=esquerda, 10=direita)

| Escala | Posição |
|--------|---------|
| Formal ↔ Descontraído | [número] |
| Sério ↔ Bem-humorado | [número] |
| Técnico ↔ Acessível | [número] |
| Tradicional ↔ Inovador | [número] |
| Distante ↔ Próximo | [número] |

### Tratamento com o cliente
- Pronome: [você / tu / senhor(a)]
- Voz: [primeira pessoa "nós" / nome da empresa / pessoal]
- Emojis: [sim, com moderação / não / sim, frequente]

### A marca É...
- [Característica 1]
- [Característica 2]
- [Característica 3]

### A marca NUNCA É...
- [Anti-característica 1]
- [Anti-característica 2]
- [Anti-característica 3]

---

## ✅ Voz — O que SEMPRE usar

### Palavras e expressões aprovadas
`[palavra 1]` `[palavra 2]` `[palavra 3]` `[expressão 1]` `[expressão 2]`

### Exemplos de frases no tom certo
> "[Frase exemplo 1 — no tom perfeito da marca]"
> "[Frase exemplo 2 — no tom perfeito da marca]"
> "[Frase exemplo 3 — no tom perfeito da marca]"

### Estilo de escrita
- Frases: [curtas e diretas / mais elaboradas]
- Parágrafos: [curtos, máx. 2-3 linhas / podem ser mais longos]
- Approach: [mais racional / mais emocional / equilíbrio]

---

## 🚫 Voz — O que JAMAIS usar

### Palavras e expressões proibidas
~~[palavra proibida 1]~~ ~~[palavra proibida 2]~~ ~~[expressão proibida 1]~~

### Temas absolutamente proibidos
- ❌ [Tema 1 — ex: política partidária]
- ❌ [Tema 2 — ex: crítica direta a concorrentes]
- ❌ [Tema 3]

### Contextos a evitar
- [Contexto 1 — ex: humor sobre [assunto]]
- [Contexto 2]

### Erros recorrentes no passado (a não repetir)
- [Erro 1 — o que foi feito de errado]
- [Erro 2]

---

## 🎨 Identidade Visual

### Paleta de Cores

| Papel | Cor | Hex |
|-------|-----|-----|
| Cor principal | [Nome da cor] | `#[hex]` |
| Cor secundária | [Nome da cor] | `#[hex]` |
| Cor de destaque/acento | [Nome da cor] | `#[hex]` |
| Fundo claro | [Nome da cor] | `#[hex]` |
| Texto principal | [Nome da cor] | `#[hex]` |

**Cores proibidas:** [Descrever cores que nunca devem ser usadas e por quê]

### Tipografia

| Uso | Fonte | Fallback |
|-----|-------|---------|
| Títulos e headings | [Nome da fonte] | [Fonte alternativa] |
| Texto corrido | [Nome da fonte] | [Fonte alternativa] |
| Destaque / CTA | [Nome da fonte] | [Fonte alternativa] |

### Estética Geral
- **Mood:** [Ex: clean e minimalista / vibrante e colorido / elegante e sofisticado]
- **Tipo de imagem predominante:** [pessoas / produtos / natureza / grafismos / lifestyle]
- **Referências visuais:** [Outras marcas com estética parecida]

---

## 💡 Pilares de Mensagem

Os 3-5 valores centrais que SEMPRE devem estar presentes na comunicação:

1. **[Pilar 1]** — [Descrição de 1 linha]
2. **[Pilar 2]** — [Descrição de 1 linha]
3. **[Pilar 3]** — [Descrição de 1 linha]
4. **[Pilar 4 — opcional]** — [Descrição de 1 linha]
5. **[Pilar 5 — opcional]** — [Descrição de 1 linha]

### A promessa central (se o cliente lembrasse UMA COISA)
> "[A única mensagem que resume tudo o que a marca representa]"

---

## 🏆 Provas Sociais Disponíveis

- [Número/estatística relevante — ex: "8 anos de mercado"]
- [Número de clientes, atendimentos, projetos]
- [Depoimento marcante de cliente — com permissão]
- [Premiações ou certificações]
- [Presença em mídia ou parceiros relevantes]

---

## 🔄 Histórico de Atualizações

| Data | O que mudou |
|------|-------------|
| [data de criação] | Perfil inicial criado |

---

> **Como atualizar este perfil:**
> Use a skill `brand-guidelines` e peça "atualizar perfil de marca".
> Nunca edite manualmente sem aprovação do responsável pela marca.
```

---

## Notas de preenchimento

### Campos mínimos obrigatórios (sem eles o lock não funciona)
- Nome da marca
- Tom (pelo menos 2 adjetivos e a escala formal/descontraído)
- Pelo menos 3 palavras/expressões aprovadas
- Pelo menos 3 proibições (palavras ou temas)
- Cor principal

### Campos que fazem a diferença qualitativa
- Exemplos de frases no tom certo (Claude vai usá-las como modelo)
- Erros recorrentes do passado (evita repetir)
- A promessa central em uma frase

### Quando NÃO preencher um campo
Se o cliente não souber, deixe o campo vazio e adicione a nota:
`[A definir — perguntar ao cliente na próxima revisão]`

Nunca invente ou assuma informações. Se não foi fornecido, está em branco.
