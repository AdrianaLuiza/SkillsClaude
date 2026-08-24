# Pekar Arte em Jóias — materiais do projeto

## Apresentação de encerramento da Etapa 1

`Pekar-Encerramento-Etapa-1.pptx` — 14 slides, linguagem para leigos em rede social,
com notas do apresentador em cada slide.

Período coberto: 30/07/2026 a 24/08/2026.

### Como regerar / editar

O arquivo é gerado por código, não editado à mão:

```bash
npm install pptxgenjs
node build.js
```

Isso reescreve `Pekar-Encerramento-Etapa-1.pptx` na mesma pasta.

Para conferir o resultado visualmente:

```bash
soffice --headless --convert-to pdf Pekar-Encerramento-Etapa-1.pptx
pdftoppm -jpeg -r 110 Pekar-Encerramento-Etapa-1.pdf slide
```

### Paleta e tipografia usadas

| Papel | Valor |
|---|---|
| Fundo escuro (dominante) | `#2E2622` |
| Acento dourado | `#B08D57` |
| Areia (apoio) | `#EFE7DE` |
| Card claro | `#F7F2EC` |
| Títulos | Cambria |
| Corpo | Calibri |

As cores são uma aproximação da identidade Pekar. Se a identidade oficial
(`identidade-pekar.docx`) tiver valores diferentes, trocar as constantes no topo
de `build.js` — todo o deck se ajusta.

### Estrutura dos slides

1. Capa
2. Visão geral — as 5 frentes da etapa
3. Linha do tempo (30/07 a 24/08)
4. Identidade visual
5. Instagram: bio, destaques e link
6. A página no link da bio (`pekar-joias.web.app`)
7. Guia de Instagram e início das postagens
8. Resultados no Instagram (2.826 → 2.836 seguidores)
9. Google Meu Negócio — o problema encontrado
10. Google Meu Negócio — a solução
11. Bônus: pasta no Drive
12. Pendências com a Pekar (2 destaques prontos, sem conteúdo)
13. Balanço — o que a Pekar leva da etapa
14. Encerramento, parcela final e próximos passos

## Site link-in-bio

No ar em <https://pekar-joias.web.app> (Firebase Hosting, projeto `pekar-joias`).
Os fontes ficam fora deste repositório, na máquina local (`pekar-joias/arquivos-fonte`
e `pekar-joias/hosting-firebase`).
