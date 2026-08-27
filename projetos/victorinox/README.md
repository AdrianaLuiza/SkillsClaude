# Projeto Victorinox — Dez/26

Planilha de valores da proposta de hospedagem, com os logos das duas empresas no cabeçalho:

- **Pousada Camburí** (esquerda) — empresa que apresenta a proposta
- **Victorinox** (direita) — empresa contratante

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `Projeto_Victorinox_Dez26_Valores.xlsx` | Planilha final (entregável) |
| `Projeto_Victorinox_Dez26_Valores.pdf` | Versão em PDF, para envio/impressão |
| `assets/camburi.png`, `assets/victorinox.png` | Imagens usadas no cabeçalho |
| `gerar_logos.py` | Gera as imagens dos logos |
| `gerar_planilha.py` | Monta a planilha a partir das imagens e dos dados |

## Sobre os logos

As imagens em `assets/` são **reconstruções aproximadas**, feitas porque o ambiente
não tinha acesso aos arquivos originais nem à internet. Para usar os logos oficiais,
basta substituir os dois PNGs em `assets/` (mesmos nomes) e rodar:

```bash
pip install openpyxl pillow
python3 gerar_planilha.py
```

As dimensões no cabeçalho são definidas em `gerar_planilha.py`, nas chamadas `place(...)`.

## Origem dos dados

Transcritos de `Projeto_Victorinox_Dez26.pdf` (Revisão 00, 25/08/2026, por Rodrigo Sulina):
18 apartamentos, capacidade total de 54 pessoas (45 pax + 9 auxiliares), valores de pacote,
refeição, diária adicional de semana e o bloco de valores negociados.
