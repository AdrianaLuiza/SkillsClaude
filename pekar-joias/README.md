# Pekar Arte em Jóias — materiais do projeto

## Apresentação: análise, entrega e nova proposta

**Versão final aprovada:** `Pekar-Analise-Entrega-Proposta-APROVADA.pptx` — 10
slides, editado à mão pela Adriana a partir da versão de 12. É a fonte da
verdade. O PDF (`Pekar-Analise-Entrega-Proposta.pdf`) é gerado dele.

Para gerar o PDF com a tipografia correta é preciso ter as substitutas métricas
de Cambria e Calibri instaladas, senão o LibreOffice usa DejaVu e o texto sai
mais largo do que no PowerPoint:

```bash
apt-get install -y fonts-crosextra-caladea fonts-crosextra-carlito
soffice --headless --convert-to pdf Pekar-Analise-Entrega-Proposta-APROVADA.pptx
```

O `build.js` abaixo gera a versão de 12 slides, anterior à edição manual — serve
de referência do sistema visual, mas não corresponde mais ao arquivo aprovado.

### Versão gerada por código (12 slides)

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

## Página web da apresentação — RETIRADA DO AR

Foi publicada e depois retirada a pedido da Adriana. O conteúdo do endereço
foi substituído por um aviso de página retirada.

**Atenção:** o compartilhamento do Artifact continua ligado e fixado numa versão
anterior, então substituir o conteúdo NÃO basta. Para remover de fato é preciso
desligar o compartilhamento (ou excluir o Artifact) na galeria em
<https://claude.ai/code/artifacts>.

A fonte da página (`pagina.tpl.html`) segue no repositório caso se queira retomar.
Ela contém a senha do e-mail e o PIX — reveja isso antes de republicar.


### Como atualizar

1. Editar `pagina.tpl.html`
2. Regerar a página com as imagens embutidas:

```bash
python3 - <<'PY'
import base64
def uri(f): return "data:image/png;base64," + base64.b64encode(open(f,"rb").read()).decode()
h = open("pagina.tpl.html", encoding="utf8").read()
for marca, arq in [("__LOGO__","web-logo.png"),("__LOGOC__","web-logo-claro.png"),("__ASSIN__","web-assinatura.png")]:
    h = h.replace(marca, uri(arq))
open("pekar-apresentacao.html","w",encoding="utf8").write(h)
PY
```

3. Republicar o mesmo arquivo para manter o link.

### Decisões de design

- **Tema único**, por escolha: é um documento de marca, com a paleta Pekar fixa
  (areia clara de fundo, marrom profundo nas faixas de ênfase, dourado de acento).
- **Tipografia**: Fraunces nos títulos (mesma família do site link-in-bio) e Karla
  no texto, ambas do Google Fonts, com pilha de fallback declarada.
- **Tabelas viraram grades CSS** que empilham no celular, em vez de `<table>` com
  rolagem lateral — a leitura principal é no telefone.
- Os badges usam os tons `-tinta` da paleta, e não o dourado cheio, para o texto
  branco passar em contraste.
