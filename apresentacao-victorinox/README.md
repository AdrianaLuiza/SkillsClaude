# Proposta Victorinox — Experiência Camburi

Apresentação institucional da Pousada Camburi para a Victorinox Brasil.
Revisão 04 — refeita a partir da Revisão 03 em PDF.

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `Proposta_Victorinox_Experiencia_Camburi_V4.pdf` | Entregável em PDF (A4 paisagem, 12 páginas) |
| `Proposta_Victorinox_Experiencia_Camburi_V4.pptx` | Entregável editável em PowerPoint |
| `deck.html` | Fonte da apresentação (HTML + CSS) |
| `build.py` | Renderiza `deck.html` em PDF via Chromium/Playwright |
| `extract_layout.py` | Extrai a geometria renderizada de `deck.html` em `layout.json` |
| `build_pptx.js` | Gera o `.pptx` a partir de `layout.json` |
| `fontes-para-instalar/` | As fontes em `.ttf`, para quem for editar o `.pptx` |
| `assets/logo-pousada-camburi.png` | Logo oficial da Pousada Camburi (fundo removido) |
| `assets/logo-victorinox.svg` | Logo da Victorinox — redesenho provisório |
| `fonts/` | EB Garamond e Jost (subset latin, WOFF2) |

## Tipografia

| Uso | Fonte |
| --- | --- |
| Títulos, citações, números e tabelas | **EB Garamond** (400/500/600 + itálico) |
| Texto corrido, rótulos e microtipografia | **Jost** (300/400/500) |

A Cormorant Garamond foi testada e descartada: o circunflexo dos seus glifos
`ê`/`Ê` fica solto e alto demais, o que compromete qualquer texto em português.

## Como reconstruir o PDF

```bash
pip install playwright
python3 build.py
```

O caminho do Chromium está em `CHROMIUM` no topo de `build.py`.

## Como reconstruir o PPTX

```bash
python3 extract_layout.py   # deck.html -> layout.json (+ logos rasterizadas)
node build_pptx.js          # layout.json -> .pptx
```

O `.pptx` não é uma exportação do PDF: cada bloco de texto vira uma caixa de
texto nativa, editável no PowerPoint. Para que as posições correspondam ao
layout do CSS sem serem recalculadas à mão, `extract_layout.py` abre o
`deck.html` no Chromium e lê a geometria de cada elemento já renderizado —
retângulos, filetes, logos e trechos de texto com a formatação de cada um.

Duas diferenças conhecidas em relação ao PDF, ambas por limitação do formato:

- O PowerPoint reconhece apenas "normal" e "negrito" por família, então os
  pesos intermediários viraram famílias próprias (`EB Garamond Medium`,
  `Jost Light`, `Jost Medium`) — ver `fontes-para-instalar/LEIA-ME.md`.
- A quebra de linha pode cair uma palavra antes ou depois, porque o
  PowerPoint compõe o texto de forma um pouco diferente do navegador. As
  caixas levam uma folga de 0,05 pol. para absorver isso.

## Logos

Ambas vivem em um único `<symbol>` no topo de `deck.html`; as 13 ocorrências ao
longo das páginas apenas referenciam esses símbolos via `<use>`. Para trocar
qualquer uma delas basta editar o símbolo e ajustar o `viewBox` — o layout não
precisa de nenhuma outra mudança.

- **`#logo-pc` — Pousada Camburi.** Arquivo oficial fornecido pela pousada. O
  original vinha em bitmap sobre fundo `#F7F7F7`; o fundo foi removido
  recuperando o alfa a partir do desvio de cor e desfazendo a composição, de
  modo que a textura de pincel foi preservada. A 1022 px de largura, sobra
  resolução para os dois usos (78 mm na capa, ~41 mm no cabeçalho).
- **`#logo-vx` — Victorinox.** Ainda é um redesenho aproximado em SVG, feito
  por não termos o arquivo oficial. Para substituí-lo, cole o SVG oficial
  dentro do símbolo e ajuste o `viewBox`.

## O que mudou em relação à Revisão 03

- Removidos todos os espaços reservados para imagens (as caixas cinza).
- Corrigidos os textos sobrepostos da capa e da página 03.
- Formato alterado de A4 retrato para A4 paisagem, eliminando as áreas vazias.
- Revisão ortográfica e de redação em todas as páginas.
- Logo da Pousada Camburi no topo e logo da Victorinox no rodapé de cada página.
- Tipografia refeita: EB Garamond + Jost no lugar de Playfair Display + Inter.
- Logo oficial da Pousada Camburi no lugar do redesenho provisório.
