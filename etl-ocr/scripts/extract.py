#!/usr/bin/env python3
"""
extract.py — OCR de documentos financeiros via Mistral OCR
Uso: python3 scripts/extract.py <input_file> <output_json>
Suporta: PDF, PNG, JPG, JPEG, WEBP
Requer: MISTRAL_API_KEY
"""

import sys
import os
import json
import base64

def get_mime_type(filepath):
    ext = filepath.lower().rsplit('.', 1)[-1]
    mime_map = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
    }
    return mime_map.get(ext)

def build_document(filepath, mime_type):
    with open(filepath, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{encoded}"

    if mime_type == 'application/pdf':
        return {"type": "document_url", "document_url": data_uri}
    else:
        return {"type": "image_url", "image_url": data_uri}

def extract_pages_text(pages):
    """Concatena o markdown de todas as páginas."""
    parts = []
    for page in pages:
        md = page.get('markdown', '').strip()
        if md:
            parts.append(md)
    return '\n\n---\n\n'.join(parts)

def main():
    if len(sys.argv) < 3:
        print("Uso: python3 extract.py <arquivo> <output.json>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    if not os.path.isfile(input_file):
        print(f"ERROR: Arquivo não encontrado: {input_file}", file=sys.stderr)
        sys.exit(1)

    api_key = os.environ.get('MISTRAL_API_KEY')
    if not api_key:
        print("ERROR: MISTRAL_API_KEY não definido.", file=sys.stderr)
        sys.exit(1)

    mime_type = get_mime_type(input_file)
    if not mime_type:
        print(f"ERROR: Formato não suportado. Use PDF, PNG, JPG ou WEBP.", file=sys.stderr)
        sys.exit(1)

    print(f"Processando: {os.path.basename(input_file)} ({mime_type})")

    from mistralai import Mistral
    client = Mistral(api_key=api_key)

    document = build_document(input_file, mime_type)

    print("Chamando Mistral OCR...")
    response = client.ocr.process(
        model="mistral-ocr-latest",
        document=document,
    )

    # Serializa a resposta (objeto SDK → dict)
    if hasattr(response, 'model_dump'):
        raw = response.model_dump()
    elif hasattr(response, '__dict__'):
        raw = response.__dict__
    else:
        raw = dict(response)

    pages = raw.get('pages', [])
    full_text = extract_pages_text(pages)

    output = {
        "source_file": os.path.basename(input_file),
        "model": raw.get('model', 'mistral-ocr-latest'),
        "total_pages": len(pages),
        "pages": [
            {
                "index": p.get('index', i),
                "markdown": p.get('markdown', ''),
                "dimensions": p.get('dimensions'),
            }
            for i, p in enumerate(pages)
        ],
        "full_text": full_text,
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"OK: {len(pages)} página(s) extraída(s) → {output_file}")
    print(f"Chars extraídos: {len(full_text)}")

if __name__ == '__main__':
    main()
