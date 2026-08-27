# Proposta Victorinox — Experiência Camburi

Apresentação institucional da Pousada Camburi para a Victorinox Brasil.
Revisão 04 — refeita a partir da Revisão 03 em PDF.

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `Proposta_Victorinox_Experiencia_Camburi_V4.pdf` | Entregável final (A4 paisagem, 12 páginas) |
| `deck.html` | Fonte da apresentação (HTML + CSS, autocontido) |
| `build.py` | Renderiza `deck.html` em PDF via Chromium/Playwright |
| `assets/logo-pousada-camburi.svg` | Logo da Pousada Camburi (vetor) |
| `assets/logo-victorinox.svg` | Logo da Victorinox (vetor) |
| `fonts/` | Playfair Display, Inter e Sacramento (subset latin, WOFF2) |

## Como reconstruir o PDF

```bash
pip install playwright
python3 build.py
```

O caminho do Chromium está em `CHROMIUM` no topo de `build.py`.

## Substituir as logos pelos arquivos oficiais

As duas logos foram redesenhadas em SVG porque este ambiente não tem acesso de
rede para baixar os arquivos originais. Para trocá-las pelos oficiais, edite os
dois `<symbol>` no início de `deck.html` (`#logo-pc` e `#logo-vx`) — basta colar
o conteúdo do SVG oficial dentro do símbolo correspondente e ajustar o
`viewBox`. Nada mais no layout precisa mudar: todas as 12 páginas referenciam os
símbolos via `<use>`.

## O que mudou em relação à Revisão 03

- Removidos todos os espaços reservados para imagens (as caixas cinza).
- Corrigidos os textos sobrepostos da capa e da página 03.
- Formato alterado de A4 retrato para A4 paisagem, eliminando as áreas vazias.
- Revisão ortográfica e de redação em todas as páginas.
- Logo da Pousada Camburi no topo e logo da Victorinox no rodapé de cada página.
