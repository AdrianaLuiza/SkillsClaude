const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Adriana";
pres.company = "Pekar Arte em Jóias";
pres.title = "Pekar Arte em Jóias — Encerramento da Etapa 1";

// ---------- paleta ----------
const DARK = "2E2622";  // marrom espresso (dominante nos slides escuros)
const GOLD = "B08D57";  // dourado / bronze (acento)
const SAND = "EFE7DE";  // areia quente (apoio)
const CARD = "F7F2EC";  // fundo de card
const CARD_D = "3D332C"; // card sobre fundo escuro
const WHITE = "FFFFFF";
const INK = "3A322D";   // texto corpo
const MUTED = "857870"; // texto secundário

const HEAD = "Cambria";
const BODY = "Calibri";

const M = 0.65;              // margem lateral
const W = 13.33 - M * 2;     // 12.03 largura útil

// ---------- helpers ----------
const shadow = () => ({ type: "outer", color: "000000", blur: 14, offset: 2, angle: 90, opacity: 0.09 });

function heading(s, kicker, title, dark) {
  s.addText(kicker.toUpperCase(), {
    x: M, y: 0.42, w: W, h: 0.28,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2.4,
    color: GOLD, margin: 0, valign: "middle",
  });
  s.addText(title, {
    x: M, y: 0.72, w: W, h: 0.72,
    fontFace: HEAD, fontSize: 34, bold: true,
    color: dark ? WHITE : DARK, margin: 0, valign: "middle",
  });
}

function card(s, x, y, w, h, fill) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill || CARD }, line: { type: "none" }, shadow: shadow(),
  });
}

function goldCircle(s, x, y, d, label, fontSize) {
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: GOLD }, line: { type: "none" },
  });
  s.addText(label, {
    x, y, w: d, h: d,
    fontFace: BODY, fontSize: fontSize || 14, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });
}

// =====================================================================
// 1. CAPA
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: DARK };

  s.addShape(pres.ShapeType.ellipse, {
    x: 10.1, y: -1.05, w: 4.6, h: 4.6,
    fill: { color: GOLD, transparency: 82 }, line: { type: "none" },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 11.3, y: 4.35, w: 2.7, h: 2.7,
    fill: { color: GOLD, transparency: 88 }, line: { type: "none" },
  });

  s.addText("PEKAR ARTE EM JÓIAS", {
    x: M, y: 1.75, w: 9.2, h: 0.34,
    fontFace: BODY, fontSize: 13, bold: true, charSpacing: 3.2,
    color: GOLD, margin: 0, valign: "middle",
  });
  s.addText("Encerramento da Etapa 1", {
    x: M, y: 2.2, w: 9.6, h: 1.0,
    fontFace: HEAD, fontSize: 46, bold: true, color: WHITE, margin: 0, valign: "middle",
  });
  s.addText("Identidade, Instagram, site e Google:\no que foi feito, o que mudou e o que vem agora.", {
    x: M, y: 3.3, w: 8.6, h: 0.95,
    fontFace: BODY, fontSize: 17, color: SAND, lineSpacing: 26, margin: 0, valign: "top",
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 5.55, w: 4.15, h: 0.62, rectRadius: 0.3,
    fill: { color: GOLD }, line: { type: "none" },
  });
  s.addText("30/07/2026  a  24/08/2026", {
    x: M, y: 5.55, w: 4.15, h: 0.62,
    fontFace: BODY, fontSize: 13, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });

  s.addText("Consultoria de presença digital  ·  Adriana", {
    x: M, y: 6.4, w: 8, h: 0.3,
    fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, valign: "middle",
  });

  s.addNotes(
    "Abertura. Diga em uma frase: “Karen, essa etapa foi para arrumar a base da presença digital da Pekar. " +
    "Vou te mostrar em 10 minutos tudo o que foi feito, o que já está no ar e o que ainda depende de vocês.”"
  );
}

