// Gera o .pptx a partir de layout.json (produzido por extract_layout.py).
// Cada bloco de texto vira uma caixa de texto nativa, editável no PowerPoint.
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const BASE = __dirname;
const pages = JSON.parse(fs.readFileSync(path.join(BASE, 'layout.json'), 'utf8'));
const LOGOS = {
  'logo-pc': path.join(BASE, 'build', 'logos', 'logo-pc.png'),
  'logo-vx': path.join(BASE, 'build', 'logos', 'logo-vx.png'),
};

// O PowerPoint só conhece regular/negrito por família, então cada peso do
// projeto foi instalado como uma família própria (ver fontes-para-instalar/).
function face(family, weight, italic) {
  if (family === 'EB Garamond') {
    if (weight >= 600) return { fontFace: 'EB Garamond', bold: true, italic };
    if (weight >= 500) return { fontFace: 'EB Garamond Medium', bold: false, italic };
    return { fontFace: 'EB Garamond', bold: false, italic };
  }
  if (weight >= 600) return { fontFace: 'Jost', bold: true, italic };
  if (weight >= 500) return { fontFace: 'Jost Medium', bold: false, italic };
  if (weight <= 300) return { fontFace: 'Jost Light', bold: false, italic };
  return { fontFace: 'Jost', bold: false, italic };
}

// folga horizontal: o PowerPoint compõe o texto de forma ligeiramente
// diferente do Chromium, e sem isso a última palavra às vezes desce de linha
const SLACK = 0.05;

const pres = new pptxgen();
pres.defineLayout({ name: 'A4L', width: pages[0].w, height: pages[0].h });
pres.layout = 'A4L';
pres.author = 'Pousada Camburi';
pres.title = 'Projeto Victorinox — Experiência Camburi';

const rank = { rect: 0, image: 1, text: 2 };

pages.forEach((pg) => {
  const slide = pres.addSlide();
  slide.background = { color: 'FFFFFF' };

  const items = pg.items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (rank[a.it.kind] - rank[b.it.kind]) || (a.i - b.i))
    .map((o) => o.it);

  items.forEach((it) => {
    if (it.kind === 'rect') {
      const r = Math.min(it.radius || 0, it.h / 2, it.w / 2);
      if (r > 0.004) {
        slide.addShape(pres.ShapeType.roundRect, {
          x: it.x, y: it.y, w: it.w, h: it.h,
          fill: { color: it.fill }, line: { type: 'none' },
          rectRadius: r,
        });
      } else {
        slide.addShape(pres.ShapeType.rect, {
          x: it.x, y: it.y, w: it.w, h: it.h,
          fill: { color: it.fill }, line: { type: 'none' },
        });
      }
      return;
    }

    if (it.kind === 'image') {
      const file = LOGOS[it.ref];
      if (file) slide.addImage({ path: file, x: it.x, y: it.y, w: it.w, h: it.h });
      return;
    }

    const runs = it.runs.map((r) => {
      const f = face(r.font, r.weight, r.italic);
      return {
        text: r.text,
        options: {
          ...f, fontSize: r.size, color: r.color,
          charSpacing: r.spacing || 0,
          breakLine: !!r.br,
        },
      };
    });

    const align = it.align === 'right' || it.align === 'center' ? it.align : 'left';
    let x = it.x + (it.padL || 0);
    let w = it.w - (it.padL || 0) - (it.padR || 0);
    if (align === 'right') { x -= SLACK; w += SLACK; }
    else if (align === 'center') { x -= SLACK / 2; w += SLACK; }
    else { w += SLACK; }

    slide.addText(runs, {
      x, y: it.y + (it.padT || 0), w, h: it.h - (it.padT || 0),
      isTextBox: true, margin: 0, wrap: true, shrinkText: false,
      valign: 'top', align, lineSpacing: it.line,
    });
  });
});

const out = path.join(BASE, 'Proposta_Victorinox_Experiencia_Camburi_V4.pptx');
pres.writeFile({ fileName: out }).then(() => {
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`gerado: ${out} (${kb} KB, ${pages.length} slides)`);
});
