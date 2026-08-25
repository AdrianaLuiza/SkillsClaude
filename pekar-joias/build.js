const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "AluSulina";
pres.company = "Pekar Arte em Jóias";
pres.title = "Pekar Arte em Jóias — Análise, entrega e nova proposta";

// ---------------------------------------------------------------- paleta
// Cores da identidade Pekar (print da paleta + logo vetorial).
const OURO = "C9A455"; // dourado
const TERRA = "BF5340"; // terracota
const AREIA = "E9DDCA"; // areia
const AGUA = "87AF9F"; // verde-água
const MARROM = "332821"; // marrom profundo

const BRANCO = "FFFFFF";
const CARD_CLARO = "F7F1E7"; // areia diluída, fundo de card em slide claro
const CARD_ESCURO = "43362C"; // marrom clareado, card em slide escuro
const TINTA = "3A2F26"; // texto corpo em fundo claro
const SUAVE = "8A7A6B"; // texto secundário em fundo claro
const SUAVE_D = "D9CDBB"; // texto secundário em fundo escuro

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
    x: M, y: 0.4, w: W - 1.0, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.4,
    color: OURO, margin: 0, valign: "middle",
  });
  s.addText(texto, {
    x: M, y: 0.7, w: W - 1.0, h: 0.72,
    fontFace: TIT, fontSize: 33, bold: true,
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
    fontFace: TXT, fontSize: tam || 13, bold: true, color: BRANCO,
    align: "center", valign: "middle", margin: 0,
  });
}