// =====================================================================
// 2. RESUMO EM 1 MINUTO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Visão geral", "O que foi feito, em 1 minuto");

  const top = [
    ["1", "Identidade visual", "A cara da marca definida: logo tratada, cores e letras para usar em tudo."],
    ["2", "Instagram organizado", "Bio, destaques e link arrumados para quem chega entender e comprar."],
    ["3", "Site com link na bio", "Uma página só da Pekar, com WhatsApp, garantia, entrega e ouvidoria."],
  ];
  const bottom = [
    ["4", "Google Meu Negócio", "Descoberto o motivo de não conseguirem editar as lojas e feita a reivindicação dos acessos."],
    ["5", "Bônus: arquivos no Drive", "Uma pasta da Pekar com todos os arquivos criados no projeto, para uso a qualquer momento."],
  ];

  const cw = 3.83, gap = 0.27;
  top.forEach((it, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.72, cw, 2.15);
    goldCircle(s, x + 0.32, 1.98, 0.44, it[0]);
    s.addText(it[1], {
      x: x + 0.32, y: 2.56, w: cw - 0.64, h: 0.34,
      fontFace: HEAD, fontSize: 17, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(it[2], {
      x: x + 0.32, y: 2.95, w: cw - 0.64, h: 0.8,
      fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 18, margin: 0, valign: "top",
    });
  });

  const bw = 5.88;
  bottom.forEach((it, i) => {
    const x = M + i * (bw + gap);
    card(s, x, 4.08, bw, 1.95);
    goldCircle(s, x + 0.32, 4.34, 0.44, it[0]);
    s.addText(it[1], {
      x: x + 0.95, y: 4.34, w: bw - 1.3, h: 0.44,
      fontFace: HEAD, fontSize: 17, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(it[2], {
      x: x + 0.32, y: 4.95, w: bw - 0.64, h: 0.85,
      fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 18, margin: 0, valign: "top",
    });
  });

  s.addText("Cada uma dessas frentes está detalhada nos próximos slides.", {
    x: M, y: 6.3, w: W, h: 0.3,
    fontFace: BODY, fontSize: 12, italic: true, color: MUTED, margin: 0, valign: "middle",
  });

  s.addNotes("Panorama. Se a Karen tiver pouco tempo, esse slide sozinho conta a história da etapa.");
}

// =====================================================================
// 3. LINHA DO TEMPO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Linha do tempo", "Como foi o caminho, dia a dia");

  const rows = [
    ["30/07", "Proposta aprovada e briefing enviado", "O combinado fechado e o questionário de entendimento da marca enviado para a Karen."],
    ["31/07", "Acesso ao Instagram e arquivos da logo", "A Pekar liberou o perfil e enviou os arquivos originais da logo."],
    ["01/08", "Briefing respondido", "As respostas da Karen chegaram e viraram a base da identidade."],
    ["02/08", "Identidade e guia de Instagram entregues", "Também foi criado o grupo de WhatsApp do projeto, para agilizar o dia a dia."],
    ["03/08", "Instagram atualizado", "Bio reescrita, capas de destaque no padrão da marca e link de compra na bio."],
    ["10/08", "Primeiras postagens no ar", "Começo da publicação de conteúdo seguindo o guia entregue."],
    ["24/08", "Encerramento da Etapa 1", "Esta apresentação: balanço do que foi feito e do que vem a seguir."],
  ];

  const rowH = 0.71, startY = 1.74;
  rows.forEach((r, i) => {
    const y = startY + i * rowH;
    const last = i === rows.length - 1;
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.04, w: 1.05, h: 0.42, rectRadius: 0.2,
      fill: { color: last ? GOLD : SAND }, line: { type: "none" },
    });
    s.addText(r[0], {
      x: M, y: y + 0.04, w: 1.05, h: 0.42,
      fontFace: BODY, fontSize: 12, bold: true, color: last ? WHITE : DARK,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: M + 1.3, y: y - 0.02, w: 5.15, h: 0.55,
      fontFace: HEAD, fontSize: 15, bold: true, color: DARK, lineSpacing: 20, margin: 0, valign: "middle",
    });
    s.addText(r[2], {
      x: M + 6.6, y: y - 0.02, w: W - 6.6, h: 0.55,
      fontFace: BODY, fontSize: 12, color: MUTED, lineSpacing: 16, margin: 0, valign: "middle",
    });
  });

  s.addNotes("Serve para mostrar ritmo: da aprovação até o conteúdo no ar foram 11 dias.");
}

