"""Reconstrucao aproximada dos dois logos para uso na planilha."""
import math
import pathlib
from PIL import Image, ImageDraw, ImageFont

OUT = str(pathlib.Path(__file__).parent / "assets")
S = 4  # supersampling

SANS_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SERIF_I = "/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf"

VINO = (110, 12, 36)
NAVY = (27, 58, 92)
AZUL = (74, 159, 216)
AZUL_CLARO = (125, 190, 228)


def tracked_text(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x - tracking


def text_width(draw, text, font, tracking):
    return sum(draw.textlength(c, font=font) for c in text) + tracking * (len(text) - 1)


def shield(cx, top, halfw, bodyh, tiph, r, steps=24):
    """Poligono de escudo: topo com cantos arredondados, base em ponta."""
    pts = [(cx - halfw, top + r)]
    for i in range(steps + 1):                      # canto superior esquerdo
        a = math.pi + i * (math.pi / 2) / steps
        pts.append((cx - halfw + r + r * math.cos(a), top + r + r * math.sin(a)))
    for i in range(steps + 1):                      # canto superior direito
        a = -math.pi / 2 + i * (math.pi / 2) / steps
        pts.append((cx + halfw - r + r * math.cos(a), top + r + r * math.sin(a)))
    pts += [(cx + halfw, top + bodyh), (cx, top + bodyh + tiph), (cx - halfw, top + bodyh)]
    return pts


def victorinox(path, w=440, h=240):
    img = Image.new("RGB", (w * S, h * S), VINO)
    d = ImageDraw.Draw(img)
    W, H = w * S, h * S

    # escudo (contorno = escudo cheio menos escudo interno)
    cx = W // 2
    top = int(H * 0.15)
    sw = int(W * 0.150)
    sh = int(H * 0.32)
    tiph = int(H * 0.15)
    r = int(sw * 0.42)
    lw = max(2, int(W * 0.017))

    d.polygon(shield(cx, top, sw, sh, tiph, r), fill="white")
    d.polygon(shield(cx, top + lw, sw - lw, sh - lw, tiph - int(lw * 0.4), r - lw), fill=VINO)

    # cruz
    ccy = top + int(sh * 0.52)
    arm = int(sw * 0.55)
    tk = int(sw * 0.21)
    d.rectangle([cx - arm, ccy - tk // 2, cx + arm, ccy + tk // 2], fill="white")
    d.rectangle([cx - tk // 2, ccy - arm, cx + tk // 2, ccy + arm], fill="white")

    # wordmark
    fs = int(H * 0.135)
    font = ImageFont.truetype(SANS_B, fs)
    tracking = int(fs * 0.22)
    txt = "VICTORINOX"
    tw = text_width(d, txt, font, tracking)
    tracked_text(d, (cx - tw / 2, int(H * 0.72)), txt, font, "white", tracking)

    img.resize((w, h), Image.LANCZOS).save(path)


def camburi(path, w=700, h=300):
    img = Image.new("RGB", (w * S, h * S), "white")
    d = ImageDraw.Draw(img)
    W, H = w * S, h * S
    cx, cy = W // 2, int(H * 0.50)

    # arcos concentricos (onda estilizada)
    specs = [
        (int(W * 0.115), int(W * 0.017), AZUL_CLARO, 205, 20),
        (int(W * 0.088), int(W * 0.016), AZUL, 200, 25),
        (int(W * 0.062), int(W * 0.015), NAVY, 195, 30),
        (int(W * 0.036), int(W * 0.013), NAVY, 190, 40),
    ]
    for rad, wd, col, a0, a1 in specs:
        d.arc([cx - rad, cy - rad, cx + rad, cy + rad], a0, a1 + 360, fill=col, width=wd)

    # nucleo
    nr = int(W * 0.014)
    d.ellipse([cx - nr, cy - nr, cx + nr, cy + nr], fill=NAVY)

    # nomes
    fs = int(H * 0.20)
    font = ImageFont.truetype(SERIF_I, fs)
    d.text((int(W * 0.055), cy), "Pousada", font=font, fill=NAVY, anchor="lm")
    d.text((int(W * 0.945), cy), "Camburí", font=font, fill=NAVY, anchor="rm")

    img.resize((w, h), Image.LANCZOS).save(path)


victorinox(f"{OUT}/victorinox.png")
camburi(f"{OUT}/camburi.png")
print("ok")
