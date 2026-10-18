#!/usr/bin/env python3
"""Lê uma exportação de grupo do WhatsApp (.zip, .txt ou .md), filtra por
período e imprime as mensagens num formato compacto e uniforme para resumo.

Uso:
    python parse_chat.py <arquivo> --periodo tudo|semana|24h

O período é contado a partir da ÚLTIMA mensagem do arquivo (não de "agora"),
porque a exportação pode ter sido feita dias antes do resumo.

Formatos aceitos:
  .zip:     lê o _chat.txt de dentro, sem extrair as mídias
  iPhone:   [16/09/2026, 10:08:53] Nome: texto      (ou [9/16/26, 10:08:53 AM])
  Android:  16/09/2026 10:08 - Nome: texto          (ou "16/09/2026 às 10:08 - ")
  Markdown: "## 16 de setembro de 2026" + "[10:08] **Nome:** texto"
"""
import argparse
import os
import re
import sys
import zipfile
from datetime import datetime, timedelta

MESES = {m: i + 1 for i, m in enumerate(
    "janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro".split())}

_DATA = r"(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:,|\s+às)?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?"
RE_IOS = re.compile(r"^‎?\[" + _DATA + r"\]\s*(.*)$")
RE_ANDROID = re.compile(r"^‎?" + _DATA + r"\s+-\s+(.*)$")
RE_MD_DAY = re.compile(r"^##\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\s*$", re.I)
RE_MD_MSG = re.compile(r"^\[(\d{1,2}):(\d{2})\]\s+(.*)$")
RE_MD_TITULO = re.compile(r"^#\s+.*?WhatsApp:\s*(.+)$", re.I)

DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]

RUIDO = ("criptografia de ponta a ponta", "end-to-end encrypted")
APAGADA = re.compile(r"^‎?(Mensagem apagada|Esta mensagem foi apagada|Você apagou esta mensagem|This message was deleted|You deleted this message)\.?$", re.I)
EDITADA = re.compile(r"\s*‎?<(Esta )?mensagem (foi )?editada>|\s*‎?<This message was edited>", re.I)
MIDIA = re.compile(r"<[^>]*(oculta|omitid|omitted|anexad|attached)[^>]*>|^\[(Imagem|Áudio|Vídeo|Figurinha|Documento|GIF)\]|\b(imagem|áudio|audio|vídeo|video|figurinha|sticker|GIF) (ocultad[oa]|omitid[oa]|omitted)", re.I)
ENQUETE = re.compile(r"^‎?(enquete|poll):\s*", re.I)


def ano(a):
    a = int(a)
    return a + 2000 if a < 100 else a


def hora24(h, ampm):
    h = int(h)
    if ampm:
        pm = ampm.lower().startswith("p")
        if pm and h < 12:
            h += 12
        if not pm and h == 12:
            h = 0
    return h


def ler(caminho):
    """Devolve (linhas, nome_do_grupo_pelo_arquivo)."""
    base = os.path.splitext(os.path.basename(caminho))[0]
    if caminho.lower().endswith(".zip"):
        with zipfile.ZipFile(caminho) as z:
            txts = [n for n in z.namelist() if n.lower().endswith(".txt")]
            if not txts:
                sys.exit("O .zip não tem nenhum .txt de conversa dentro.")
            nome = next((n for n in txts if os.path.basename(n).lower() == "_chat.txt"), txts[0])
            texto = z.read(nome).decode("utf-8-sig", errors="replace")
    else:
        with open(caminho, encoding="utf-8-sig", errors="replace") as f:
            texto = f.read()
    m = re.search(r"(?:Conversa do WhatsApp com|WhatsApp Chat (?:with|-))\s*(.+)", base, re.I)
    return texto.splitlines(), (m.group(1).strip() if m else None)


def detectar_ordem(linhas):
    """Decide se as datas são dia/mês (BR) ou mês/dia (EUA)."""
    primeiros, segundos, tem_ampm = [], [], False
    for l in linhas:
        m = RE_IOS.match(l) or RE_ANDROID.match(l)
        if m:
            primeiros.append(int(m.group(1)))
            segundos.append(int(m.group(2)))
            tem_ampm |= bool(m.group(7))
    if any(x > 12 for x in primeiros):
        return "DM"
    if any(x > 12 for x in segundos):
        return "MD"
    return "MD" if tem_ampm else "DM"


def separar_autor(resto):
    """'Nome: texto' -> (Nome, texto). Mensagem de sistema -> (None, texto)."""
    resto = resto.lstrip("- ").strip()
    m = re.match(r"^\*\*(.+?):\*\*\s?(.*)$", resto, re.S)  # markdown
    if m:
        return m.group(1).strip(), m.group(2)
    m = re.match(r"^__(.*)__$", resto, re.S)  # sistema no markdown
    if m:
        return None, m.group(1)
    m = re.match(r"^([^:]{1,80}?):\s(.*)$", resto, re.S)
    if m:
        return m.group(1).strip(), m.group(2)
    return None, resto


