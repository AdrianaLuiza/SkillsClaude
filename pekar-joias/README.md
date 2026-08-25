# Pekar Arte em Jóias — materiais do projeto

## Apresentação: análise, entrega e nova proposta

`Pekar-Analise-Entrega-Proposta.pptx` — 12 slides editáveis, com notas do
apresentador em cada um. Cobre o período de 30/07/2026 a 25/08/2026.

Estrutura em três partes:

| Parte | Slides | Conteúdo |
|---|---|---|
| Capa e roteiro | 1–2 | Abertura e índice |
| 01 · A entrega | 3–6 | Linha do tempo + encerramento; resultados; em aberto + destaques pendentes; Google Meu Negócio + bônus no Drive |
| 02 · A análise | 7–9 | Tendências 2026; pilares + formatos; horários + roteiro de produção |
| 03 · A proposta | 10–11 | Google Meu Negócio + QR codes; social media |
| Fechamento | 12 | Assinatura |

O conteúdo é o mesmo da versão de 18 slides aprovada pela Adriana — apenas
redistribuído. Nos slides de proposta os valores são apresentados no mesmo
corpo do texto, sem destaque tipográfico, de propósito.

### Como regerar / editar

O arquivo é gerado por código, não editado à mão:

```bash
npm install pptxgenjs
node build.js
```

Isso reescreve `Pekar-Analise-Entrega-Proposta.pptx` na mesma pasta. Os quatro
PNGs precisam estar ao lado do `build.js` — ele os referencia por caminho relativo.

Para conferir o resultado visualmente:

```bash
soffice --headless --convert-to pdf Pekar-Analise-Entrega-Proposta.pptx
pdftoppm -jpeg -r 110 Pekar-Analise-Entrega-Proposta.pdf slide
```

## Assets de marca

Todos com fundo transparente, extraídos do PDF vetorial da logo (CorelDRAW,
`etiqueta 2,5x2,5 redonda karen.cdr`) e do PPTX original.

| Arquivo | Uso |
|---|---|
| `pekar-logo.png` | Logo completa, lettering marrom. Para fundos claros. |
| `pekar-logo-claro.png` | Mesma logo com o lettering em areia. Para fundos escuros. |
| `pekar-selo.png` | Selo redondo com o padrão de fundo (página 1 do PDF). |
| `assinatura-alusulina.png` | Assinatura da Adriana, com o fundo marrom removido. |

Como foram gerados, caso precise refazer em outra resolução:

```bash
pdftocairo -png -transp -r 2000 -f 2 -l 2 logovetor.pdf logo   # logo
pdftocairo -png -transp -r 2000 -f 1 -l 1 logovetor.pdf selo   # selo redondo
```

## Paleta e tipografia

| Papel | Hex | Nome na identidade |
|---|---|---|
| Fundo escuro (dominante) | `#332821` | Marrom profundo |
| Acento principal | `#C9A455` | Dourado |
| Acento secundário | `#BF5340` | Terracota |
| Acento terciário | `#87AF9F` | Verde-água |
| Card claro / faixas | `#E9DDCA` | Areia |
| Títulos | Cambria | |
| Corpo | Calibri | |

**Atenção:** os hex foram estimados a partir do print da paleta, não de um
arquivo de origem. A logo vetorial usa `#BB9A4C` (dourado), `#B36C44`
(terracota) e `#6B2F18` (marrom do lettering). Se a identidade oficial tiver
valores exatos diferentes, trocar as constantes no topo do `build.js` — todo o
deck se reajusta.

## Convenção de grafia

- **"Jóias"** com acento apenas no nome da marca (*Pekar Arte em Jóias*), para
  bater com a logo.
- **"joia"/"joias"** sem acento no texto corrido, que é a grafia correta pelo
  Acordo Ortográfico.

## Site link-in-bio

No ar em <https://pekar-joias.web.app> (Firebase Hosting, projeto `pekar-joias`).
Os fontes ficam fora deste repositório, na máquina local (`pekar-joias/arquivos-fonte`
e `pekar-joias/hosting-firebase`).