// =====================================================================
// 4. IDENTIDADE VISUAL
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Entrega 1  ·  02/08", "Identidade visual: a cara da Pekar");

  card(s, M, 1.72, 6.9, 4.3);
  s.addText("O que é isso, na prática", {
    x: M + 0.45, y: 2.0, w: 6.0, h: 0.36,
    fontFace: HEAD, fontSize: 19, bold: true, color: DARK, margin: 0, valign: "middle",
  });
  s.addText(
    "Identidade visual é o conjunto de regras que faz a Pekar ser reconhecida " +
    "em qualquer lugar: no post, na etiqueta, na embalagem e na loja.\n\n" +
    "Sem isso, cada peça de comunicação sai com uma cara diferente e a marca " +
    "demora muito mais para ficar na memória da cliente.",
    {
      x: M + 0.45, y: 2.45, w: 6.0, h: 2.05,
      fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 20, margin: 0, valign: "top",
    }
  );
  s.addText("Entregue em dois arquivos:", {
    x: M + 0.45, y: 4.58, w: 6.0, h: 0.3,
    fontFace: BODY, fontSize: 13, bold: true, color: DARK, margin: 0, valign: "middle",
  });
  s.addText(
    [
      { text: "identidade-pekar (documento) — a explicação completa, para consulta", options: { bullet: true, breakLine: true } },
      { text: "identidade-pekar (apresentação) — a versão visual, para mostrar rápido", options: { bullet: true } },
    ],
    {
      x: M + 0.45, y: 4.92, w: 6.0, h: 1.05,
      fontFace: BODY, fontSize: 12.5, color: INK, paraSpaceAfter: 6, margin: 0, valign: "top",
    }
  );

  const rx = M + 7.2;
  const rw = W - 7.2;
  card(s, rx, 1.72, rw, 4.3, DARK);
  s.addText("O QUE ESTÁ DEFINIDO", {
    x: rx + 0.45, y: 2.05, w: rw - 0.9, h: 0.3,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2.2, color: GOLD, margin: 0, valign: "middle",
  });

  const items = [
    ["Logo tratada", "arquivos limpos e prontos para uso digital e impresso"],
    ["Paleta de cores", "as cores oficiais da marca, sempre as mesmas"],
    ["Tipografia", "as letras usadas em títulos e textos"],
    ["Aplicações", "como usar cada elemento sem errar"],
  ];
  items.forEach((it, i) => {
    const y = 2.55 + i * 0.85;
    goldCircle(s, rx + 0.45, y + 0.02, 0.34, "✓", 12);
    s.addText(it[0], {
      x: rx + 0.95, y: y - 0.04, w: rw - 1.4, h: 0.32,
      fontFace: HEAD, fontSize: 15, bold: true, color: WHITE, margin: 0, valign: "middle",
    });
    s.addText(it[1], {
      x: rx + 0.95, y: y + 0.28, w: rw - 1.4, h: 0.48,
      fontFace: BODY, fontSize: 12, color: SAND, lineSpacing: 15, margin: 0, valign: "top",
    });
  });

  s.addNotes("Se a Karen perguntar “para que serve”, o argumento é: repetição gera reconhecimento, e marca reconhecida vende com menos esforço.");
}

// =====================================================================
// 5. INSTAGRAM: BIO, DESTAQUES E LINK
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Entrega 2  ·  03/08", "Instagram: bio, destaques e link");

  const cols = [
    ["Bio", "O textinho embaixo do nome do perfil.", "Reescrita para dizer em poucas linhas quem é a Pekar, o que vende e onde encontrar as lojas."],
    ["Destaques", "As bolinhas fixas logo abaixo da bio.", "Ganharam capas no padrão da marca, para o perfil abrir bonito e organizado."],
    ["Link na bio", "O endereço clicável do perfil.", "Passou a levar para uma página própria da Pekar, com o caminho da compra pronto."],
  ];

  const cw = 3.83, gap = 0.27;
  cols.forEach((c, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.72, cw, 3.15);
    s.addText(c[0], {
      x: x + 0.35, y: 2.05, w: cw - 0.7, h: 0.4,
      fontFace: HEAD, fontSize: 21, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(c[1], {
      x: x + 0.35, y: 2.5, w: cw - 0.7, h: 0.55,
      fontFace: BODY, fontSize: 12.5, italic: true, color: GOLD, lineSpacing: 17, margin: 0, valign: "top",
    });
    s.addText(c[2], {
      x: x + 0.35, y: 3.1, w: cw - 0.7, h: 1.5,
      fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 19, margin: 0, valign: "top",
    });
  });

  card(s, M, 5.15, W, 1.45, SAND);
  s.addText("Por que os três juntos?", {
    x: M + 0.45, y: 5.35, w: 3.4, h: 0.32,
    fontFace: HEAD, fontSize: 16, bold: true, color: DARK, margin: 0, valign: "middle",
  });
  s.addText(
    "São os três primeiros pontos que uma pessoa nova olha ao chegar no perfil. " +
    "Se os três estão claros, ela entende a marca em segundos e sabe para onde ir para comprar.",
    {
      x: M + 0.45, y: 5.72, w: W - 0.9, h: 0.65,
      fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 19, margin: 0, valign: "top",
    }
  );

  s.addNotes("Vale abrir o perfil no celular durante a apresentação e mostrar ao vivo.");
}

