"""Insere os logos no PDF original do Projeto Victorinox.

O conteudo original nao e alterado: os logos sao desenhados como uma camada
sobreposta na faixa branca acima da moldura da tabela.

Uso:
    pip install pypdf reportlab
    python3 inserir_logos.py <pdf_original> [pdf_saida]
"""
import io
import pathlib
import sys

from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

AQUI = pathlib.Path(__file__).parent
LOGO_ESQ = AQUI / "assets" / "camburi.png"      # proponente
LOGO_DIR = AQUI / "assets" / "victorinox.png"   # contratante

# Geometria medida na pagina original (A4 paisagem, 841,8 x 595,2 pt):
# a moldura da tabela comeca em y = 552,7 pt; acima dela ha uma faixa livre.
MOLDURA_ESQ = 45.3     # borda esquerda da moldura
MOLDURA_DIR = 794.3    # borda direita da moldura
MOLDURA_TOPO = 552.7   # topo da moldura
ALTURA = 34.0          # altura dos logos na faixa


def carregar(caminho):
    """Le o logo removendo margens brancas/transparentes, para os dois ficarem
    com o mesmo peso visual. Bordas coloridas (como o bloco vinho da Victorinox)
    sao preservadas."""
    img = Image.open(caminho)
    img = img.convert("RGBA")
    fundo = Image.new("RGBA", img.size, (255, 255, 255, 0))
    alpha = img.split()[3]
    if alpha.getextrema()[0] == 255:                     # sem transparencia: corta branco
        rgb = img.convert("RGB")
        fundo = Image.new("RGB", img.size, rgb.getpixel((0, 0)))
        if rgb.getpixel((0, 0)) == (255, 255, 255):
            caixa = ImageChops.difference(rgb, fundo).getbbox()
            if caixa:
                img = img.crop(caixa)
    else:                                                # com transparencia: corta o vazio
        caixa = alpha.getbbox()
        if caixa:
            img = img.crop(caixa)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def inserir(origem, destino):
    leitor = PdfReader(origem)
    pagina = leitor.pages[0]
    larg = float(pagina.mediabox.width)
    alt = float(pagina.mediabox.height)

    folga = (alt - MOLDURA_TOPO - ALTURA) / 2
    base = MOLDURA_TOPO + folga

    buf = AQUI / "_overlay.pdf"
    c = canvas.Canvas(str(buf), pagesize=(larg, alt))

    esq = carregar(LOGO_ESQ)
    we, he = esq.getSize()
    c.drawImage(esq, MOLDURA_ESQ, base, width=ALTURA * we / he, height=ALTURA,
                mask="auto", preserveAspectRatio=True, anchor="sw")

    dire = carregar(LOGO_DIR)
    wd, hd = dire.getSize()
    larg_dir = ALTURA * wd / hd
    c.drawImage(dire, MOLDURA_DIR - larg_dir, base, width=larg_dir, height=ALTURA,
                mask="auto", preserveAspectRatio=True, anchor="sw")

    c.save()

    sobreposicao = PdfReader(str(buf)).pages[0]
    pagina.merge_page(sobreposicao)

    escritor = PdfWriter()
    escritor.add_page(pagina)
    for p in leitor.pages[1:]:
        escritor.add_page(p)
    if leitor.metadata:
        escritor.add_metadata(leitor.metadata)
    with open(destino, "wb") as f:
        escritor.write(f)
    buf.unlink(missing_ok=True)
    print("salvo:", destino)


if __name__ == "__main__":
    origem = sys.argv[1]
    destino = sys.argv[2] if len(sys.argv) > 2 else str(AQUI / "Projeto_Victorinox_Dez26_com_logos.pdf")
    inserir(origem, destino)