def parse(linhas):
    msgs = []  # [datetime, autor, texto]
    grupo = None
    is_md = any(RE_MD_DAY.match(l) for l in linhas[:50])

    if is_md:
        dia = None
        for l in linhas:
            t = RE_MD_TITULO.match(l)
            if t and not msgs:
                grupo = t.group(1).strip()
                continue
            d = RE_MD_DAY.match(l)
            if d:
                mes = MESES.get(d.group(2).lower())
                dia = datetime(int(d.group(3)), mes, int(d.group(1))) if mes else dia
                continue
            m = RE_MD_MSG.match(l)
            if m and dia:
                dt = dia.replace(hour=int(m.group(1)), minute=int(m.group(2)))
                autor, texto = separar_autor(m.group(3))
                msgs.append([dt, autor, texto])
            elif msgs and l.strip() not in ("", "---"):
                msgs[-1][2] += "\n" + l
    else:
        ordem = detectar_ordem(linhas)
        for l in linhas:
            m = RE_IOS.match(l) or RE_ANDROID.match(l)
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                d, mo = (a, b) if ordem == "DM" else (b, a)
                try:
                    dt = datetime(ano(m.group(3)), mo, d, hora24(m.group(4), m.group(7)), int(m.group(5)))
                except ValueError:
                    continue
                autor, texto = separar_autor(m.group(8))
                msgs.append([dt, autor, texto])
            elif msgs:
                msgs[-1][2] += "\n" + l

    limpas = []
    for dt, autor, texto in msgs:
        texto = EDITADA.sub("", texto).strip()
        # Exportações em markdown envolvem a 1ª linha em **...** ou _..._
        texto = re.sub(r"^(\*\*|_)(.+?)\1(?=\n|$)", r"\2", texto)
        if any(r in texto for r in RUIDO) or APAGADA.match(texto):
            continue
        limpas.append([dt, autor, texto])
    return limpas, grupo


def formatar(texto):
    if MIDIA.fullmatch(texto.replace("[Encaminhada]", "").strip() or "x"):
        return "[mídia]"
    if ENQUETE.match(texto):
        # Algumas exportações trazem a contagem de votos; a maioria só traz pergunta e opções.
        corpo = ENQUETE.sub("", texto)
        corpo = re.sub(r"\n\s*(-|OPÇÃO:|OPTION:)\s*", " | ", corpo).strip()
        if re.search(r"\(\d+ vot|\(\d+ vote", corpo, re.I):
            return f"[ENQUETE com votos] {corpo}"
        return f"[ENQUETE — resultado não vem na exportação] {corpo}"
    return texto


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arquivo")
    ap.add_argument("--periodo", choices=["tudo", "semana", "24h"], default="tudo")
    args = ap.parse_args()

    linhas, grupo_arquivo = ler(args.arquivo)
    msgs, grupo_md = parse(linhas)
    if not msgs:
        sys.exit("Nenhuma mensagem reconhecida. O arquivo é mesmo uma exportação do WhatsApp?")

    fim = msgs[-1][0]
    corte = {"tudo": None, "semana": fim - timedelta(days=7), "24h": fim - timedelta(hours=24)}[args.periodo]
    sel = [x for x in msgs if corte is None or x[0] >= corte]

    autores, midias, enquetes = {}, 0, 0
    for dt, autor, texto in sel:
        if autor:
            autores[autor] = autores.get(autor, 0) + 1
        if MIDIA.search(texto):
            midias += 1
        if ENQUETE.match(texto):
            enquetes += 1

    sys.stdout.reconfigure(encoding="utf-8")
    print(f"# GRUPO: {grupo_md or grupo_arquivo or '(nome não está no arquivo)'}")
    print(f"# PERÍODO: {args.periodo} | {sel[0][0]:%d/%m/%Y %H:%M} → {sel[-1][0]:%d/%m/%Y %H:%M}")
    print(f"# MENSAGENS: {len(sel)} (de {len(msgs)} no arquivo) | mídias ocultadas: {midias} | enquetes: {enquetes}")
    print("# PARTICIPANTES (msgs): " + ", ".join(f"{a} ({n})" for a, n in sorted(autores.items(), key=lambda kv: -kv[1])))
    print("# 'Você' = a pessoa que exportou o chat (a usuária). Mensagens apagadas foram removidas.")
    print()
    dia_atual = None
    for dt, autor, texto in sel:
        if dt.date() != dia_atual:
            dia_atual = dt.date()
            print(f"\n== {dt:%d/%m/%Y} ({DIAS[dt.weekday()]}) ==")
        print(f"{dt:%H:%M} {autor or '[sistema]'}: {formatar(texto)}")


if __name__ == "__main__":
    main()