// =====================================================================
// 6. O SITE / LINK NA BIO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  heading(s, "Entrega 3", "A página da Pekar no link da bio", true);

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 1.75, w: W, h: 0.95, rectRadius: 0.08,
    fill: { color: GOLD }, line: { type: "none" },
  });
  s.addText("pekar-joias.web.app", {
    x: M, y: 1.75, w: W, h: 0.95,
    fontFace: HEAD, fontSize: 30, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0,
  });
  s.addText("Este é o endereço oficial. Use sempre ele na bio do Instagram e nas conversas com clientes.", {
    x: M, y: 2.78, w: W, h: 0.3,
    fontFace: BODY, fontSize: 12.5, italic: true, color: SAND,
    align: "center", valign: "middle", margin: 0,
  });

  const blocks = [
    ["Compre pelo WhatsApp", "Abre a conversa direto no número da loja: (12) 97401-1503."],
    ["Garantia", "Explica a garantia das peças antes mesmo da cliente perguntar."],
    ["Formato de entrega", "Deixa claro como a joia chega até a cliente."],
    ["Ouvidoria", "Um canal para elogio, dúvida ou reclamação, no mesmo WhatsApp."],
  ];
  const bw = 2.86, gap = 0.29;
  blocks.forEach((b, i) => {
    const x = M + i * (bw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 3.4, w: bw, h: 2.2, rectRadius: 0.07,
      fill: { color: CARD_D }, line: { type: "none" },
    });
    goldCircle(s, x + 0.3, 3.66, 0.34, String(i + 1), 12);
    s.addText(b[0], {
      x: x + 0.3, y: 4.08, w: bw - 0.6, h: 0.62,
      fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE, lineSpacing: 19, margin: 0, valign: "top",
    });
    s.addText(b[1], {
      x: x + 0.3, y: 4.72, w: bw - 0.6, h: 0.78,
      fontFace: BODY, fontSize: 12, color: SAND, lineSpacing: 16, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Em linguagem simples: o Instagram não deixa colocar vários links no perfil. " +
    "Essa página resolve isso — um único link que abre todos os caminhos da Pekar de uma vez.",
    {
      x: M, y: 5.85, w: W, h: 0.7,
      fontFace: BODY, fontSize: 14, color: SAND, lineSpacing: 21, margin: 0, valign: "top",
    }
  );

  s.addNotes("Alerta importante: o link antigo (tinyurl) foi descontinuado porque exigia login. Se alguém ainda usa, trocar por pekar-joias.web.app.");
}

// =====================================================================
// 7. CONTEÚDO: GUIA + POSTAGENS
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Entrega 4  ·  02/08 e 10/08", "Guia de Instagram e início das postagens");

  const col = (x, num, titulo, data, texto) => {
    card(s, x, 1.72, 5.88, 4.3);
    goldCircle(s, x + 0.45, 2.0, 0.46, num);
    s.addText(titulo, {
      x: x + 1.1, y: 2.0, w: 4.35, h: 0.46,
      fontFace: HEAD, fontSize: 19, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(data, {
      x: x + 0.45, y: 2.6, w: 4.98, h: 0.28,
      fontFace: BODY, fontSize: 12, italic: true, color: GOLD, margin: 0, valign: "middle",
    });
    s.addText(texto, {
      x: x + 0.45, y: 2.98, w: 4.98, h: 2.6,
      fontFace: BODY, fontSize: 14, color: INK, lineSpacing: 21, margin: 0, valign: "top",
    });
  };

  col(M, "1", "Guia básico de Instagram", "Entregue em 02/08",
    "Um material escrito para a Karen e a equipe, explicando sem termo técnico como manter o perfil: " +
    "o que postar, com que frequência, como escrever as legendas e o que evita que o post seja pouco visto.\n\n" +
    "A ideia é que a Pekar consiga tocar o dia a dia sozinha, sem depender de ninguém.");

  col(M + 6.15, "2", "Postagens no ar", "Desde 10/08",
    "A partir do dia 10 de agosto o perfil passou a publicar seguindo o guia e a identidade da marca — " +
    "mesma linguagem, mesmas cores, mesma lógica.\n\n" +
    "São 15 dias de publicação até esta apresentação. É o começo de uma rotina, não uma ação pontual: " +
    "o resultado aparece com constância.");

  s.addText(
    "O guia é material da Pekar: fica com a equipe para consultar sempre que precisar.",
    {
      x: M, y: 6.25, w: W, h: 0.35,
      fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Ponto-chave para a próxima proposta: 15 dias é pouco tempo para medir resultado de conteúdo.");
}

// =====================================================================
// 8. RESULTADOS NO INSTAGRAM
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  heading(s, "Resultados", "O que os números mostram até aqui", true);

  const stats = [
    ["2.826", "seguidores no início", "31 de julho"],
    ["2.836", "seguidores hoje", "24 de agosto"],
    ["+10", "novos seguidores", "no período"],
    ["15", "dias de postagens", "de 10/08 a 24/08"],
  ];
  const bw = 2.86, gap = 0.29;
  stats.forEach((st, i) => {
    const x = M + i * (bw + gap);
    const hl = i === 2;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.8, w: bw, h: 1.9, rectRadius: 0.07,
      fill: { color: hl ? GOLD : CARD_D }, line: { type: "none" },
    });
    s.addText(st[0], {
      x: x + 0.15, y: 1.95, w: bw - 0.3, h: 0.85,
      fontFace: HEAD, fontSize: 40, bold: true, color: WHITE,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.15, y: 2.8, w: bw - 0.3, h: 0.32,
      fontFace: BODY, fontSize: 13.5, bold: true, color: WHITE,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st[2], {
      x: x + 0.15, y: 3.12, w: bw - 0.3, h: 0.3,
      fontFace: BODY, fontSize: 11.5, color: hl ? "F7EFE4" : SAND,
      align: "center", valign: "middle", margin: 0,
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 3.92, w: W, h: 2.62, rectRadius: 0.08,
    fill: { color: CARD_D }, line: { type: "none" },
  });
  s.addText("Lendo esses números com honestidade", {
    x: M + 0.5, y: 4.14, w: W - 1.0, h: 0.36,
    fontFace: HEAD, fontSize: 19, bold: true, color: GOLD, margin: 0, valign: "middle",
  });
  s.addText(
    "O número de seguidores cresceu pouco — e isso era esperado. Esta primeira etapa não foi de crescimento, " +
    "foi de arrumar a casa: definir a identidade, organizar o perfil, criar o caminho de compra e resolver o " +
    "problema de acesso no Google.\n\n" +
    "Seguidor novo vem depois, com constância de publicação e ações feitas para atrair gente de fora. " +
    "Com apenas 15 dias de conteúdo no ar, ainda não dá para medir isso — o que existe hoje é uma base pronta " +
    "para esse crescimento acontecer.",
    {
      x: M + 0.5, y: 4.56, w: W - 1.0, h: 1.85,
      fontFace: BODY, fontSize: 13, color: SAND, lineSpacing: 19, margin: 0, valign: "top",
    }
  );

  s.addNotes(
    "Não esconder o número. A leitura correta: base construída na etapa 1, crescimento é objetivo da etapa 2. " +
    "Se a Karen tiver alcance e visitas ao perfil no aplicativo, vale complementar esse slide depois."
  );
}

// =====================================================================
// 9. GOOGLE MEU NEGÓCIO — O PROBLEMA
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Google Meu Negócio", "O que estava acontecendo");

  card(s, M, 1.72, W, 0.95, SAND);
  s.addText(
    "O combinado era atualizar fotos e informações das lojas no Google. Ao entrar, descobrimos que a Pekar " +
    "não tinha acesso para editar — então o trabalho virou investigação.",
    {
      x: M + 0.5, y: 1.72, w: W - 1.0, h: 0.95,
      fontFace: BODY, fontSize: 14, color: INK, lineSpacing: 20, margin: 0, valign: "middle",
    }
  );

  const found = [
    ["Duas contas em Juquehy", "Existem dois cadastros da Pekar na mesma cidade. Um está como loja e o outro aparece como restaurante."],
    ["Acesso em e-mail antigo", "O cadastro de Maresias e um dos de Juquehy estão ligados a um e-mail antigo (co....@gmail.com), fora do controle da Pekar."],
    ["Efeito prático", "Sem o acesso, ninguém consegue corrigir foto, horário, endereço ou telefone — e a cliente vê informação errada."],
  ];
  const cw = 3.83, gap = 0.27;
  found.forEach((f, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.95, cw, 2.7);
    goldCircle(s, x + 0.35, 3.22, 0.4, "!", 15);
    s.addText(f[0], {
      x: x + 0.35, y: 3.75, w: cw - 0.7, h: 0.62,
      fontFace: HEAD, fontSize: 16.5, bold: true, color: DARK, lineSpacing: 21, margin: 0, valign: "top",
    });
    s.addText(f[1], {
      x: x + 0.35, y: 4.4, w: cw - 0.7, h: 1.15,
      fontFace: BODY, fontSize: 13, color: INK, lineSpacing: 18, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Google Meu Negócio é o cadastro que faz a loja aparecer no Google e no Google Maps, com foto, horário e telefone.",
    {
      x: M, y: 5.9, w: W, h: 0.35,
      fontFace: BODY, fontSize: 12.5, italic: true, color: MUTED, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Deixar claro que não foi trabalho a menos: foi um problema real que impedia a entrega combinada e precisou ser resolvido antes.");
}

// =====================================================================
// 10. GOOGLE MEU NEGÓCIO — A SOLUÇÃO
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Google Meu Negócio", "O que foi feito no lugar");

  const steps = [
    ["Pesquisa e diagnóstico", "Levantamento de todos os cadastros da Pekar no Google, para entender por que o acesso estava bloqueado e quantas contas existiam."],
    ["Criação de um e-mail oficial", "Criado o e-mail pekarjoias@gmail.com, no nome da marca, para ser o dono definitivo dos cadastros — e não mais um e-mail pessoal de terceiros."],
    ["Reivindicação dos acessos", "Feito o pedido de recuperação das contas junto ao Google usando esse e-mail. Etapa concluída."],
  ];

  steps.forEach((st, i) => {
    const y = 1.75 + i * 1.42;
    card(s, M, y, W, 1.24);
    goldCircle(s, M + 0.42, y + 0.32, 0.6, String(i + 1), 20);
    s.addText(st[0], {
      x: M + 1.25, y: y + 0.16, w: 5.0, h: 0.38,
      fontFace: HEAD, fontSize: 18, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(st[1], {
      x: M + 1.25, y: y + 0.56, w: W - 1.8, h: 0.55,
      fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 19, margin: 0, valign: "top",
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 6.05, w: W, h: 0.85, rectRadius: 0.07,
    fill: { color: DARK }, line: { type: "none" },
  });
  s.addText(
    [
      { text: "Resultado:  ", options: { bold: true, color: GOLD } },
      { text: "a Pekar passa a ser dona dos próprios cadastros. Com o acesso liberado, fica possível corrigir as informações das lojas e resolver a conta duplicada de Juquehy.", options: { color: SAND } },
    ],
    {
      x: M + 0.5, y: 6.05, w: W - 1.0, h: 0.85,
      fontFace: BODY, fontSize: 13.5, lineSpacing: 19, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Esse é o item de maior valor escondido da etapa: recuperar a posse dos cadastros evita dor de cabeça permanente.");
}

// =====================================================================
// 11. BÔNUS — DRIVE
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Bônus", "Todos os arquivos, em um lugar só");

  card(s, M, 1.72, 6.5, 3.95, DARK);
  s.addText("Uma pasta no Google Drive", {
    x: M + 0.5, y: 2.05, w: 5.5, h: 0.4,
    fontFace: HEAD, fontSize: 21, bold: true, color: WHITE, margin: 0, valign: "middle",
  });
  s.addText("dentro do e-mail pekarjoias@gmail.com", {
    x: M + 0.5, y: 2.48, w: 5.5, h: 0.3,
    fontFace: BODY, fontSize: 13, italic: true, color: GOLD, margin: 0, valign: "middle",
  });
  s.addText(
    "Não estava na proposta, mas foi criada para que a Pekar nunca precise pedir arquivo para ninguém.\n\n" +
    "Está tudo dentro do e-mail da própria marca. Se a equipe mudar, os arquivos continuam lá.",
    {
      x: M + 0.5, y: 2.95, w: 5.5, h: 2.4,
      fontFace: BODY, fontSize: 14, color: SAND, lineSpacing: 21, margin: 0, valign: "top",
    }
  );

  const rx = M + 6.8;
  const rw = W - 6.8;
  card(s, rx, 1.72, rw, 3.95);
  s.addText("O QUE TEM DENTRO", {
    x: rx + 0.45, y: 2.05, w: rw - 0.9, h: 0.3,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2.2, color: GOLD, margin: 0, valign: "middle",
  });

  const files = [
    ["Capas de destaque do Instagram", "as imagens das bolinhas do perfil"],
    ["Imagens da logo", "versões tratadas, prontas para uso"],
    ["Documentos do projeto", "identidade, guia de Instagram e demais materiais"],
  ];
  files.forEach((f, i) => {
    const y = 2.55 + i * 1.0;
    goldCircle(s, rx + 0.45, y + 0.02, 0.34, "✓", 12);
    s.addText(f[0], {
      x: rx + 0.98, y: y - 0.08, w: rw - 1.45, h: 0.42,
      fontFace: HEAD, fontSize: 15, bold: true, color: DARK, lineSpacing: 19, margin: 0, valign: "middle",
    });
    s.addText(f[1], {
      x: rx + 0.98, y: y + 0.36, w: rw - 1.45, h: 0.5,
      fontFace: BODY, fontSize: 12.5, color: MUTED, lineSpacing: 17, margin: 0, valign: "top",
    });
  });

  s.addText(
    "Para acessar: entrar no Google Drive com o e-mail pekarjoias@gmail.com.",
    {
      x: M, y: 5.9, w: W, h: 0.35,
      fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Reforçar que é um bônus, fora do escopo contratado.");
}

// =====================================================================
// 12. PENDÊNCIAS
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Prontos, mas ainda não no ar", "Duas coisas que dependem da Pekar");

  s.addText(
    "As duas capas abaixo já foram criadas e estão guardadas no Drive. " +
    "Para entrarem no perfil, falta o conteúdo que só a loja consegue produzir.",
    {
      x: M, y: 1.66, w: W, h: 0.42,
      fontFace: BODY, fontSize: 14, color: INK, lineSpacing: 20, margin: 0, valign: "middle",
    }
  );

  const pend = [
    [
      "Destaque: Guia de medidas de anel",
      "A capa está pronta.",
      "O vídeo foi gravado pela Karen em 24/08 — falta enviar para a Adriana para o destaque entrar no perfil.",
      "Com a Karen",
    ],
    [
      "Destaque: Depoimentos de clientes",
      "A capa está pronta.",
      "Falta a Karen e as vendedoras colherem os depoimentos com as clientes das lojas.",
      "Com a Karen e a equipe",
    ],
  ];

  const cw = 5.88, gap = 0.27;
  pend.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.25, cw, 3.4);
    s.addText(p[0], {
      x: x + 0.45, y: 2.52, w: cw - 0.9, h: 0.78,
      fontFace: HEAD, fontSize: 19, bold: true, color: DARK, lineSpacing: 25, margin: 0, valign: "top",
    });
    s.addText(p[1], {
      x: x + 0.45, y: 3.3, w: cw - 0.9, h: 0.3,
      fontFace: BODY, fontSize: 13, italic: true, color: GOLD, margin: 0, valign: "middle",
    });
    s.addText(p[2], {
      x: x + 0.45, y: 3.7, w: cw - 0.9, h: 1.0,
      fontFace: BODY, fontSize: 13.5, color: INK, lineSpacing: 19, margin: 0, valign: "top",
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.45, y: 4.85, w: 2.95, h: 0.46, rectRadius: 0.22,
      fill: { color: DARK }, line: { type: "none" },
    });
    s.addText(p[3], {
      x: x + 0.45, y: 4.85, w: 2.95, h: 0.46,
      fontFace: BODY, fontSize: 12, bold: true, color: WHITE,
      align: "center", valign: "middle", margin: 0,
    });
  });

  s.addText(
    "Assim que os dois chegarem, os destaques entram no perfil e a vitrine do Instagram fica completa.",
    {
      x: M, y: 5.88, w: W, h: 0.35,
      fontFace: BODY, fontSize: 13, italic: true, color: MUTED, margin: 0, valign: "middle",
    }
  );

  s.addNotes("Combinar prazo aqui: pedir o vídeo do guia de medidas ainda nesta semana.");
}

// =====================================================================
// 13. O QUE FICA COM A PEKAR
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  heading(s, "Balanço", "O que a Pekar leva desta etapa");

  const assets = [
    ["Identidade visual definida", "documento e apresentação com as regras da marca"],
    ["Logo tratada", "arquivos prontos para qualquer uso"],
    ["Perfil do Instagram organizado", "bio, capas de destaque e link de compra"],
    ["Página própria no ar", "pekar-joias.web.app, com o caminho da compra"],
    ["Guia básico de Instagram", "para tocar o perfil sem depender de terceiros"],
    ["E-mail oficial da marca", "pekarjoias@gmail.com, dono dos cadastros"],
    ["Acessos do Google reivindicados", "caminho aberto para corrigir as lojas"],
    ["Pasta no Drive", "todos os arquivos do projeto, sempre à mão"],
  ];

  const cw = 5.88, ch = 0.98, gap = 0.27, vgap = 0.16;
  assets.forEach((a, i) => {
    const c = i % 2, r = Math.floor(i / 2);
    const x = M + c * (cw + gap);
    const y = 1.72 + r * (ch + vgap);
    card(s, x, y, cw, ch);
    goldCircle(s, x + 0.32, y + 0.3, 0.38, "✓", 13);
    s.addText(a[0], {
      x: x + 0.85, y: y + 0.12, w: cw - 1.2, h: 0.38,
      fontFace: HEAD, fontSize: 15, bold: true, color: DARK, margin: 0, valign: "middle",
    });
    s.addText(a[1], {
      x: x + 0.85, y: y + 0.5, w: cw - 1.2, h: 0.36,
      fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0, valign: "middle",
    });
  });

  s.addNotes("Fecha a sensação de valor entregue: são ativos permanentes da marca, não serviço consumido.");
}

// =====================================================================
// 14. ENCERRAMENTO E PRÓXIMOS PASSOS
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: DARK };

  s.addShape(pres.ShapeType.ellipse, {
    x: 10.4, y: 4.6, w: 3.6, h: 3.6,
    fill: { color: GOLD, transparency: 88 }, line: { type: "none" },
  });

  heading(s, "Encerramento", "Etapa 1 concluída", true);

  card(s, M, 1.9, 5.88, 2.05, CARD_D);
  s.addText("STATUS DO PROJETO", {
    x: M + 0.45, y: 2.13, w: 4.98, h: 0.28,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2.2, color: GOLD, margin: 0, valign: "middle",
  });
  s.addText("Concluída", {
    x: M + 0.45, y: 2.46, w: 4.98, h: 0.6,
    fontFace: HEAD, fontSize: 32, bold: true, color: WHITE, margin: 0, valign: "middle",
  });
  s.addText("Todas as frentes combinadas foram entregues ou resolvidas.", {
    x: M + 0.45, y: 3.1, w: 4.98, h: 0.62,
    fontFace: BODY, fontSize: 13, color: SAND, lineSpacing: 18, margin: 0, valign: "top",
  });

  const rx = M + 6.15;
  card(s, rx, 1.9, 5.88, 2.05, CARD_D);
  s.addText("PARCELA FINAL (50%)", {
    x: rx + 0.45, y: 2.13, w: 4.98, h: 0.28,
    fontFace: BODY, fontSize: 11, bold: true, charSpacing: 2.2, color: GOLD, margin: 0, valign: "middle",
  });
  s.addText("R$ 1.250,00", {
    x: rx + 0.45, y: 2.46, w: 4.98, h: 0.6,
    fontFace: HEAD, fontSize: 32, bold: true, color: WHITE, margin: 0, valign: "middle",
  });
  s.addText("Vencimento em 01/09/2026, conforme a proposta aprovada em 30/07.", {
    x: rx + 0.45, y: 3.1, w: 4.98, h: 0.62,
    fontFace: BODY, fontSize: 13, color: SAND, lineSpacing: 18, margin: 0, valign: "top",
  });

  s.addText("Próximos passos", {
    x: M, y: 4.15, w: W, h: 0.42,
    fontFace: HEAD, fontSize: 22, bold: true, color: GOLD, margin: 0, valign: "middle",
  });

  const next = [
    ["Enviar o vídeo do guia de medidas", "para publicar o destaque que já está pronto"],
    ["Colher depoimentos de clientes", "com a Karen e as vendedoras, nas duas lojas"],
    ["Nova proposta para a Etapa 2", "com foco em crescimento e em concluir o Google"],
  ];
  const nw = 3.83, ngap = 0.27;
  next.forEach((n, i) => {
    const x = M + i * (nw + ngap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 4.68, w: nw, h: 1.38, rectRadius: 0.07,
      fill: { color: CARD_D }, line: { type: "none" },
    });
    s.addText(n[0], {
      x: x + 0.32, y: 4.86, w: nw - 0.64, h: 0.62,
      fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE, lineSpacing: 19, margin: 0, valign: "top",
    });
    s.addText(n[1], {
      x: x + 0.32, y: 5.46, w: nw - 0.64, h: 0.52,
      fontFace: BODY, fontSize: 12, color: SAND, lineSpacing: 16, margin: 0, valign: "top",
    });
  });

  s.addText("Obrigada pela confiança, Karen.", {
    x: M, y: 6.4, w: 8, h: 0.4,
    fontFace: HEAD, fontSize: 17, italic: true, color: SAND, margin: 0, valign: "middle",
  });

  s.addNotes("Fechar combinando os dois pedidos pendentes e anunciar que a proposta da Etapa 2 chega em seguida.");
}

pres.writeFile({ fileName: "Pekar-Encerramento-Etapa-1.pptx" }).then(f => console.log("OK:", f));
