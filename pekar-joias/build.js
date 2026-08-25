const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "AluSulina";
pres.company = "Pekar Arte em Jóias";
pres.title = "Pekar Arte em Jóias — Análise, entrega e nova proposta";

// ---------------------------------------------------------------- paleta
const OURO = "C9A455";
const TERRA = "BF5340";
const AREIA = "E9DDCA";
const AGUA = "87AF9F";
const MARROM = "332821";

const BRANCO = "FFFFFF";
const CARD_CLARO = "F7F1E7";
const CARD_ESCURO = "43362C";
const TINTA = "3A2F26";
const SUAVE = "8A7A6B";
const SUAVE_D = "D9CDBB";

const TIT = "Cambria";
const TXT = "Calibri";

const M = 0.62;
const W = 13.33 - M * 2; // 12.09

const LOGO = path.join(__dirname, "pekar-logo.png");
const LOGO_CLARO = path.join(__dirname, "pekar-logo-claro.png");
const ASSINATURA = path.join(__dirname, "assinatura-alusulina.png");

// ------------------------------------------------------------- utilitários
const sombra = () => ({ type: "outer", color: "000000", blur: 14, offset: 2, angle: 90, opacity: 0.10 });

function slideClaro() {
  const s = pres.addSlide();
  s.background = { color: BRANCO };
  s.addImage({ path: LOGO, x: 12.28, y: 0.34, w: 0.5, h: 0.65 });
  return s;
}

function slideEscuro() {
  const s = pres.addSlide();
  s.background = { color: MARROM };
  s.addImage({ path: LOGO_CLARO, x: 12.28, y: 0.34, w: 0.5, h: 0.65 });
  return s;
}

function titulo(s, kicker, texto, escuro) {
  s.addText(kicker.toUpperCase(), {
    x: M, y: 0.38, w: W - 1.0, h: 0.26,
    fontFace: TXT, fontSize: 10.5, bold: true, charSpacing: 2.4,
    color: OURO, margin: 0, valign: "middle",
  });
  s.addText(texto, {
    x: M, y: 0.66, w: W - 1.0, h: 0.62,
    fontFace: TIT, fontSize: 29, bold: true,
    color: escuro ? BRANCO : MARROM, margin: 0, valign: "middle",
  });
}

function card(s, x, y, w, h, cor) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: cor || CARD_CLARO }, line: { type: "none" }, shadow: sombra(),
  });
}

function bolinha(s, x, y, d, texto, corpo, tam) {
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: corpo || OURO }, line: { type: "none" },
  });
  s.addText(texto, {
    x, y, w: d, h: d,
    fontFace: TXT, fontSize: tam || 12, bold: true, color: BRANCO,
    align: "center", valign: "middle", margin: 0,
  });
}

function etiqueta(s, x, y, w, texto, cor) {
  s.addText(texto, {
    x, y, w, h: 0.26,
    fontFace: TXT, fontSize: 10, bold: true, charSpacing: 1.8,
    color: cor || OURO, margin: 0, valign: "middle",
  });
}

function tabela(s, cabecalho, linhas, opts) {
  const fs = opts.fontSize || 10.5;
  const head = cabecalho.map((t) => ({
    text: t,
    options: {
      fill: { color: MARROM }, color: AREIA, bold: true, fontSize: fs - 1,
      fontFace: TXT, charSpacing: 1.2, valign: "middle", margin: [4, 8, 4, 8],
    },
  }));
  const corpo = linhas.map((linha, i) =>
    linha.map((t, j) => ({
      text: t,
      options: {
        fill: { color: i % 2 === 0 ? CARD_CLARO : BRANCO },
        color: j === 0 ? MARROM : TINTA,
        bold: j === 0,
        fontSize: j === 0 ? fs : fs - 0.5,
        fontFace: TXT, valign: "middle", margin: [5, 8, 5, 8],
      },
    }))
  );
  s.addTable([head, ...corpo], {
    x: opts.x, y: opts.y, w: opts.w, colW: opts.colW, rowH: opts.rowH,
    border: { type: "solid", color: BRANCO, pt: 1.5 },
    autoPage: false,
  });
}

