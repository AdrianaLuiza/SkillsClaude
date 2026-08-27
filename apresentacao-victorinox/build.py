#!/usr/bin/env python3
"""Renderiza deck.html em PDF A4 usando o Chromium do Playwright."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE = pathlib.Path(__file__).resolve().parent
SRC = BASE / "deck.html"
OUT = BASE / "Proposta_Victorinox_Experiencia_Camburi_V4.pdf"
CHROMIUM = "/opt/pw-browsers/chromium"


def main() -> int:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROMIUM, args=["--no-sandbox"])
        page = browser.new_page()
        page.goto(SRC.as_uri(), wait_until="networkidle")
        page.wait_for_timeout(600)
        page.pdf(
            path=str(OUT),
            width="297mm",
            height="210mm",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=True,
        )
        browser.close()
    print(f"gerado: {OUT} ({OUT.stat().st_size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
