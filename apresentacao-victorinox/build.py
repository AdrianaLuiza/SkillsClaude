#!/usr/bin/env python3
"""Renderiza um deck HTML em PDF usando o Chromium do Playwright.

    python3 build.py [origem.html] [saida.pdf]

Sem argumentos, gera a proposta (deck.html).
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE = pathlib.Path(__file__).resolve().parent
CHROMIUM = "/opt/pw-browsers/chromium"
PADRAO = {
    "deck.html": "Proposta_Victorinox_Experiencia_Camburi_V4.pdf",
    "carta.html": "Carta_Apresentacao_Pousada_Camburi_Victorinox.pdf",
}


def main(argv) -> int:
    src = BASE / (argv[0] if argv else "deck.html")
    out = BASE / (argv[1] if len(argv) > 1 else PADRAO.get(src.name, src.stem + ".pdf"))
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
        page = browser.new_page()
        page.goto(src.as_uri(), wait_until="networkidle")
        page.wait_for_timeout(600)
        # o tamanho da folha sai do próprio CSS: a proposta é paisagem e a
        # carta é retrato, e cada uma define isso no seu .page
        box = page.evaluate("""() => {
            const r = document.querySelector('.page').getBoundingClientRect();
            return { w: r.width / 96 * 25.4, h: r.height / 96 * 25.4 };
        }""")
        page.pdf(
            path=str(out),
            width=f"{box['w']:.2f}mm",
            height=f"{box['h']:.2f}mm",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=True,
        )
        browser.close()
    print(f"gerado: {out.name} ({out.stat().st_size/1024:.0f} KB, "
          f"{box['w']:.0f}\u00d7{box['h']:.0f} mm)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
