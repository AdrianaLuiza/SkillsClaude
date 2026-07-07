---
name: etl-ocr
description: >
  Extração de texto de imagens e PDFs via OCR (Mistral OCR).
  Suporta PDFs digitais e escaneados, fotos de documentos, capturas de tela, notas fiscais,
  contratos, recibos, boletos, manuscritos e qualquer imagem com texto.
  Use quando o usuário fornecer imagem ou PDF para extrair conteúdo:
  "lê esse documento", "extrai o texto desse PDF", "o que está escrito nessa foto",
  "transcreve essa nota fiscal", "extrai dados desse contrato",
  qualquer arquivo .pdf, .png, .jpg, .jpeg, .webp com texto visível.
  NAO use para áudio ou vídeo — para esses casos use /etl-audio.
---

# etl-ocr

Extrai texto de imagens e PDFs via Mistral OCR. Output markdown estruturado por página.

## Requisito

`MISTRAL_API_KEY` no ambiente. Sem essa variável, o script retorna erro.

Formatos suportados: `PDF`, `PNG`, `JPG`, `JPEG`, `WEBP`.

## Fluxo

### 1. Extrair texto

```bash
python3 ~/.claude/skills/etl-ocr/scripts/extract.py <arquivo> /tmp/etl-ocr-raw.json
```

O script retorna JSON com:
- `total_pages` — número de páginas
- `pages[].markdown` — texto extraído por página
- `full_text` — texto completo concatenado (páginas separadas por `---`)

### 2. Avaliar o resultado

Antes de apresentar, verificar:

- **`full_text` vazio ou menor que 50 chars**: provável problema de qualidade. Avisar o usuário: "O OCR não conseguiu extrair texto suficiente — o documento pode estar muito escuro, rotacionado ou corrompido. Você tem uma versão melhor da imagem?"
- **`total_pages > 1`**: mencionar quantas páginas foram processadas antes de mostrar o conteúdo.
- **Resultado normal**: apresentar o texto extraído e seguir o passo 3.

### 3. Agir com base na intenção do pedido

Não perguntar o que fazer se a intenção já está clara no pedido original. Usar a tabela abaixo para decidir:

| Pedido do usuário | Ação imediata |
|---|---|
| "extrai dados", "quero os campos", "preenche a planilha" | Extrair campos estruturados direto (ir para Passo 4) |
| "o que está escrito", "lê esse documento", "transcreve" | Apresentar o texto completo formatado |
| "resume", "me conta o que tem aqui" | Apresentar resumo do conteúdo |
| "confere se...", "tem algum erro nessa nota?" | Analisar e responder à pergunta específica |
| Pedido ambíguo (só o arquivo, sem instrução clara) | Apresentar texto extraído + perguntar: "Quer que eu extraia campos específicos, faça um resumo ou responda alguma pergunta sobre o documento?" |

### 4. Extrair campos estruturados (quando o pedido pede dados)

Extrair como tabela ou JSON. Mostrar apenas os campos encontrados — não inventar valores ausentes. Se um campo não estiver no documento, indicar como "não encontrado".

**Campos por tipo de documento:**

| Documento | Campos a extrair |
|---|---|
| Nota fiscal (NF-e) | CNPJ emissor, razão social emissor, CNPJ destinatário, número NF, série, data emissão, valor total, base de cálculo ICMS, valor ICMS, valor IPI, valor total produtos |
| Boleto | Emissor/beneficiário, CPF/CNPJ do pagador, vencimento, valor, linha digitável, código de barras |
| Contrato | Partes (nome + qualificação), objeto do contrato, valor/remuneração, prazo de vigência, data de assinatura, foro |
| Extrato bancário | Instituição, período, agência/conta, saldo inicial, saldo final, lista de lançamentos (data + descrição + valor) |
| Recibo | Emissor, beneficiário, valor por extenso, data, descrição do serviço/pagamento |
| Comprovante de pagamento | Tipo (PIX/TED/DOC), valor, data/hora, favorecido, CPF/CNPJ favorecido, banco destino |
| Laudo/relatório técnico | Autor, data, objeto analisado, conclusão principal |

**Formato de saída para campos estruturados:**

```
Tipo: Nota Fiscal Eletrônica

Emissor: Empresa XYZ Ltda — CNPJ 12.345.678/0001-99
Destinatário: Cliente ABC — CNPJ 98.765.432/0001-11
Número NF: 000.123 | Série: 1 | Data: 15/04/2025
Valor total: R$ 4.850,00
ICMS: R$ 485,00 (base R$ 4.850,00)
IPI: não encontrado
```

## Casos edge

### PDF com múltiplas páginas

O script processa todas as páginas automaticamente. O `full_text` já une tudo com `---` entre páginas. Se houver páginas em branco no meio, elas aparecem como seções vazias — ignorar e prosseguir.

### Imagem de baixa qualidade ou texto parcial

Se o OCR retornar texto fragmentado (palavras cortadas, caracteres estranhos como `|` ou `#` onde não faz sentido), avisar: "Algumas partes do documento ficaram ilegíveis — o restante está abaixo. Recomendo uma foto com mais luz ou resolução maior para garantir precisão."

### Documento misto (texto + tabela + assinatura manuscrita)

O Mistral OCR trata tabelas como markdown (pipes `|`) e assinaturas manuscritas como texto aproximado ou string vazia. Ao apresentar: mostrar tabelas como tabela formatada, mencionar se houver campo de assinatura identificado mas ilegível.

### PDF protegido por senha

Se o script retornar erro de PDF criptografado, pedir a senha ao usuário e descriptografar:

```bash
qpdf --password=<senha> --decrypt <arquivo.pdf> /tmp/unlocked.pdf
python3 ~/.claude/skills/etl-ocr/scripts/extract.py /tmp/unlocked.pdf /tmp/etl-ocr-raw.json
```

### Múltiplos documentos em sequência

Rodar o script uma vez por arquivo e acumular os resultados:

```bash
for f in *.pdf; do
  python3 ~/.claude/skills/etl-ocr/scripts/extract.py "$f" "/tmp/ocr-$(basename "$f" .pdf).json"
done
```

Depois de processar todos, consolidar: apresentar um resumo por arquivo ou montar tabela comparativa, conforme o pedido do usuário.

## Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `MISTRAL_API_KEY não definido` | Variável de ambiente ausente | Exportar no terminal: `export MISTRAL_API_KEY=...` |
| `Formato não suportado` | Extensão diferente de PDF/PNG/JPG/WEBP | Converter para PNG antes de enviar |
| `full_text` vazio | PDF corrompido, imagem ilegível, ou documento puramente gráfico | Tirar nova foto com boa iluminação, ou usar versão digital |
| Erro de PDF criptografado | Arquivo protegido por senha | Descriptografar com `qpdf` (ver acima) |
| Texto com muitos caracteres estranhos | Imagem muito pequena, baixa resolução ou compressão excessiva | Solicitar imagem em resolução maior (mínimo 150 DPI) |
