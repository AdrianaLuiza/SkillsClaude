# Projeto Victorinox — Dez/26

O documento original de valores (`Projeto_Victorinox_Dez26.pdf`, Revisão 00, 25/08/2026,
por Rodrigo Sulina) com os logos das duas empresas inseridos no topo:

- **Pousada Camburí** (esquerda) — empresa que apresenta a proposta
- **Victorinox** (direita) — empresa contratante

O conteúdo da planilha **não foi alterado**. Os logos são desenhados como uma camada
sobreposta na faixa branca acima da moldura da tabela — nenhum texto, valor, coluna ou
borda foi tocado.

## Arquivos

| Arquivo | Descrição |
| --- | --- |
| `Projeto_Victorinox_Dez26_com_logos.pdf` | Documento final (entregável) |
| `assets/camburi.png`, `assets/victorinox.png` | Imagens dos logos |
| `inserir_logos.py` | Insere os logos no PDF original |
| `gerar_logos.py` | Gera as imagens dos logos |

## Como regerar

```bash
pip install pypdf reportlab pillow
python3 inserir_logos.py Projeto_Victorinox_Dez26.pdf
```

A posição e o tamanho dos logos são as constantes `MOLDURA_*` e `ALTURA` no topo de
`inserir_logos.py`, medidas na página original (A4 paisagem, 841,8 × 595,2 pt).

## Sobre os logos

As imagens em `assets/` são **reconstruções aproximadas**, feitas porque o ambiente não
tinha acesso aos arquivos originais nem à internet. Para usar os logos oficiais, basta
substituir os dois PNGs em `assets/` (mesmos nomes) e rodar `inserir_logos.py` de novo —
margens brancas ou transparentes são recortadas automaticamente, então os dois ficam com
o mesmo peso visual independentemente do enquadramento do arquivo.