// Tabela com a cara da marca (editável no PowerPoint).
function tabela(s, cabecalho, linhas, opts) {
  const head = cabecalho.map((t) => ({
    text: t,
    options: {
      fill: { color: MARROM }, color: AREIA, bold: true, fontSize: 11,
      fontFace: TXT, charSpacing: 1.4, valign: "middle", margin: [6, 10, 6, 10],
    },
  }));
  const corpo = linhas.map((linha, i) =>
    linha.map((t, j) => ({
      text: t,
      options: {
        fill: { color: i % 2 === 0 ? CARD_CLARO : BRANCO },
        color: j === 0 ? MARROM : TINTA,
        bold: j === 0,
        fontSize: j === 0 ? 12 : 11.5,
        fontFace: TXT, valign: "middle", margin: [7, 10, 7, 10],
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

  s.addText("PEKAR ARTE EM JÓIAS", {
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
    card(s, x, 1.85, cw, 3.5);
    s.addText(p[0], {
      x: x + 0.4, y: 2.15, w: 1.4, h: 0.75,
      fontFace: TIT, fontSize: 42, bold: true, color: p[3], margin: 0, valign: "middle",
    });
    s.addText(p[1], {
      x: x + 0.4, y: 3.0, w: cw - 0.8, h: 0.42,
      fontFace: TIT, fontSize: 21, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(p[2], {
      x: x + 0.4, y: 3.52, w: cw - 0.8, h: 1.55,
      fontFace: TXT, fontSize: 13.5, color: TINTA, lineSpacing: 20, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Se em algum ponto eu usar um termo que não faça sentido, me interrompe — a ideia é que tudo aqui seja claro.",
    {
      x: M, y: 5.7, w: W, h: 0.4,
      fontFace: TXT, fontSize: 13.5, italic: true, color: SUAVE, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Serve para a Karen saber quanto tempo falta e onde estamos.");
}

// =====================================================================
// 3 · LINHA DO TEMPO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Como foi feito, dia a dia");

  const linhas = [
    ["30/07", "Proposta aprovada e briefing enviado", "O combinado fechado e o questionário de entendimento da marca enviado para a Karen."],
    ["31/07", "Acesso ao Instagram e arquivos da logo", "A Pekar liberou o perfil e enviou os arquivos originais da logo."],
    ["01/08", "Briefing respondido", "As respostas da Karen chegaram e viraram a base da identidade."],
    ["02/08", "Identidade e guia de Instagram entregues", "Também foi criado o grupo de WhatsApp do projeto, para agilizar o dia a dia."],
    ["03/08", "Instagram atualizado", "Bio reescrita, capas de destaque no padrão da marca e link de compra na bio."],
    ["10/08", "Primeiras postagens no ar", "Começo da publicação de conteúdo seguindo o guia entregue."],
    ["25/08", "Encerramento da primeira etapa", "Esta apresentação: balanço do que foi feito e proposta do que vem a seguir."],
  ];

  const alturaLinha = 0.7, y0 = 1.78;
  linhas.forEach((r, i) => {
    const y = y0 + i * alturaLinha;
    const ultima = i === linhas.length - 1;
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.04, w: 1.05, h: 0.42, rectRadius: 0.2,
      fill: { color: ultima ? OURO : AREIA }, line: { type: "none" },
    });
    s.addText(r[0], {
      x: M, y: y + 0.04, w: 1.05, h: 0.42,
      fontFace: TXT, fontSize: 12, bold: true, color: ultima ? BRANCO : MARROM,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: M + 1.28, y: y - 0.02, w: 5.05, h: 0.55,
      fontFace: TIT, fontSize: 15, bold: true, color: MARROM,
      lineSpacing: 20, margin: 0, valign: "middle",
    });
    s.addText(r[2], {
      x: M + 6.5, y: y - 0.02, w: W - 6.5, h: 0.55,
      fontFace: TXT, fontSize: 12, color: SUAVE, lineSpacing: 16, margin: 0, valign: "middle",
    });
  });

  s.addNotes("Mostra ritmo: da aprovação ao conteúdo no ar foram 11 dias.");
}

// =====================================================================
// 4 · RESULTADOS
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A entrega  ·  Parte 01", "O que os números mostram", true);

  const stats = [
    ["2.826", "seguidores", "03/08/2026", CARD_ESCURO],
    ["2.838", "seguidores", "24/08/2026", CARD_ESCURO],
    ["+12", "novos seguidores", "no período", OURO],
    ["14", "dias de postagens", "de 10/08 a 24/08", CARD_ESCURO],
  ];
  const bw = 2.87, gap = 0.29;
  stats.forEach((st, i) => {
    const x = M + i * (bw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.8, w: bw, h: 1.9, rectRadius: 0.07,
      fill: { color: st[3] }, line: { type: "none" },
    });
    s.addText(st[0], {
      x: x + 0.15, y: 1.96, w: bw - 0.3, h: 0.82,
      fontFace: TIT, fontSize: 38, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.15, y: 2.79, w: bw - 0.3, h: 0.32,
      fontFace: TXT, fontSize: 13.5, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[2], {
      x: x + 0.15, y: 3.11, w: bw - 0.3, h: 0.3,
      fontFace: TXT, fontSize: 11.5, color: st[3] === OURO ? "F7F0E4" : SUAVE_D,
      align: "center", valign: "middle", margin: 0,
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 3.95, w: W, h: 2.5, rectRadius: 0.08,
    fill: { color: CARD_ESCURO }, line: { type: "none" },
  });
  s.addText("Lendo esses números com honestidade", {
    x: M + 0.5, y: 4.18, w: W - 1.0, h: 0.36,
    fontFace: TIT, fontSize: 19, bold: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "Em 14 dias de postagens o perfil ganhou 12 seguidores. Cresceu pouco, e isso era esperado: " +
    "esta primeira etapa não foi de crescimento, foi de organização.\n\n" +
    "Seguidor novo vem depois, com constância de publicação e ações feitas para atrair quem ainda não " +
    "conhece a marca. Em duas semanas não há como medir isso — o que existe hoje é a base pronta para " +
    "esse crescimento acontecer.",
    {
      x: M + 0.5, y: 4.6, w: W - 1.0, h: 1.72,
      fontFace: TXT, fontSize: 13, color: SUAVE_D, lineSpacing: 19, margin: 0, valign: "top",
    }
  );

  s.addNotes("Não esconder o número. Base construída agora; crescimento é objetivo da próxima fase.");
}

// =====================================================================
// 5 · EM ABERTO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Em aberto: o que precisamos decidir");

  const itens = [
    ["Guia de medidas", "Filmado pela Karen em 24/08 no aplicativo All Silver. Aguardando o envio para entrar nos destaques."],
    ["Deixar de seguir 2.000 contas", "Limpeza da lista de “seguindo”, para o perfil ficar coerente com a marca."],
    ["Pagamento com cartão de crédito", "Mercado Pago. Assim que estiver funcionando, atualizamos a informação no Instagram."],
    ["Cupom de 1ª compra", "Sugestão em estudo: pode virar um desconto de …% no PIX."],
    ["Número novo para WhatsApp Business", "Separar o atendimento da loja do número pessoal."],
    ["Quem responde as mensagens", "Hoje só a Karen responde. Na temporada, vai haver tempo de responder e atender?"],
    ["Volume real de fotos e vídeos", "Quantas por semana a Pekar consegue produzir de verdade? Precisamos de arquivo para atravessar a temporada."],
  ];

  const cw = 5.87, ch = 1.12, gap = 0.35, vgap = 0.15;
  itens.forEach((it, i) => {
    const col = i % 2, lin = Math.floor(i / 2);
    const x = M + col * (cw + gap);
    const y = 1.78 + lin * (ch + vgap);
    card(s, x, y, cw, ch);
    bolinha(s, x + 0.3, y + 0.33, 0.34, String(i + 1), OURO, 12);
    s.addText(it[0], {
      x: x + 0.78, y: y + 0.16, w: cw - 1.1, h: 0.32,
      fontFace: TIT, fontSize: 14.5, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: x + 0.78, y: y + 0.48, w: cw - 1.1, h: 0.55,
      fontFace: TXT, fontSize: 11.5, color: TINTA, lineSpacing: 15, margin: 0, valign: "top",
    });
  });

  s.addNotes("Passar item por item e sair da reunião com resposta para o máximo possível.");
}

// =====================================================================
// 6 · DESTAQUES PENDENTES
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Dois destaques que dependem da Pekar");

  s.addText(
    "As duas capas já foram criadas e estão guardadas no Drive. Para entrarem no perfil, falta o conteúdo.",
    {
      x: M, y: 1.62, w: W, h: 0.4,
      fontFace: TXT, fontSize: 14, color: TINTA, margin: 0, valign: "middle",
    }
  );

  const pend = [
    ["Guia de medidas de anel", "A capa está pronta.", "O vídeo foi gravado pela Karen em 24/08 — falta enviar para publicarmos o destaque.", "Com a Karen", OURO],
    ["Depoimentos de clientes", "A capa está pronta.", "Falta a Karen e as vendedoras colherem os depoimentos com as clientes das lojas.", "Com a Karen e a equipe", TERRA],
  ];

  const cw = 5.87, gap = 0.35;
  pend.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.2, cw, 3.35);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.45, y: 2.5, w: 0.62, h: 0.62, rectRadius: 0.1,
      fill: { color: p[4] }, line: { type: "none" },
    });
    s.addText("★", {
      x: x + 0.45, y: 2.5, w: 0.62, h: 0.62,
      fontFace: TXT, fontSize: 20, color: BRANCO, align: "center", valign: "middle", margin: 0,
    });
    s.addText(p[0], {
      x: x + 0.45, y: 3.28, w: cw - 0.9, h: 0.42,
      fontFace: TIT, fontSize: 20, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(p[1], {
      x: x + 0.45, y: 3.72, w: cw - 0.9, h: 0.3,
      fontFace: TXT, fontSize: 13, italic: true, color: p[4], margin: 0, valign: "middle",
    });
    s.addText(p[2], {
      x: x + 0.45, y: 4.1, w: cw - 0.9, h: 0.8,
      fontFace: TXT, fontSize: 13.5, color: TINTA, lineSpacing: 19, margin: 0, valign: "top",
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.45, y: 4.92, w: 2.95, h: 0.44, rectRadius: 0.22,
      fill: { color: MARROM }, line: { type: "none" },
    });
    s.addText(p[3], {
      x: x + 0.45, y: 4.92, w: 2.95, h: 0.44,
      fontFace: TXT, fontSize: 11.5, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
  });

  s.addText(
    "Assim que os dois chegarem, os destaques entram no perfil e a vitrine do Instagram fica completa.",
    {
      x: M, y: 5.78, w: W, h: 0.35,
      fontFace: TXT, fontSize: 13, italic: true, color: SUAVE, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Combinar prazo: pedir o vídeo do guia de medidas ainda nesta semana.");
}

// =====================================================================
// 7 · GOOGLE MEU NEGÓCIO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Google Meu Negócio");

  card(s, M, 1.72, W, 0.82, AREIA);
  s.addText(
    "O combinado era atualizar fotos e informações das lojas no Google. Ao tentar o acesso, descobrimos " +
    "que a Pekar não o tinha para editar — então o trabalho virou investigação.",
    {
      x: M + 0.45, y: 1.72, w: W - 0.9, h: 0.82,
      fontFace: TXT, fontSize: 13.5, color: TINTA, lineSpacing: 19, margin: 0, valign: "middle",
    }
  );

  card(s, M, 2.72, 5.87, 2.55);
  s.addText("O QUE FOI DESCOBERTO", {
    x: M + 0.45, y: 2.98, w: 5.0, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: TERRA, margin: 0, valign: "middle",
  });
  [
    "Juquehy tem 2 contas: uma como joalheria e outra como restaurante.",
    "Maresias tem 1 conta.",
    "O acesso das três está com o e-mail co….@gmail.com, fora do controle da Pekar.",
  ].forEach((t, i) => {
    const y = 3.36 + i * 0.62;
    bolinha(s, M + 0.45, y + 0.03, 0.28, "!", TERRA, 11);
    s.addText(t, {
      x: M + 0.87, y: y - 0.06, w: 4.6, h: 0.55,
      fontFace: TXT, fontSize: 12.5, color: TINTA, lineSpacing: 17, margin: 0, valign: "middle",
    });
  });

  const rx = M + 6.22;
  card(s, rx, 2.72, 5.87, 2.55, MARROM);
  s.addText("O QUE FOI FEITO", {
    x: rx + 0.45, y: 2.98, w: 5.0, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: OURO, margin: 0, valign: "middle",
  });
  s.addText("Criado um e-mail oficial da marca", {
    x: rx + 0.45, y: 3.32, w: 5.0, h: 0.34,
    fontFace: TIT, fontSize: 16, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("pekarjoias@gmail.com", {
    x: rx + 0.45, y: 3.7, w: 5.0, h: 0.36,
    fontFace: TIT, fontSize: 19, bold: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText("senha: 080112Batismo", {
    x: rx + 0.45, y: 4.08, w: 5.0, h: 0.3,
    fontFace: TXT, fontSize: 12.5, color: SUAVE_D, margin: 0, valign: "middle",
  });
  s.addText(
    "Ele passa a ser o dono definitivo dos cadastros, no lugar de um e-mail pessoal de terceiros. " +
    "Recomendo trocar a senha assim que o acesso for liberado.",
    {
      x: rx + 0.45, y: 4.45, w: 5.0, h: 0.72,
      fontFace: TXT, fontSize: 12, color: SUAVE_D, lineSpacing: 16, margin: 0, valign: "top",
    }
  );

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 5.5, w: W, h: 0.72, rectRadius: 0.07,
    fill: { color: MARROM }, line: { type: "none" },
  });
  s.addText(
    [
      { text: "Ação necessária:  ", options: { bold: true, color: OURO } },
      { text: "reivindicar as três contas e atualizar fotos e informações assim que o acesso for liberado.", options: { color: AREIA } },
    ],
    {
      x: M + 0.45, y: 5.5, w: W - 0.9, h: 0.72,
      fontFace: TXT, fontSize: 13.5, margin: 0, valign: "middle",
    }
  );

  s.addNotes(
    "Item de maior valor escondido da etapa: recuperar a posse dos cadastros evita dor de cabeça permanente. " +
    "A disputa das contas está orçada na proposta, no fim da apresentação."
  );
}

// =====================================================================
// 8 · BÔNUS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A entrega  ·  Parte 01", "Bônus: todos os arquivos em um lugar só");

  card(s, M, 1.8, 5.5, 3.9, MARROM);
  s.addText("Uma pasta no Google Drive", {
    x: M + 0.45, y: 2.12, w: 4.6, h: 0.42,
    fontFace: TIT, fontSize: 21, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("dentro do e-mail pekarjoias@gmail.com", {
    x: M + 0.45, y: 2.56, w: 4.6, h: 0.3,
    fontFace: TXT, fontSize: 13, italic: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "Não estava na proposta, mas foi criada para manter todos os arquivos do projeto reunidos " +
    "e no nome da própria marca.\n\n" +
    "Se a equipe mudar, os arquivos continuam lá.",
    {
      x: M + 0.45, y: 3.0, w: 4.6, h: 1.9,
      fontFace: TXT, fontSize: 13.5, color: SUAVE_D, lineSpacing: 20, margin: 0, valign: "top",
    }
  );
  s.addText("Para acessar: entrar no Google Drive com esse e-mail.", {
    x: M + 0.45, y: 5.02, w: 4.6, h: 0.42,
    fontFace: TXT, fontSize: 11.5, italic: true, color: SUAVE_D, lineSpacing: 15, margin: 0, valign: "middle",
  });

  const rx = M + 5.92;
  const rw = W - 5.92;
  card(s, rx, 1.8, rw, 3.9);
  s.addText("O QUE TEM DENTRO", {
    x: rx + 0.45, y: 2.08, w: rw - 0.9, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: TERRA, margin: 0, valign: "middle",
  });

  const arquivos = [
    ["Capas de destaque do Instagram", "as imagens das bolinhas do perfil"],
    ["Imagens da logo", "todas as versões, prontas para uso"],
    ["Documentos do projeto", "identidade, guia de Instagram e demais materiais"],
    ["Termos de autorização de imagem", "para funcionários e para clientes, liberando o uso de fotos, vídeos e depoimentos"],
  ];
  arquivos.forEach((f, i) => {
    const y = 2.48 + i * 0.82;
    bolinha(s, rx + 0.45, y + 0.02, 0.3, "✓", OURO, 11);
    s.addText(f[0], {
      x: rx + 0.92, y: y - 0.06, w: rw - 1.4, h: 0.32,
      fontFace: TIT, fontSize: 14.5, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(f[1], {
      x: rx + 0.92, y: y + 0.26, w: rw - 1.4, h: 0.5,
      fontFace: TXT, fontSize: 11.5, color: SUAVE, lineSpacing: 15, margin: 0, valign: "top",
    });
  });

  s.addNotes("Reforçar que é um bônus, fora do escopo contratado. O termo de imagem destrava depoimento e foto de cliente.");
}

// =====================================================================
// 9 · ENCERRAMENTO DA ETAPA
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A entrega  ·  Parte 01", "Primeira etapa concluída", true);

  card(s, M, 1.95, 5.87, 2.1, CARD_ESCURO);
  s.addText("STATUS DO PROJETO", {
    x: M + 0.45, y: 2.18, w: 4.97, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: OURO, margin: 0, valign: "middle",
  });
  s.addText("Concluída", {
    x: M + 0.45, y: 2.52, w: 4.97, h: 0.6,
    fontFace: TIT, fontSize: 32, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("Todas as frentes combinadas foram entregues ou resolvidas.", {
    x: M + 0.45, y: 3.16, w: 4.97, h: 0.62,
    fontFace: TXT, fontSize: 13, color: SUAVE_D, lineSpacing: 18, margin: 0, valign: "top",
  });

  const rx = M + 6.22;
  card(s, rx, 1.95, 5.87, 2.1, CARD_ESCURO);
  s.addText("PARCELA FINAL (50%)", {
    x: rx + 0.45, y: 2.18, w: 4.97, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: OURO, margin: 0, valign: "middle",
  });
  s.addText("R$ 1.250,00", {
    x: rx + 0.45, y: 2.52, w: 4.97, h: 0.6,
    fontFace: TIT, fontSize: 32, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("Vencimento em 01/09/2026, conforme a proposta aprovada em 30/07.", {
    x: rx + 0.45, y: 3.16, w: 4.97, h: 0.62,
    fontFace: TXT, fontSize: 13, color: SUAVE_D, lineSpacing: 18, margin: 0, valign: "top",
  });

  s.addText("O que fica com a Pekar", {
    x: M, y: 4.3, w: W, h: 0.44,
    fontFace: TIT, fontSize: 21, bold: true, color: OURO, margin: 0, valign: "middle",
  });

  const ativos = [
    "Identidade visual",
    "Instagram organizado",
    "Guia de Instagram",
    "E-mail e Drive da marca",
  ];
  const aw = 2.87, agap = 0.29;
  ativos.forEach((a, i) => {
    const x = M + i * (aw + agap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 4.85, w: aw, h: 1.1, rectRadius: 0.07,
      fill: { color: CARD_ESCURO }, line: { type: "none" },
    });
    bolinha(s, x + 0.28, 5.25, 0.3, "✓", OURO, 11);
    s.addText(a, {
      x: x + 0.7, y: 4.98, w: aw - 1.0, h: 0.85,
      fontFace: TIT, fontSize: 13.5, bold: true, color: BRANCO,
      lineSpacing: 18, margin: 0, valign: "middle",
    });
  });

  s.addNotes("Fecha a parte 1. São ativos permanentes da marca, não serviço consumido.");
}

// =====================================================================
// 10 · TENDÊNCIAS — PRATA
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Tendências de joalheria para 2026");

  card(s, M, 1.7, W, 0.72, AREIA);
  s.addText(
    "São quatro movimentos do mercado. Três deles a Pekar já faz — o trabalho é nomear, não perseguir.",
    {
      x: M + 0.45, y: 1.7, w: W - 0.9, h: 0.72,
      fontFace: TXT, fontSize: 14, color: TINTA, margin: 0, valign: "middle",
    }
  );

  const t = [
    ["01", "A prata voltou como tendência estética", "Depois de anos de dourado, a prata 925 e o banho de ródio voltam como aposta do ano, especialmente para clima quente.", OURO],
    ["02", "Prata escultural", "Textura martelada imitando seixo de rio, bezel assimétrico, borda crua, acabamento fosco no lugar do polido espelhado. A Pekar não precisa perseguir essa tendência — precisa nomear que já a pratica.", TERRA],
  ];
  const cw = 5.87, gap = 0.35;
  t.forEach((it, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.65, cw, 3.15);
    s.addText(it[0], {
      x: x + 0.45, y: 2.9, w: 1.2, h: 0.6,
      fontFace: TIT, fontSize: 34, bold: true, color: it[3], margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: x + 0.45, y: 3.58, w: cw - 0.9, h: 0.75,
      fontFace: TIT, fontSize: 19, bold: true, color: MARROM, lineSpacing: 25, margin: 0, valign: "top",
    });
    s.addText(it[2], {
      x: x + 0.45, y: 4.4, w: cw - 0.9, h: 1.25,
      fontFace: TXT, fontSize: 13, color: TINTA, lineSpacing: 19, margin: 0, valign: "top",
    });
  });

  s.addNotes("A Pekar já trabalha prata e peça autoral. A tendência confirma o caminho, não pede mudança.");
}

// =====================================================================
// 11 · TENDÊNCIAS — PEDRAS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "As pedras que o mercado quer");

  const t = [
    ["03", "Pedra colorida natural no centro", "O consumidor tem preferido a gema natural, irregular e única, à perfeição industrial repetida. Em alta: morganita, ametista lavanda, turmalina verde e tanzanita.", AGUA],
    ["04", "Água-marinha, a pedra de 2026", "Historicamente o amuleto dos navegantes, hoje associada a calma e proteção. Para uma joalheria que nasceu num mostruário na areia, é um presente de posicionamento — não precisa ser inventado, precisa ser ocupado.", OURO],
  ];
  const cw = 5.87, gap = 0.35;
  t.forEach((it, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.72, cw, 3.25);
    s.addText(it[0], {
      x: x + 0.45, y: 1.98, w: 1.2, h: 0.6,
      fontFace: TIT, fontSize: 34, bold: true, color: it[3], margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: x + 0.45, y: 2.66, w: cw - 0.9, h: 0.62,
      fontFace: TIT, fontSize: 19, bold: true, color: MARROM, lineSpacing: 25, margin: 0, valign: "top",
    });
    s.addText(it[2], {
      x: x + 0.45, y: 3.3, w: cw - 0.9, h: 1.5,
      fontFace: TXT, fontSize: 13, color: TINTA, lineSpacing: 19, margin: 0, valign: "top",
    });
  });

  card(s, M, 5.15, W, 1.35, MARROM);
  s.addText("A leitura por trás das quatro", {
    x: M + 0.45, y: 5.32, w: W - 0.9, h: 0.32,
    fontFace: TIT, fontSize: 16, bold: true, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "A joia passou a ser vista como ferramenta de bem-estar e conexão com o natural, não como enfeite. " +
    "A Pekar já trabalha pedra natural: falta verbalizar o significado em cada peça. É o que muda a legenda " +
    "de descritiva para simbólica — e é o que faz a cliente salvar e compartilhar o post.",
    {
      x: M + 0.45, y: 5.66, w: W - 0.9, h: 0.72,
      fontFace: TXT, fontSize: 13, color: SUAVE_D, lineSpacing: 18, margin: 0, valign: "top",
    }
  );

  s.addNotes("Este é o argumento central da análise: significado vende mais que descrição.");
}

// =====================================================================
// 12 · PILARES DE CONTEÚDO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Os cinco pilares de conteúdo");

  s.addText(
    "Todo post da Pekar deve caber em um destes cinco assuntos. É o que dá identidade ao perfil.",
    {
      x: M, y: 1.6, w: W, h: 0.4,
      fontFace: TXT, fontSize: 14, color: TINTA, margin: 0, valign: "middle",
    }
  );

  const pilares = [
    ["A pedra e seu significado", "Água-marinha, morganita, ametista. O território que gera salvamento.", OURO],
    ["O mar como referência", "As conchas, a areia, a origem da marca no litoral norte.", AGUA],
    ["Prova social", "As frases que as clientes já dizem. Vale mais que qualquer anúncio.", TERRA],
    ["História da marca", "O início, a evolução e o jeito de fazer — em doses pequenas.", OURO],
    ["Educativo", "Cuidados com a prata, guia de medidas, como escolher uma pedra.", AGUA],
  ];

  const gap = 0.14;
  const cw = (W - gap * 4) / 5;
  pilares.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.15, cw, 3.55);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.26, y: 2.45, w: 0.5, h: 0.5, rectRadius: 0.1,
      fill: { color: p[2] }, line: { type: "none" },
    });
    s.addText(String(i + 1), {
      x: x + 0.26, y: 2.45, w: 0.5, h: 0.5,
      fontFace: TXT, fontSize: 15, bold: true, color: BRANCO,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(p[0], {
      x: x + 0.26, y: 3.1, w: cw - 0.52, h: 1.0,
      fontFace: TIT, fontSize: 14.5, bold: true, color: MARROM, lineSpacing: 20, margin: 0, valign: "top",
    });
    s.addText(p[1], {
      x: x + 0.26, y: 4.15, w: cw - 0.52, h: 1.35,
      fontFace: TXT, fontSize: 12, color: TINTA, lineSpacing: 17, margin: 0, valign: "top",
    });
  });

  s.addNotes("Se um post não cabe em nenhum dos cinco, provavelmente não deveria ser publicado.");
}

// =====================================================================
// 13 · FORMATOS E FREQUÊNCIA
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Formatos e frequência");

  tabela(s,
    ["FORMATO", "PARA QUE SERVE", "FREQUÊNCIA"],
    [
      ["Reels", "Alcance de quem ainda não segue. Brilho, textura e movimento da peça — o vídeo mostra o que a foto não mostra.", "2 por semana"],
      ["Carrossel", "Salvamento e autoridade. Guias, significado da pedra, processo de produção.", "2 por semana"],
      ["Estático", "Vitrine da marca. A peça bem fotografada, com o nome e o significado, para quem já acompanha.", "1 por semana"],
      ["Stories", "Conversa e conversão. Cada resposta abre uma conversa no direct, e é ali que a venda consultiva acontece.", "diário"],
    ],
    { x: M, y: 1.78, w: W, colW: [2.0, 7.79, 2.3], rowH: [0.4, 0.86, 0.72, 0.86, 0.86] }
  );

  card(s, M, 5.55, W, 1.15, AREIA);
  s.addText(
    [
      { text: "Por que essa divisão:  ", options: { bold: true, color: MARROM } },
      { text: "cada formato tem um trabalho diferente. Reels traz gente nova, carrossel constrói confiança, " +
              "estático mantém a vitrine bonita e stories fecha a venda. Publicar só um formato deixa uma dessas pontas descoberta.",
        options: { color: TINTA } },
    ],
    {
      x: M + 0.45, y: 5.55, w: W - 0.9, h: 1.15,
      fontFace: TXT, fontSize: 13.5, lineSpacing: 19, margin: 0, valign: "middle",
    }
  );

  s.addNotes("A linha do Estático estava em branco na versão anterior — preenchida aqui, confirmar se combina com o que a Karen pensou.");
}

// =====================================================================
// 14 · HORÁRIOS
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Horários sugeridos de postagem");

  const dias = [
    ["Terça a quinta", "Publicação no feed.", "Reels entre 9h e 11h\nCarrossel no almoço\nStories no fim da tarde"],
    ["Sexta", "Fim de tarde e noite.", "17h – 20h"],
    ["Sábado", "Manhã e fim de tarde.", "8h – 10h\n17h – 20h"],
    ["Domingo", "Manhã e tarde.", "8h – 11h30\n12h – 16h"],
  ];

  const cw = 2.87, gap = 0.29;
  dias.forEach((d, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.75, cw, 2.85);
    s.addText(d[0], {
      x: x + 0.32, y: 2.0, w: cw - 0.64, h: 0.38,
      fontFace: TIT, fontSize: 18, bold: true, color: MARROM, margin: 0, valign: "middle",
    });
    s.addText(d[1], {
      x: x + 0.32, y: 2.4, w: cw - 0.64, h: 0.3,
      fontFace: TXT, fontSize: 12, italic: true, color: SUAVE, margin: 0, valign: "middle",
    });
    s.addText(d[2], {
      x: x + 0.32, y: 2.82, w: cw - 0.64, h: 1.5,
      fontFace: TXT, fontSize: 13.5, color: TINTA, lineSpacing: 21, margin: 0, valign: "top",
    });
  });

  card(s, M, 4.82, W, 1.75, MARROM);
  s.addText("COMO VALIDAR", {
    x: M + 0.5, y: 5.05, w: W - 1.0, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "Tudo acima é hipótese estruturada, não verdade estabelecida. Para virar certeza, precisa de quatro semanas " +
    "de grade fixa, medindo alcance de não-seguidores, salvamentos e conversas geradas. E precisa ser cruzada " +
    "com o dado que só a Karen tem: o horário real de pico das lojas.",
    {
      x: M + 0.5, y: 5.4, w: W - 1.0, h: 1.0,
      fontFace: TXT, fontSize: 13.5, color: SUAVE_D, lineSpacing: 20, margin: 0, valign: "top",
    }
  );

  s.addNotes("Importante dizer isso em voz alta: não estou vendendo certeza, estou propondo um teste com medição.");
}

// =====================================================================
// 15 · ROTEIRO DE PRODUÇÃO
// =====================================================================
{
  const s = slideClaro();
  titulo(s, "A análise  ·  Parte 02", "Roteiro de produção");

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
      ["Detalhes", "A peça sendo colocada na sacolinha; as mãos da Karen ajustando uma peça no mostruário."],
    ],
    { x: M, y: 1.72, w: W, colW: [2.7, 9.39], rowH: [0.34, 0.62, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4] }
  );

  card(s, M, 5.72, W, 1.05, MARROM);
  s.addText(
    [
      { text: "A regra deste bloco:  ", options: { bold: true, color: OURO } },
      { text: "câmera ligada antes de começar. Três blocos de três a cinco minutos, sem roteiro decorado — " +
              "depois a gente corta. O que não se recupera é a frase espontânea que saiu enquanto a câmera estava desligada.",
        options: { color: AREIA } },
    ],
    {
      x: M + 0.45, y: 5.72, w: W - 0.9, h: 1.05,
      fontFace: TXT, fontSize: 13, lineSpacing: 18, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Esse roteiro resolve o problema de arquivo para a temporada: uma diária de gravação rende semanas de post.");
}

// =====================================================================
// 16 · PROPOSTA — GOOGLE
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
    ],
    [
      "QR codes para o balcão",
      "QR codes direcionando para o Instagram e para o Google, com a arte do display pronta para as duas lojas.",
      "R$ 50,00",
    ],
  ];

  let y = 1.8;
  itens.forEach((it, i) => {
    const h = i === 0 ? 1.45 : 1.15;
    card(s, M, y, W, h, CARD_ESCURO);
    bolinha(s, M + 0.42, y + 0.3, 0.44, String(i + 1), OURO, 14);
    s.addText(it[0], {
      x: M + 1.05, y: y + 0.24, w: 6.4, h: 0.4,
      fontFace: TIT, fontSize: 19, bold: true, color: BRANCO, margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: M + 1.05, y: y + 0.66, w: 8.1, h: h - 0.8,
      fontFace: TXT, fontSize: 12.5, color: SUAVE_D, lineSpacing: 18, margin: 0, valign: "top",
    });
    s.addText(it[2], {
      x: W - 2.0 + M, y: y + 0.24, w: 2.0, h: 0.5,
      fontFace: TIT, fontSize: 23, bold: true, color: OURO,
      align: "right", valign: "middle", margin: 0,
    });
    y += h + 0.2;
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 4.7, w: W, h: 0.95, rectRadius: 0.07,
    fill: { color: OURO }, line: { type: "none" },
  });
  s.addText("Total", {
    x: M + 0.5, y: 4.7, w: 3.0, h: 0.95,
    fontFace: TIT, fontSize: 21, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("R$ 475,00 para iniciar  ·  R$ 475,00 na entrega", {
    x: M + 3.5, y: 4.7, w: 5.6, h: 0.95,
    fontFace: TXT, fontSize: 13.5, color: "FBF6EE", margin: 0, valign: "middle",
  });
  s.addText("R$ 950,00", {
    x: W - 3.0 + M, y: 4.7, w: 3.0 - 0.5, h: 0.95,
    fontFace: TIT, fontSize: 28, bold: true, color: BRANCO,
    align: "right", valign: "middle", margin: 0,
  });

  card(s, M, 5.9, W, 1.15, CARD_ESCURO);
  s.addText("Frases para pedir avaliação no Google e seguidor no Instagram", {
    x: M + 0.45, y: 6.02, w: W - 0.9, h: 0.3,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 1.6, color: OURO, margin: 0, valign: "middle",
  });
  s.addText(
    "“As peças novas eu mostro lá primeiro.”   ·   “Você é de onde? Então guarda o nosso contato — a gente " +
    "envia para o Brasil todo, o frete é fixo.”   ·   “Avalia a gente no Google, ajuda muito outras pessoas a " +
    "encontrarem a loja.”",
    {
      x: M + 0.45, y: 6.34, w: W - 0.9, h: 0.62,
      fontFace: TXT, fontSize: 12, italic: true, color: SUAVE_D, lineSpacing: 17, margin: 0, valign: "top",
    }
  );

  s.addNotes("As frases são para as vendedoras usarem no balcão. Custo zero e efeito direto na avaliação do Google.");
}

// =====================================================================
// 17 · PROPOSTA — SOCIAL MEDIA
// =====================================================================
{
  const s = slideEscuro();
  titulo(s, "A proposta  ·  Parte 03", "Social media: o perfil tocado por mim", true);

  const entregas = [
    "Legendas e programação de todas as publicações",
    "Postagens diversificadas entre Reels, carrossel e estático, conforme o material recebido",
    "Stories diários, conforme o material disponível",
    "Roteiro de produção de fotos e vídeos",
    "Análise, sugestões de conteúdo e relatório de tendências",
    "Reuniões quinzenais de alinhamento",
    "Disponibilidade no WhatsApp em qualquer dia",
  ];

  card(s, M, 1.78, 7.6, 4.27, CARD_ESCURO);
  s.addText("O QUE ESTÁ INCLUÍDO", {
    x: M + 0.45, y: 2.02, w: 6.7, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: OURO, margin: 0, valign: "middle",
  });
  entregas.forEach((e, i) => {
    const y = 2.48 + i * 0.5;
    bolinha(s, M + 0.45, y + 0.04, 0.26, "✓", OURO, 10);
    s.addText(e, {
      x: M + 0.87, y: y - 0.04, w: 6.4, h: 0.42,
      fontFace: TXT, fontSize: 13, color: AREIA, lineSpacing: 17, margin: 0, valign: "middle",
    });
  });

  const rx = M + 7.95;
  const rw = W - 7.95;
  s.addShape(pres.ShapeType.roundRect, {
    x: rx, y: 1.78, w: rw, h: 1.85, rectRadius: 0.07,
    fill: { color: OURO }, line: { type: "none" },
  });
  s.addText("INVESTIMENTO", {
    x: rx + 0.4, y: 2.0, w: rw - 0.8, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: "FBF6EE", margin: 0, valign: "middle",
  });
  s.addText("R$ 900,00", {
    x: rx + 0.4, y: 2.36, w: rw - 0.8, h: 0.6,
    fontFace: TIT, fontSize: 32, bold: true, color: BRANCO, margin: 0, valign: "middle",
  });
  s.addText("por mês  ·  podemos definir juntas o melhor dia de cobrança", {
    x: rx + 0.4, y: 2.98, w: rw - 0.8, h: 0.5,
    fontFace: TXT, fontSize: 12, color: "FBF6EE", lineSpacing: 16, margin: 0, valign: "top",
  });

  card(s, rx, 3.8, rw, 2.25, CARD_ESCURO);
  s.addText("O QUE A PEKAR ENTREGA", {
    x: rx + 0.4, y: 4.02, w: rw - 0.8, h: 0.28,
    fontFace: TXT, fontSize: 11, bold: true, charSpacing: 2.0, color: TERRA, margin: 0, valign: "middle",
  });
  s.addText(
    "O material de foto e vídeo já selecionado e tratado, com o nome da peça.\n\n" +
    "Sem material, não há programação que se sustente.",
    {
      x: rx + 0.4, y: 4.36, w: rw - 0.8, h: 1.6,
      fontFace: TXT, fontSize: 12, color: SUAVE_D, lineSpacing: 17, margin: 0, valign: "top",
    }
  );

  s.addText(
    "As duas propostas são independentes: dá para contratar só o Google, só o social media, ou as duas.",
    {
      x: M, y: 6.25, w: W, h: 0.4,
      fontFace: TXT, fontSize: 13, italic: true, color: SUAVE_D, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Deixar claro que são contratações separadas, para a Karen não sentir que é pacote fechado.");
}

// =====================================================================
// 18 · FECHAMENTO
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
