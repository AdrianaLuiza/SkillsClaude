# Campos Financeiros — Referência de Extração

Guia para Claude interpretar o output do OCR e estruturar os dados financeiros em JSON.

## Tipos de Documento

### Nota Fiscal (NF-e / NFS-e)
```json
{
  "tipo": "nota_fiscal",
  "numero": "000123",
  "serie": "001",
  "data_emissao": "2025-01-15",
  "emitente": {
    "nome": "Empresa LTDA",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua X, 100 - SP"
  },
  "destinatario": {
    "nome": "Cliente S/A",
    "cnpj_cpf": "98.765.432/0001-10"
  },
  "itens": [
    {"descricao": "Serviço de consultoria", "quantidade": 1, "valor_unitario": 5000.00, "valor_total": 5000.00}
  ],
  "totais": {
    "subtotal": 5000.00,
    "desconto": 0,
    "impostos": {"ISS": 100.00, "PIS": 32.50, "COFINS": 150.00},
    "total": 5000.00
  },
  "chave_acesso": "35250112345678000190550010000001231000012310"
}
```

### Fatura / Boleto
```json
{
  "tipo": "fatura_boleto",
  "numero_boleto": "34191.09008 00000.000000 00000.000000 1 00000000000000",
  "beneficiario": "Empresa Credora LTDA",
  "pagador": "Nome do Pagador",
  "valor": 1250.00,
  "vencimento": "2025-02-10",
  "data_documento": "2025-01-15",
  "descricao": "Mensalidade fevereiro/2025",
  "banco": "Itaú",
  "agencia_conta": "0001/12345-6"
}
```

### Extrato Bancário
```json
{
  "tipo": "extrato_bancario",
  "banco": "Itaú",
  "agencia": "0001",
  "conta": "12345-6",
  "periodo": {"inicio": "2025-01-01", "fim": "2025-01-31"},
  "saldo_inicial": 10000.00,
  "saldo_final": 8750.50,
  "transacoes": [
    {"data": "2025-01-03", "descricao": "PIX RECEBIDO - Cliente X", "tipo": "credito", "valor": 2000.00},
    {"data": "2025-01-05", "descricao": "Pagamento Boleto", "tipo": "debito", "valor": 1500.00}
  ]
}
```

### Recibo / Comprovante
```json
{
  "tipo": "recibo",
  "numero": "REC-2025-001",
  "data": "2025-01-15",
  "pagador": "João Silva",
  "recebedor": "Maria Santos",
  "valor": 500.00,
  "descricao": "Pagamento de aluguel referente a janeiro/2025",
  "forma_pagamento": "PIX"
}
```

## Regras de Extração

1. **Datas**: sempre normalizar para `YYYY-MM-DD`
2. **Valores**: sempre como número float, sem símbolo `R$` e sem separadores de milhar
3. **CNPJ/CPF**: manter a formatação original com pontos e traços
4. **Campos ausentes**: usar `null`, nunca omitir a chave
5. **Tabelas de itens**: extrair TODAS as linhas, não apenas a primeira
6. **Impostos**: listar cada imposto separadamente quando discriminado

## Output Final

```json
{
  "metadata": {
    "arquivo": "fatura-jan-2025.pdf",
    "paginas": 2,
    "processado_em": "2025-02-21",
    "tipo_detectado": "nota_fiscal"
  },
  "dados": { ... }
}
```