// =====================================================================
// 1 · CAPA
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: MARROM };

  s.addShape(pres.ShapeType.ellipse, {
    x: 9.15, y: -1.5, w: 5.6, h: 5.6,
    fill: { type: "none" }, line: { color: OURO, width: 1, transparency: 55 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 9.95, y: -0.55, w: 4.6, h: 4.6,
    fill: { type: "none" }, line: { color: OURO, width: 1.75 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 10.2, y: 4.7, w: 3.4, h: 3.4,
    fill: { color: OURO, transparency: 90 }, line: { type: "none" },
  });

  s.addImage({ path: LOGO_CLARO, x: 10.9, y: 0.62, w: 1.72, h: 2.23 });

  s.addText("PEKAR ARTE EM JOIAS", {
    x: M, y: 2.28, w: 9.0, h: 0.32,
    fontFace: TXT, fontSize: 13, bold: true, charSpacing: 3.4,
    color: OURO, margin: 0, valign: "middle",
  });
  s.addText("Análise, entrega\ne nova proposta", {
    x: M, y: 2.68, w: 9.2, h: 1.7,
    fontFace: TIT, fontSize: 44, bold: true, color: BRANCO,
    lineSpacing: 50, margin: 0, valign: "top",
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 4.6, w: 4.05, h: 0.6, rectRadius: 0.3,
    fill: { color: OURO }, line: { type: "none" },
  });
  s.addText("30/07/2026  a  25/08/2026", {
    x: M, y: 4.6, w: 4.05, h: 0.6,
    fontFace: TXT, fontSize: 13, bold: true, color: BRANCO,
    align: "center", valign: "middle", margin: 0,
  });

  s.addShape(pres.ShapeType.line, {
    x: M, y: 5.62, w: 3.1, h: 0,
    line: { color: OURO, width: 0.75, transparency: 45 },
  });
  s.addImage({ path: ASSINATURA, x: M, y: 5.78, w: 2.4, h: 0.8 });

  s.addNotes(
    "Abertura. Uma frase: “Karen, essa apresentação tem três partes — o que foi entregue, " +
    "o que eu analisei do mercado e do perfil, e a proposta para continuarmos.”"
  );
}

// =====================================================================
// 2 · ROTEIRO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "Roteiro", "O que você vai ver aqui");

  const partes = [
    ["01", "A entrega", "Tudo o que foi feito entre 30 de julho e 25 de agosto: identidade, Instagram, Google e os arquivos que ficam com a Pekar.", OURO],
    ["02", "A análise", "O que o mercado de joalheria pede em 2026 e como isso vira conteúdo, formato, horário e roteiro de gravação.", TERRA],
    ["03", "A proposta", "O que sugiro para a próxima fase, com escopo e valores separados por frente de trabalho.", AGUA],
  ];

  const cw = 3.83, gap = 0.3;
  partes.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.75, cw, 3.5);
    s.addText(p[0], {
      x: x + 0.4, y: 2.05, w: 1.4, h: 0.75,
      fontFace: TIT, fontSize: 40, bold: true, color: p[3], margin: 0, valign: "middle",
    });
    s.addText(p[1], {
      x: x + 0.4, y: 2.9, w: cw - 0.8, h: 0.42,
      fontFace: TIT, fontSize: 20, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(p[2], {
      x: x + 0.4, y: 3.42, w: cw - 0.8, h: 1.55,
      fontFace: TXT, fontSize: 13, color: TINTA, lineSpacing: 19, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Se em algum ponto eu usar um termo que não faça sentido, só avisar — a ideia é que tudo aqui seja claro.",
    {
      x: M, y: 5.6, w: W, h: 0.4,
      fontFace: TXT, fontSize: 13, italic: true, color: SUAVE, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Serve para a Karen saber quanto tempo falta e onde estamos.");
}

// =====================================================================
// 3 · ENTREGA 1 — LINHA DO TEMPO + ENCERRAMENTO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Como foi feito, dia a dia");

  const linhas = [
    ["30/07", "Proposta aprovada e briefing enviado", "O combinado fechado e o questionário de entendimento da marca enviado para a Karen."],
    ["31/07", "Acesso ao Instagram e arquivos da logo", "A Pekar liberou o perfil e enviou os arquivos originais da logo."],
    ["01/08", "Briefing respondido", "As respostas da Karen chegaram e viraram a base da identidade."],
    ["02/08", "Identidade e guia de Instagram entregues", "Também foi criado o grupo de WhatsApp do projeto, para agilizar o dia a dia."],
    ["03/08", "Instagram atualizado", "Bio reescrita, capas de destaque no padrão da marca e link na bio."],
    ["10/08", "Primeiras postagens no ar", "Começo da publicação de conteúdo."],
    ["25/08", "Encerramento da primeira etapa", "Esta apresentação: balanço do que foi feito e proposta do que vem a seguir."],
  ];

  const alturaLinha = 0.5, y0 = 1.5;
  linhas.forEach((r, i) => {
    const y = y0 + i * alturaLinha;
    const ultima = i === linhas.length - 1;
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.04, w: 0.95, h: 0.36, rectRadius: 0.18,
      fill: { color: ultima ? OURO : AREIA }, line: { type: "none" },
    });
    s.addText(r[0], {
      x: M, y: y + 0.04, w: 0.95, h: 0.36,
      fontFace: TXT, fontSize: 10.5, bold: true, color: ultima ? BRANCO : MARROM,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: M + 1.13, y: y - 0.02, w: 4.75, h: 0.44,
      fontFace: TIT, fontSize: 13.5, bold: true, color: MARROM,
      lineSpacing: 18, margin: 0, valign: "middle",
    });
    s.addText(r[2], {
      x: M + 6.05, y: y - 0.02, w: W - 6.05, h: 0.44,
      fontFace: TXT, fontSize: 11, color: SUAVE, lineSpacing: 14, margin: 0, valign: "middle",
    });
  });

  const cw = 5.87, gap = 0.35;
  card(s, M, 5.35, cw, 1.45);
  etiqueta(s, M + 0.42, 5.55, cw - 0.84, "STATUS DO PROJETO", TERRA);
  s.addText("Concluída", {
    x: M + 0.42, y: 5.82, w: cw - 0.84, h: 0.44,
    fontFace: TIT, fontSize: 22, bold: true, color: MARROM, margin: 0, valign: "middle",
  });
  s.addText("Todas as frentes combinadas foram entregues ou resolvidas.", {
    x: M + 0.42, y: 6.28, w: cw - 0.84, h: 0.4,
    fontFace: TXT, fontSize: 11.5, color: TINTA, lineSpacing: 15, margin: 0, valign: "top",
  });

  const rx = M + cw + gap;
  card(s, rx, 5.35, cw, 1.45);
  etiqueta(s, rx + 0.42, 5.55, cw - 0.84, "PARCELA FINAL (50%)", TERRA);
  s.addText("R$ 1.250,00", {
    x: rx + 0.42, y: 5.82, w: cw - 0.84, h: 0.44,
    fontFace: TIT, fontSize: 22, bold: true, color: MARROM, margin: 0, valign: "middle",
  });
  s.addText("Vencimento em 01/09/2026, conforme a proposta aprovada em 30/07.", {
    x: rx + 0.42, y: 6.28, w: cw - 0.84, h: 0.4,
    fontFace: TXT, fontSize: 11.5, color: TINTA, lineSpacing: 15, margin: 0, valign: "top",
  });

  s.addNotes("Mostra ritmo: da aprovação ao conteúdo no ar foram 11 dias. Fecha com o status e a parcela final.");
}

// =====================================================================
// 4 · ENTREGA 2 — RESULTADOS
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A entrega  ·  Parte 01", "O que os números mostram", true);

  const stats = [
    ["2.826", "seguidores", "03/08/2026", CARD_ESCURO],
    ["2.838", "seguidores", "24/08/2026", CARD_ESCURO],
    ["+12", "novos seguidores", "no período", OURO],
    ["15", "dias de postagens", "de 10/08 a 25/08", CARD_ESCURO],
  ];
  const bw = 2.87, gap = 0.29;
  stats.forEach((st, i) => {
    const x = M + i * (bw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.7, w: bw, h: 1.8, rectRadius: 0.07,
      fill: { color: st[3] }, line: { type: "none" },
    });
    s.addText(st[0], {
      x: x + 0.15, y: 1.86, w: bw - 0.3, h: 0.78,
      fontFace: TIT, fontSize: 34, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.15, y: 2.65, w: bw - 0.3, h: 0.3,
      fontFace: TXT, fontSize: 12.5, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[2], {
      x: x + 0.15, y: 2.95, w: bw - 0.3, h: 0.28,
      fontFace: TXT, fontSize: 11, color: st[3] === OURO ? "F7F0E4" : SUAVE_D,
      align: "center", valign: "middle", margin: 0,
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 3.72, w: W, h: 2.45, rectRadius: 0.08,
    fill: { color: CARD_ESCURO }, line: { type: "none" },
  });
  s.addText("Lendo os números", {
    x: M + 0.5, y: 3.95, w: W - 1.0, h: 0.34,
    fontFace: TIT, fontSize: 18, bold: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "Em 15 dias de postagens o perfil ganhou 12 seguidores. Cresceu pouco, e isso era esperado: " +
    "esta primeira etapa não foi de crescimento, foi de organização.\n\n" +
    "Seguidor novo vem depois, com constância de publicação e ações feitas para atrair quem ainda não " +
    "conhece a marca. Em duas semanas não há como medir isso — o que existe hoje é a base pronta para " +
    "esse crescimento acontecer.",
    {
      x: M + 0.5, y: 4.36, w: W - 1.0, h: 1.65,
      fontFace: TXT, fontSize: 13, color: SUAVE_D, lineSpacing: 19, margin: 0, valign: "top",
    }
  );

  s.addNotes("Não esconder o número. Base construída agora; crescimento é objetivo da próxima fase.");
}

// =====================================================================
// 5 · ENTREGA 3 — EM ABERTO + DESTAQUES PENDENTES
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Em aberto");

  const itens = [
    ["Deixar de seguir 2.000 contas", "Limpeza da lista de “seguindo”, para o perfil ficar coerente com a marca."],
    ["Pagamento com cartão de crédito", "Mercado Pago. Assim que estiver funcionando, atualizamos a informação no Instagram."],
    ["Cupom de 1ª compra", "Sugestão em estudo: pode virar um desconto de …% no PIX."],
    ["Número novo para WhatsApp Business", "Separar o atendimento da loja do número pessoal."],
    ["Quem responde as mensagens", "Hoje só a Karen responde. Na temporada, vai haver tempo de responder e atender?"],
    ["Volume real de fotos e vídeos", "Quantas por semana a Pekar consegue produzir de verdade? Precisamos de arquivo para atravessar a temporada."],
  ];

  const cw = 5.87, ch = 1.0, gap = 0.35, vgap = 0.13;
  itens.forEach((it, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = M + col * (cw + gap);
    const y = 1.42 + lin * (ch + vgap);
    card(s, x, y, cw, ch);
    bolinha(s, x + 0.28, y + 0.3, 0.3, String(i + 1), OURO, 11);
    s.addText(it[0], {
      x: x + 0.72, y: y + 0.14, w: cw - 1.02, h: 0.3,
      fontFace: TIT, fontSize: 13.5, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: x + 0.72, y: y + 0.44, w: cw - 1.02, h: 0.48,
      fontFace: TXT, fontSize: 11, color: TINTA, lineSpacing: 14, margin: 0, valign: "top",
    });
  });

  s.addText(
    "As duas capas abaixo já foram criadas e estão guardadas no Drive. Para entrarem no perfil, falta o conteúdo.",
    {
      x: M, y: 4.94, w: W, h: 0.34,
      fontFace: TXT, fontSize: 12.5, color: TINTA, margin: 0, valign: "middle",
    }
  );

  const pend = [
    ["Guia de medidas de anel", "A capa está pronta.", "O vídeo foi gravado pela Karen em 24/08 — falta enviar para publicarmos o destaque.", OURO],
    ["Depoimentos de clientes", "A capa está pronta.", "Falta a Karen e as vendedoras colherem os depoimentos com as clientes das lojas.", TERRA],
  ];
  pend.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 5.34, cw, 1.42);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.32, y: 5.56, w: 0.4, h: 0.4, rectRadius: 0.08,
      fill: { color: p[3] }, line: { type: "none" },
    });
    s.addText("★", {
      x: x + 0.32, y: 5.56, w: 0.4, h: 0.4,
      fontFace: TXT, fontSize: 13, color: BRANCO, align: "center", valign: "middle", margin: 0,
    });
    s.addText(p[0], {
      x: x + 0.86, y: 5.54, w: cw - 1.5, h: 0.3,
      fontFace: TIT, fontSize: 14, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(p[1], {
      x: x + cw - 2.05, y: 5.54, w: 1.85, h: 0.3,
      fontFace: TXT, fontSize: 10.5, italic: true, color: p[3],
      align: "right", margin: 0, valign: "middle",
    });
    s.addText(p[2], {
      x: x + 0.86, y: 5.9, w: cw - 1.2, h: 0.62,
      fontFace: TXT, fontSize: 11, color: TINTA, lineSpacing: 14, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Assim que os dois chegarem, os destaques entram no perfil e a vitrine do Instagram fica completa.",
    {
      x: M, y: 6.86, w: W, h: 0.32,
      fontFace: TXT, fontSize: 11.5, italic: true, color: SUAVE, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Passar item por item e sair da reunião com resposta. Combinar prazo para o vídeo do guia de medidas.");
}

// =====================================================================
// 6 · ENTREGA 4 — GOOGLE MEU NEGÓCIO + BÔNUS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Google Meu Negócio e os arquivos da marca");

  const cw = 5.87, gap = 0.35;

  // ---- coluna esquerda: Google Meu Negócio
  card(s, M, 1.45, cw, 5.3);
  s.addText("Google Meu Negócio", {
    x: M + 0.42, y: 1.66, w: cw - 0.84, h: 0.36,
    fontFace: TIT, fontSize: 18, bold: true, color: MARROM, margin: 0, valign: "middle",
  });
  s.addText(
    "O combinado era atualizar fotos e informações das lojas no Google. Ao tentar o acesso, descobrimos " +
    "que a Pekar não o tinha para editar — então o trabalho virou investigação.",
    {
      x: M + 0.42, y: 2.06, w: cw - 0.84, h: 0.78,
      fontFace: TXT, fontSize: 11.5, color: TINTA, lineSpacing: 16, margin: 0, valign: "top",
    }
  );

  etiqueta(s, M + 0.42, 2.92, cw - 0.84, "O QUE FOI DESCOBERTO", TERRA);
  [
    "Juquehy tem 2 contas: uma como joalheria e outra como restaurante.",
    "Maresias tem 1 conta.",
    "O acesso das três está com o e-mail co….@gmail.com, fora do controle da Pekar.",
  ].forEach((t, i) => {
    const y = 3.26 + i * 0.56;
    bolinha(s, M + 0.42, y + 0.03, 0.26, "!", TERRA, 10);
    s.addText(t, {
      x: M + 0.8, y: y - 0.05, w: cw - 1.25, h: 0.5,
      fontFace: TXT, fontSize: 11.5, color: TINTA, lineSpacing: 15, margin: 0, valign: "middle",
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M + 0.42, y: 5.0, w: cw - 0.84, h: 0.85, rectRadius: 0.06,
    fill: { color: MARROM }, line: { type: "none" },
  });
  etiqueta(s, M + 0.72, 5.13, cw - 1.44, "O QUE FOI FEITO", OURO);
  s.addText(
    [
      { text: "pekarjoias@gmail.com", options: { bold: true, color: OURO } },
      { text: "   senha: 080112Batismo", options: { color: SUAVE_D } },
    ],
    {
      x: M + 0.72, y: 5.42, w: cw - 1.44, h: 0.32,
      fontFace: TXT, fontSize: 12, margin: 0, valign: "middle",
    }
  );

  s.addText(
    [
      { text: "Ação necessária:  ", options: { bold: true, color: TERRA } },
      { text: "reivindicar as três contas e atualizar fotos e informações assim que o acesso for liberado.", options: { color: TINTA } },
    ],
    {
      x: M + 0.42, y: 5.98, w: cw - 0.84, h: 0.6,
      fontFace: TXT, fontSize: 11.5, lineSpacing: 15, margin: 0, valign: "top",
    }
  );

  // ---- coluna direita: bônus
  const rx = M + cw + gap;
  card(s, rx, 1.45, cw, 5.3, MARROM);
  s.addText("Bônus: todos os arquivos em um lugar só", {
    x: rx + 0.42, y: 1.66, w: cw - 0.84, h: 0.36,
    fontFace: TIT, fontSize: 18, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("Uma pasta no Google Drive, dentro do e-mail pekarjoias@gmail.com", {
    x: rx + 0.42, y: 2.06, w: cw - 0.84, h: 0.5,
    fontFace: TXT, fontSize: 11.5, italic: true, color: OURO, lineSpacing: 16, margin: 0, valign: "top",
  });
  s.addText(
    "Não estava na proposta, mas foi criada para manter todos os arquivos do projeto reunidos e no nome " +
    "da própria marca.",
    {
      x: rx + 0.42, y: 2.56, w: cw - 0.84, h: 0.6,
      fontFace: TXT, fontSize: 11.5, color: SUAVE_D, lineSpacing: 16, margin: 0, valign: "top",
    }
  );

  etiqueta(s, rx + 0.42, 3.24, cw - 0.84, "O QUE TEM DENTRO", OURO);
  const arquivos = [
    ["Capas de destaque do Instagram", "as imagens das bolinhas do perfil"],
    ["Imagens da logo", "todas as versões"],
    ["Documentos do projeto", "identidade, guia de Instagram e demais materiais"],
    ["Termos de autorização de imagem", "para funcionários e para clientes, liberando o uso de fotos, vídeos e depoimentos"],
  ];
  arquivos.forEach((f, i) => {
    const y = 3.58 + i * 0.66;
    bolinha(s, rx + 0.42, y + 0.02, 0.26, "✓", OURO, 10);
    s.addText(f[0], {
      x: rx + 0.8, y: y - 0.06, w: cw - 1.25, h: 0.28,
      fontFace: TIT, fontSize: 13, bold: true, color: BRANCO, margin: 0, valign: "middle",
    });
    s.addText(f[1], {
      x: rx + 0.8, y: y + 0.22, w: cw - 1.25, h: 0.42,
      fontFace: TXT, fontSize: 10.5, color: SUAVE_D, lineSpacing: 13, margin: 0, valign: "top",
    });
  });

  s.addText("Para acessar: entrar no Google Drive com esse e-mail.", {
    x: rx + 0.42, y: 6.25, w: cw - 0.84, h: 0.3,
    fontFace: TXT, fontSize: 10.5, italic: true, color: SUAVE_D, margin: 0, valign: "middle",
  });

  s.addNotes(
    "Item de maior valor escondido da etapa: recuperar a posse dos cadastros. A disputa das contas está " +
    "orçada na proposta. O termo de imagem destrava depoimento e foto de cliente."
  );
}

// =====================================================================
// 7 · ANÁLISE 1 — TENDÊNCIAS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Tendências de joalheria para 2026");

  const t = [
    ["01", "A prata voltou como tendência estética", "Depois de anos de dourado, a prata 925 e o banho de ródio voltam como aposta do ano, especialmente para clima quente.", OURO],
    ["02", "Prata escultural", "Textura martelada imitando seixo de rio, bezel assimétrico, borda crua, acabamento fosco no lugar do polido espelhado. A Pekar não precisa perseguir essa tendência — precisa nomear que já a pratica.", TERRA],
    ["03", "Pedra colorida natural no centro", "O consumidor tem preferido a gema natural, irregular e única, à perfeição industrial repetida. Em alta: morganita, ametista lavanda, turmalina verde e tanzanita.", AGUA],
    ["04", "Água-marinha, a pedra de 2026", "Historicamente o amuleto dos navegantes, hoje associada a calma e proteção. Para uma joalheria que nasceu num mostruário na areia, é um presente de posicionamento — não precisa ser inventado, precisa ser ocupado.", OURO],
  ];

  const cw = 2.87, gap = 0.29;
  t.forEach((it, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.45, cw, 3.55);
    s.addText(it[0], {
      x: x + 0.3, y: 1.66, w: 1.1, h: 0.5,
      fontFace: TIT, fontSize: 26, bold: true, color: it[3], margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: x + 0.3, y: 2.2, w: cw - 0.6, h: 0.85,
      fontFace: TIT, fontSize: 14, bold: true, color: MARROM, lineSpacing: 19, margin: 0, valign: "top",
    });
    s.addText(it[2], {
      x: x + 0.3, y: 3.08, w: cw - 0.6, h: 1.75,
      fontFace: TXT, fontSize: 10.5, color: TINTA, lineSpacing: 14, margin: 0, valign: "top",
    });
  });

  card(s, M, 5.2, W, 1.35, MARROM);
  s.addText("A leitura por trás das quatro", {
    x: M + 0.45, y: 5.38, w: W - 0.9, h: 0.3,
    fontFace: TIT, fontSize: 15, bold: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "A joia passou a ser vista como ferramenta de bem-estar e conexão com o natural, não como enfeite. " +
    "A Pekar já trabalha pedra natural: agora é só verbalizar o significado em cada peça.",
    {
      x: M + 0.45, y: 5.7, w: W - 0.9, h: 0.62,
      fontFace: TXT, fontSize: 12.5, color: SUAVE_D, lineSpacing: 17, margin: 0, valign: "top",
    }
  );

  s.addNotes(
    "São quatro movimentos, e três deles a Pekar já faz — o trabalho é nomear, não perseguir. " +
    "Este é o argumento central: significado vende mais que descrição."
  );
}

// =====================================================================
// 8 · ANÁLISE 2 — PILARES + FORMATOS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Os pilares e os formatos");

  // ---- esquerda: cinco pilares
  const lw = 4.35;
  s.addText("Todo post da Pekar deve caber em um destes cinco assuntos.", {
    x: M, y: 1.4, w: lw, h: 0.44,
    fontFace: TXT, fontSize: 11.5, italic: true, color: SUAVE, lineSpacing: 15, margin: 0, valign: "middle",
  });

  const pilares = [
    ["A pedra e seu significado", "Água-marinha, morganita, ametista. O território que gera salvamento.", OURO],
    ["O mar como referência", "As conchas, a areia, a origem da marca no litoral norte.", AGUA],
    ["Prova social", "As frases que as clientes já dizem. Vale mais que qualquer anúncio.", TERRA],
    ["História da marca", "O início, a evolução e o jeito de fazer — em doses pequenas.", OURO],
    ["Educativo", "Cuidados com a prata, guia de medidas, como escolher uma pedra.", AGUA],
  ];
  pilares.forEach((p, i) => {
    const y = 1.95 + i * 0.92;
    card(s, M, y, lw, 0.82);
    bolinha(s, M + 0.24, y + 0.26, 0.3, String(i + 1), p[2], 11);
    s.addText(p[0], {
      x: M + 0.66, y: y + 0.08, w: lw - 0.9, h: 0.28,
      fontFace: TIT, fontSize: 12.5, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(p[1], {
      x: M + 0.66, y: y + 0.36, w: lw - 0.9, h: 0.4,
      fontFace: TXT, fontSize: 10, color: TINTA, lineSpacing: 12.5, margin: 0, valign: "top",
    });
  });

  // ---- direita: formatos e frequência
  const rx = M + lw + 0.35;
  const rw = W - lw - 0.35;
  etiqueta(s, rx, 1.4, rw, "FORMATOS E FREQUÊNCIA", TERRA);
  tabela(s,
    ["FORMATO", "PARA QUE SERVE", "FREQUÊNCIA"],
    [
      ["Reels", "Alcance de quem ainda não segue. Brilho, textura e movimento da peça — o vídeo mostra o que a foto não mostra.", "2 por semana"],
      ["Carrossel", "Salvamento e autoridade. Guias, significado da pedra, processo de escolha de produção.", "2 por semana"],
      ["Estático", "Vitrine da marca. A peça bem fotografada, com o nome e o significado, para quem já acompanha.", "1 por semana"],
      ["Stories", "Conversa e conversão. Cada resposta abre uma conversa no direct, e é ali que a venda consultiva acontece.", "diário"],
    ],
    { x: rx, y: 1.74, w: rw, colW: [1.25, 4.42, 1.45], rowH: [0.3, 0.72, 0.6, 0.6, 0.72], fontSize: 10 }
  );

  card(s, rx, 5.02, rw, 1.5, AREIA);
  s.addText(
    [
      { text: "Por que essa divisão:  ", options: { bold: true, color: MARROM } },
      { text: "cada formato tem um trabalho diferente. Reels traz gente nova, carrossel constrói confiança, " +
              "estático mantém a vitrine bonita e stories fecha a venda. Publicar só um formato deixa uma dessas pontas descoberta.",
        options: { color: TINTA } },
    ],
    {
      x: rx + 0.4, y: 5.02, w: rw - 0.8, h: 1.5,
      fontFace: TXT, fontSize: 11.5, lineSpacing: 16, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Se um post não cabe em nenhum dos cinco pilares, provavelmente não deveria ser publicado.");
}

// =====================================================================
// 9 · ANÁLISE 3 — HORÁRIOS + ROTEIRO DE PRODUÇÃO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Horários e roteiro de produção");

  // ---- esquerda: horários
  const lw = 4.35;
  etiqueta(s, M, 1.4, lw, "HORÁRIOS SUGERIDOS DE POSTAGEM", TERRA);

  const dias = [
    ["Terça a quinta", "Publicação no feed.", "Reels entre 9h e 11h · Carrossel no almoço · Stories no fim da tarde"],
    ["Sexta", "Fim de tarde e noite.", "17h – 20h"],
    ["Sábado", "Manhã e fim de tarde.", "8h – 10h  ·  17h – 20h"],
    ["Domingo", "Manhã e tarde.", "8h – 11h30  ·  12h – 16h"],
  ];
  const alturas = [0.95, 0.62, 0.62, 0.62];
  let y = 1.74;
  dias.forEach((d, i) => {
    card(s, M, y, lw, alturas[i]);
    s.addText(d[0], {
      x: M + 0.32, y: y + 0.08, w: lw - 0.64, h: 0.28,
      fontFace: TIT, fontSize: 13.5, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(d[1], {
      x: lw + M - 1.85, y: y + 0.08, w: 1.55, h: 0.28,
      fontFace: TXT, fontSize: 9.5, italic: true, color: SUAVE,
      align: "right", margin: 0, valign: "middle",
    });
    s.addText(d[2], {
      x: M + 0.32, y: y + 0.38, w: lw - 0.64, h: alturas[i] - 0.46,
      fontFace: TXT, fontSize: 11, color: TINTA, lineSpacing: 15, margin: 0, valign: "top",
    });
    y += alturas[i] + 0.1;
  });

  card(s, M, 5.05, lw, 1.75, MARROM);
  etiqueta(s, M + 0.32, 5.22, lw - 0.64, "COMO VALIDAR", OURO);
  s.addText(
    "Tudo acima é hipótese estruturada, não verdade estabelecida. Para virar certeza, precisa de quatro " +
    "semanas de grade fixa, medindo alcance de não-seguidores, salvamentos e conversas geradas. E precisa " +
    "ser cruzada com o dado que só a Karen tem: o horário real de pico das lojas.",
    {
      x: M + 0.32, y: 5.5, w: lw - 0.64, h: 1.2,
      fontFace: TXT, fontSize: 9.5, color: SUAVE_D, lineSpacing: 12.5, margin: 0, valign: "top",
    }
  );

  // ---- direita: roteiro de produção
  const rx = M + lw + 0.35;
  const rw = W - lw - 0.35;
  etiqueta(s, rx, 1.4, rw, "ROTEIRO DE PRODUÇÃO", TERRA);
  tabela(s,
    ["BLOCO", "O QUE GRAVAR / FOTOGRAFAR"],
    [
      ["Loja e ambiente", "Fachada, vitrine, interior, balcão e embalagem. Também as fotos com o celular deitado para o Google: 5 fotos horizontais e bem iluminadas. O Google privilegia horizontal e penaliza foto escura."],
      ["Anéis", "Carro-chefe. 8 a 10 peças, com prioridade para as autorais com pedra natural."],
      ["Brincos", "6 a 8 peças. O segundo que mais vende."],
      ["Colares e pingentes", "5 a 6 peças."],
      ["Pulseiras", "4 a 5 peças."],
      ["Conjuntos", "2 a 3 combinações completas."],
      ["Karen em cena", "Vídeo sobre a história da loja, cuidados com a prata e como as peças autorais são pensadas e produzidas."],
      ["Detalhes", "A peça sendo colocada na sacolinha; mãos ajustando uma peça no mostruário."],
    ],
    { x: rx, y: 1.74, w: rw, colW: [1.95, 5.17], rowH: [0.26, 0.62, 0.32, 0.26, 0.26, 0.26, 0.26, 0.42, 0.32], fontSize: 9.5 }
  );

  card(s, rx, 5.05, rw, 1.75, MARROM);
  etiqueta(s, rx + 0.32, 5.22, rw - 0.64, "A REGRA DESTE BLOCO", OURO);
  s.addText(
    "Câmera ligada antes de começar. Três blocos de três a cinco minutos, sem roteiro decorado — depois a " +
    "gente corta. O que não se recupera é a frase espontânea que saiu enquanto a câmera estava desligada.",
    {
      x: rx + 0.32, y: 5.5, w: rw - 0.64, h: 1.2,
      fontFace: TXT, fontSize: 10.5, color: SUAVE_D, lineSpacing: 14, margin: 0, valign: "top",
    }
  );

  s.addNotes(
    "Dizer em voz alta que os horários são hipótese com medição, não certeza. O roteiro resolve o arquivo " +
    "para a temporada: uma diária de gravação rende semanas de post."
  );
}

// =====================================================================
// 10 · PROPOSTA 1 — GOOGLE MEU NEGÓCIO E QR CODES
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A proposta  ·  Parte 03", "Google Meu Negócio e QR codes", true);

  const itens = [
    [
      "Google Meu Negócio",
      "Reivindicação e disputa de acesso das 3 contas junto ao Google. Após a aprovação, com o acesso " +
      "transferido para o e-mail pekarjoias@gmail.com, atualização das fotos e das informações das lojas.",
      "R$ 900,00",
      1.35,
    ],
    [
      "QR codes para o balcão",
      "QR codes direcionando para o Instagram e para o Google, com a arte pronta para as duas lojas.",
      "R$ 50,00",
      1.1,
    ],
  ];

  let y = 1.7;
  itens.forEach((it, i) => {
    const h = it[3];
    card(s, M, y, W, h, CARD_ESCURO);
    bolinha(s, M + 0.4, y + 0.26, 0.34, String(i + 1), OURO, 11);
    s.addText(it[0], {
      x: M + 0.9, y: y + 0.2, w: 6.6, h: 0.34,
      fontFace: TIT, fontSize: 15, bold: true, color: BRANCO, margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: M + 0.9, y: y + 0.56, w: 8.5, h: h - 0.7,
      fontFace: TXT, fontSize: 11.5, color: SUAVE_D, lineSpacing: 16, margin: 0, valign: "top",
    });
    s.addText(it[2], {
      x: M + W - 2.4, y: y + 0.2, w: 2.0, h: 0.34,
      fontFace: TXT, fontSize: 12.5, bold: true, color: OURO,
      align: "right", valign: "middle", margin: 0,
    });
    y += h + 0.18;
  });

  card(s, M, 4.33, W, 0.78, CARD_ESCURO);
  s.addText("Total", {
    x: M + 0.4, y: 4.33, w: 2.2, h: 0.78,
    fontFace: TIT, fontSize: 14, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("R$ 475,00 para iniciar  ·  R$ 475,00 na entrega", {
    x: M + 2.7, y: 4.33, w: 5.4, h: 0.78,
    fontFace: TXT, fontSize: 11.5, color: SUAVE_D, margin: 0, valign: "middle",
  });
  s.addText("R$ 950,00", {
    x: M + W - 2.4, y: 4.33, w: 2.0, h: 0.78,
    fontFace: TXT, fontSize: 12.5, bold: true, color: OURO,
    align: "right", valign: "middle", margin: 0,
  });

  card(s, M, 5.35, W, 1.35, CARD_ESCURO);
  etiqueta(s, M + 0.4, 5.52, W - 0.8, "SUGESTÕES DE FRASES PARA PEDIR AVALIAÇÃO NO GOOGLE E SEGUIDOR NO INSTAGRAM", OURO);
  s.addText(
    "“As peças novas eu mostro lá primeiro.”   ·   “Você é de onde? Então guarda o nosso contato — a gente " +
    "envia para o Brasil todo, o frete é fixo.”   ·   “Avalia a gente no Google, ajuda muito outras pessoas a " +
    "encontrarem a loja.”",
    {
      x: M + 0.4, y: 5.82, w: W - 0.8, h: 0.72,
      fontFace: TXT, fontSize: 11, italic: true, color: SUAVE_D, lineSpacing: 15, margin: 0, valign: "top",
    }
  );

  s.addNotes("As frases são para as vendedoras usarem no balcão. Custo zero e efeito direto na avaliação do Google.");
}

// =====================================================================
// 11 · PROPOSTA 2 — SOCIAL MEDIA
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A proposta  ·  Parte 03", "Social media: o perfil tocado por mim", true);

  const entregas = [
    "Legendas e programação das publicações",
    "Postagens diversificadas entre Reels, carrossel e estático, conforme o material recebido",
    "Stories conforme o material disponível",
    "Roteiro de produção de fotos e vídeos",
    "Análise, sugestões de conteúdo e relatório de tendências",
    "Reuniões quinzenais de alinhamento",
    "Disponibilidade no WhatsApp em qualquer dia",
  ];

  const lw = 7.4;
  card(s, M, 1.7, lw, 3.75, CARD_ESCURO);
  etiqueta(s, M + 0.4, 1.9, lw - 0.8, "O QUE ESTÁ INCLUÍDO", OURO);
  entregas.forEach((e, i) => {
    const y = 2.24 + i * 0.42;
    bolinha(s, M + 0.4, y + 0.04, 0.24, "✓", OURO, 9);
    s.addText(e, {
      x: M + 0.78, y: y - 0.04, w: lw - 1.2, h: 0.4,
      fontFace: TXT, fontSize: 11.5, color: AREIA, lineSpacing: 15, margin: 0, valign: "middle",
    });
  });

  const rx = M + lw + 0.35;
  const rw = W - lw - 0.35;

  card(s, rx, 1.7, rw, 1.4, CARD_ESCURO);
  etiqueta(s, rx + 0.4, 1.9, rw - 0.8, "INVESTIMENTO", OURO);
  s.addText(
    [
      { text: "R$ 900,00", options: { bold: true, color: BRANCO, fontSize: 14 } },
      { text: " mês", options: { color: SUAVE_D, fontSize: 11.5 } },
    ],
    {
      x: rx + 0.4, y: 2.2, w: rw - 0.8, h: 0.34,
      fontFace: TXT, margin: 0, valign: "middle",
    }
  );
  s.addText("·  podemos definir juntas o melhor dia de cobrança", {
    x: rx + 0.4, y: 2.56, w: rw - 0.8, h: 0.42,
    fontFace: TXT, fontSize: 10.5, color: SUAVE_D, lineSpacing: 14, margin: 0, valign: "top",
  });

  card(s, rx, 3.28, rw, 1.7, CARD_ESCURO);
  etiqueta(s, rx + 0.4, 3.48, rw - 0.8, "O QUE A PEKAR ENTREGA", TERRA);
  s.addText(
    "O material de foto e vídeo já selecionado e tratado, com o nome da peça.",
    {
      x: rx + 0.4, y: 3.8, w: rw - 0.8, h: 1.4,
      fontFace: TXT, fontSize: 11.5, color: SUAVE_D, lineSpacing: 16, margin: 0, valign: "top",
    }
  );

  s.addText("As duas propostas são independentes.", {
    x: M, y: 5.68, w: W, h: 0.4,
    fontFace: TXT, fontSize: 12, italic: true, color: SUAVE_D, margin: 0, valign: "middle",
  });

  s.addNotes("Deixar claro que são contratações separadas, para a Karen não sentir que é pacote fechado.");
}

// =====================================================================
// 12 · FECHAMENTO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: MARROM };

  s.addShape(pres.ShapeType.ellipse, {
    x: -1.6, y: 4.3, w: 4.4, h: 4.4,
    fill: { type: "none" }, line: { color: OURO, width: 1, transparency: 60 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 11.2, y: -1.3, w: 3.6, h: 3.6,
    fill: { color: OURO, transparency: 90 }, line: { type: "none" },
  });

  s.addImage({ path: LOGO_CLARO, x: 6.03, y: 1.15, w: 1.28, h: 1.66 });

  s.addText("Obrigada pela confiança.", {
    x: M, y: 3.15, w: W, h: 0.8,
    fontFace: TIT, fontSize: 38, bold: true, color: BRANCO,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText(
    "Qualquer dúvida sobre esta apresentação, é só me chamar no WhatsApp do grupo do projeto.",
    {
      x: M, y: 3.98, w: W, h: 0.4,
      fontFace: TXT, fontSize: 14.5, color: SUAVE_D,
      align: "center", valign: "middle", margin: 0,
    }
  );

  s.addShape(pres.ShapeType.line, {
    x: 5.42, y: 4.72, w: 2.5, h: 0,
    line: { color: OURO, width: 0.75, transparency: 40 },
  });
  s.addImage({ path: ASSINATURA, x: 5.37, y: 4.92, w: 2.6, h: 0.87 });
  s.addText("Pekar Arte em Jóias  ·  25 de agosto de 2026", {
    x: M, y: 6.1, w: W, h: 0.32,
    fontFace: TXT, fontSize: 11.5, charSpacing: 1.2, color: SUAVE,
    align: "center", valign: "middle", margin: 0,
  });

  s.addNotes("Fechar combinando os dois pedidos pendentes e o prazo de resposta da proposta.");
}

pres.writeFile({ fileName: "Pekar-Analise-Entrega-Proposta.pptx" }).then((f) => console.log("OK:", f));
