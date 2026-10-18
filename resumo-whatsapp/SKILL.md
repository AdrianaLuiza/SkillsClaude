---
name: resumo-whatsapp
description: Resume um grupo de WhatsApp exportado (.txt ou .md, inclusive o _chat.txt de dentro do .zip) em três blocos — Decisões tomadas, Pendências e Temas em debate — sempre perguntando antes o período (todo o período, última semana ou últimas 24h). Use SEMPRE que a usuária mandar um arquivo de conversa do WhatsApp ou pedir "resume esse grupo", "o que rolou no grupo", "me atualiza do grupo do condomínio/conselho/família/trabalho", "perdi a conversa, o que decidiram?", "quais pendências ficaram no grupo", mesmo que não diga "resumo". NÃO use para conversa de Slack/Telegram/e-mail nem para transcrever áudio do WhatsApp (isso é /etl-audio).
---

# Resumo de grupo do WhatsApp

A usuária participa de grupos com muito volume (conselho de condomínio, clientes, família) e não tem tempo de ler tudo. O que ela quer do resumo é saber **o que já está resolvido, o que ainda está em aberto e o que está sendo discutido** — não uma narrativa de quem falou o quê.

## Passo 1 — Perguntar o período

Antes de ler o arquivo, pergunte o período com AskUserQuestion (uma pergunta, três opções, nesta ordem):

1. **Todo o período**
2. **Última semana**
3. **Últimas 24h**

Só pule a pergunta se a usuária já disse o período no pedido ("resume as últimas 24h do grupo").

O período é contado a partir da **última mensagem do arquivo**, não de hoje — a exportação pode ter sido feita dias antes. Deixe isso claro no cabeçalho do resumo.

## Passo 2 — Normalizar e filtrar com o script

Se vier um `.zip`, extraia só o `_chat.txt` para uma pasta temporária nova (ignore as mídias). Depois rode:

```bash
python -I <pasta-da-skill>/scripts/parse_chat.py "<arquivo>" --periodo tudo|semana|24h
```

O script entende os formatos do iPhone (`[16/09/2026, 10:08:53] Nome: ...`, inclusive datas americanas com AM/PM), do Android (`16/09/2026 10:08 - Nome: ...`) e o markdown exportado por extensões (`## 16 de setembro de 2026` + `[10:08] **Nome:** ...`). Ele junta mensagens de várias linhas, troca mídias por `[mídia]`, remove o aviso de criptografia e imprime um cabeçalho com intervalo de datas, total de mensagens e participantes.

Leia a saída inteira. Se ela for muito longa para ler de uma vez (dezenas de milhares de linhas), leia em blocos por dia e vá anotando antes de escrever.

Se o script disser que não reconheceu nenhuma mensagem, abra as primeiras linhas do arquivo para ver o formato e leia direto.

## Passo 3 — Entender antes de classificar

- **"Você" é a usuária** (quem exportou). Ela é chamada pelo nome nas mensagens dos outros também — confira o nome dela no perfil ou pelo contexto (ex.: "Adriana, desconheço…" respondendo a "Você").
- Use os nomes curtos das pessoas: "Marcos - Camburi Bay Casa 5" vira "Marcos (Casa 5)" na primeira menção e "Marcos" depois.
- Acompanhe o assunto até o fim do período: algo perguntado na terça e respondido na quinta é decisão, não pendência. Algo decidido e depois revertido entra só na versão final (mencione a mudança se for relevante).
- Uma mídia sem texto não diz nada — não invente o conteúdo. Se a conversa ao redor explica ("segue a planilha"), use isso.
- Mensagens de cortesia (bom dia, 🙏, "ok", "obrigado") não entram em nenhum bloco.

## Passo 4 — Escrever o resumo

Use exatamente esta estrutura:

```markdown
# Resumo — <nome do grupo, se souber>
<período escolhido> · <data inicial> a <data final> · <N> mensagens

**Decisões tomadas**
- <o que foi decidido> — <quem decidiu/confirmou, quando> (<data>)

**Pendências**
- **Suas:** <o que você ficou de fazer> — <prazo, se houver>
- <responsável>: <o que ficou de fazer> — <prazo, se houver>
- Sem dono: <pergunta ou tarefa que ninguém assumiu>

**Temas em debate**
- **<tema>:** <posições em jogo e quem defende o quê, em 1–2 linhas>; <o que falta para fechar>
```

Critérios de cada bloco:

- **Decisões tomadas** — algo que o grupo fechou: aprovação, data marcada, valor aceito, fornecedor escolhido, reunião confirmada. Precisa ter havido concordância explícita (ou ausência de objeção depois de uma proposta firme de quem tem autoridade). Inclua o dado concreto: data, horário, valor, nome.
- **Pendências** — tarefas que alguém assumiu ("vou falar com o Wellington amanhã") ou que ficaram pedidas sem resposta ("quais casas estão em reforma?"). As da usuária vêm primeiro, porque são as que ela precisa agir. Pergunta feita para ela e não respondida também é pendência dela.
- **Temas em debate** — assuntos com discussão em andamento, sem conclusão. Mostre as posições, não só o tema. Se um tema já virou decisão, ele sai daqui.

Um item aparece em um bloco só. Se um bloco ficar vazio, escreva "Nada no período." em vez de omitir. Ordene cada bloco por importância para a usuária, não por ordem cronológica.

Seja direta: frases curtas, sem introdução nem conclusão genérica, sem emojis. Em "últimas 24h" o resumo costuma caber em poucas linhas; em "todo o período" de um grupo grande, agrupe itens parecidos para não passar de uma tela e meia.

## Cuidados

- **Dados pessoais.** Grupos costumam ter CPF, telefone, endereço, dados bancários. Não repita esses números no resumo — escreva "enviou CPF" no máximo.
- **Links úteis** (reunião, formulário, documento) podem aparecer junto do item a que se referem, mas não liste todos os links do grupo.
- Não salve o resumo em arquivo a menos que a usuária peça; a resposta no chat é o entregável.
