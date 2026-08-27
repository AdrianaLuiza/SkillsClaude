#!/usr/bin/env python3
"""Lê um deck HTML no Chromium e exporta a geometria de cada página em JSON.

    python3 extract_layout.py [origem.html] [saida.json]

O PPTX é gerado a partir desse JSON (ver build_pptx.js), de modo que as
posições saem da renderização real do CSS em vez de serem recalculadas à mão.
Unidades de saída: polegadas para geometria, pontos para tipografia.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE = pathlib.Path(__file__).resolve().parent
LOGO_DIR = BASE / "build" / "logos"
CHROMIUM = "/opt/pw-browsers/chromium"

# 96 px CSS = 1 pol.; 1 px = 0,75 pt
PX_IN = 96.0
PX_PT = 0.75

WALK = r"""
() => {
  const PAGES = [...document.querySelectorAll('.page')];
  const rgb = s => {
    const m = s.match(/[\d.]+/g);
    if (!m) return null;
    const a = m.length > 3 ? parseFloat(m[3]) : 1;
    if (a < 0.02) return null;
    const hex = m.slice(0, 3)
      .map(v => Math.round(+v).toString(16).padStart(2, '0')).join('');
    return { hex: hex.toUpperCase(), alpha: a };
  };
  const isInline = el => {
    const d = getComputedStyle(el).display;
    return d === 'inline' || d === 'inline-block';
  };
  // Um elemento é "bloco de texto" quando tem texto próprio e nenhum filho
  // de nível bloco — assim <p><strong>x</strong> y</p> vira um só bloco.
  const isTextBlock = el => {
    let hasText = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim()) hasText = true;
      if (n.nodeType === 1 && !isInline(n)) return false;
    }
    if (!hasText) {
      // caso de um único filho inline carregando todo o texto
      const kids = [...el.children];
      if (kids.length && kids.every(isInline) && el.textContent.trim()) return true;
      return false;
    }
    return true;
  };

  const out = [];
  PAGES.forEach((page, pi) => {
    const org = page.getBoundingClientRect();
    const items = [];
    const push = o => items.push(o);

    // Constrói os "runs" (trechos com formatação própria) de uma lista de nós,
    // preservando <br> como quebra de linha.
    const runsOfNodes = (nodes, parentStyle) => {
      const runs = [];
      const visit = (node, cs) => {
        if (node.nodeType === 3) {
          let t = node.textContent.replace(/\s+/g, ' ');
          if (!t.trim()) return;
          if (cs.textTransform === 'uppercase') t = t.toUpperCase();
          const col = rgb(cs.color) || { hex: '000000' };
          runs.push({
            text: t,
            font: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
            size: parseFloat(cs.fontSize) * 0.75,
            weight: parseInt(cs.fontWeight, 10) || 400,
            italic: cs.fontStyle === 'italic',
            color: col.hex,
            spacing: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) * 0.75,
            br: false
          });
          return;
        }
        if (node.nodeType !== 1) return;
        if (node.tagName === 'BR') {
          if (runs.length) runs[runs.length - 1].br = true;
          return;
        }
        const s = getComputedStyle(node);
        for (const c of node.childNodes) visit(c, s);
      };
      for (const n of nodes) visit(n, parentStyle);
      return runs;
    };
    const runsOf = el => runsOfNodes([...el.childNodes], getComputedStyle(el));

    const walk = el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      const box = {
        x: (r.left - org.left), y: (r.top - org.top), w: r.width, h: r.height
      };

      if (el.tagName.toLowerCase() === 'svg') {
        push({ kind: 'image', ref: el.dataset.logo, ...box });
        return;
      }

      const bg = rgb(cs.backgroundColor);
      if (bg && box.w > 0.5 && box.h > 0.5) {
        push({
          kind: 'rect', ...box, fill: bg.hex,
          radius: Math.max(...['borderTopLeftRadius', 'borderTopRightRadius',
            'borderBottomLeftRadius', 'borderBottomRightRadius']
            .map(k => parseFloat(cs[k]) || 0))
        });
      }
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        const wpx = parseFloat(cs['border' + side + 'Width']) || 0;
        const col = rgb(cs['border' + side + 'Color']);
        if (wpx <= 0 || !col || cs['border' + side + 'Style'] === 'none') continue;
        const horiz = side === 'Top' || side === 'Bottom';
        push({
          kind: 'rect',
          x: box.x + (side === 'Right' ? box.w - wpx : 0),
          y: box.y + (side === 'Bottom' ? box.h - wpx : 0),
          w: horiz ? box.w : wpx,
          h: horiz ? wpx : box.h,
          fill: col.hex, radius: 0
        });
      }
      // pseudo-elemento ::before dos cartões (a régua vermelha do topo)
      const pb = getComputedStyle(el, '::before');
      const pbBg = rgb(pb.backgroundColor);
      if (pb.content && pb.content !== 'none' && pbBg) {
        const pw = parseFloat(pb.width) || 0, ph = parseFloat(pb.height) || 0;
        if (pw > 0 && ph > 0) {
          push({ kind: 'rect', x: box.x, y: box.y, w: pw, h: ph, fill: pbBg.hex, radius: 0 });
        }
      }

      const common = () => ({
        align: cs.textAlign === 'start' ? 'left' : cs.textAlign,
        line: cs.lineHeight === 'normal'
          ? parseFloat(cs.fontSize) * 1.2 * 0.75
          : parseFloat(cs.lineHeight) * 0.75
      });

      if (isTextBlock(el)) {
        const runs = runsOf(el);
        if (runs.length) {
          push({
            kind: 'text', ...box, runs, ...common(),
            padL: parseFloat(cs.paddingLeft) || 0,
            padT: parseFloat(cs.paddingTop) || 0,
            padR: parseFloat(cs.paddingRight) || 0
          });
        }
        return;
      }

      // Conteúdo misto: agrupa filhos inline/texto consecutivos e mede cada
      // grupo com um Range, senão o texto solto ao lado de um filho de bloco
      // se perde (o caso de <h1>Título<em>Subtítulo</em></h1>).
      let group = [];
      const flush = () => {
        if (!group.length) return;
        const rng = document.createRange();
        rng.setStartBefore(group[0]);
        rng.setEndAfter(group[group.length - 1]);
        const rr = rng.getBoundingClientRect();
        const runs = runsOfNodes(group, cs);
        if (runs.length && rr.width > 0 && rr.height > 0) {
          push({
            kind: 'text', runs, ...common(),
            x: rr.left - org.left, y: rr.top - org.top, w: rr.width, h: rr.height
          });
        }
        group = [];
      };
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { if (n.textContent.trim()) group.push(n); continue; }
        if (n.nodeType !== 1) continue;
        if (isInline(n) || n.tagName === 'BR') { group.push(n); continue; }
        flush();
        walk(n);
      }
      flush();
    };

    walk(page);
    out.push({ index: pi, w: org.width, h: org.height, items });
  });
  return out;
}
"""


def main(argv) -> int:
    src = BASE / (argv[0] if argv else "deck.html")
    out = BASE / (argv[1] if len(argv) > 1 else f"build/{src.stem}.layout.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1400, "height": 900},
                                device_scale_factor=4)
        page.goto(src.as_uri(), wait_until="networkidle")
        page.wait_for_timeout(700)

        # marca cada <svg> de logo para que o extrator saiba qual imagem usar
        page.evaluate("""() => {
          document.querySelectorAll('svg').forEach(s => {
            const u = s.querySelector('use');
            if (u) s.dataset.logo = (u.getAttribute('href') || '').replace('#', '');
          });
        }""")

        # rasteriza uma vez cada logo, no maior tamanho em que aparece
        for ref, sel in (("logo-pc", ".cover .pc-logo"), ("logo-vx", ".cover .close .vx")):
            el = page.query_selector(sel)
            el.screenshot(path=str(LOGO_DIR / f"{ref}.png"), omit_background=True)

        data = page.evaluate(WALK)
        browser.close()

    for pg in data:
        pg["w"] /= PX_IN
        pg["h"] /= PX_IN
        for it in pg["items"]:
            for k in ("x", "y", "w", "h"):
                it[k] /= PX_IN
            for k in ("padL", "padT", "padR"):
                if k in it:
                    it[k] /= PX_IN
            if "radius" in it:
                it["radius"] /= PX_IN

    out.write_text(json.dumps(data))
    n = sum(len(p["items"]) for p in data)
    print(f"{src.name}: {len(data)} páginas, {n} elementos -> {out.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
