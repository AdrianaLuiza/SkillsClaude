---
name: resumo-whatsapp
description: Resume um grupo de WhatsApp exportado (.zip, _chat.txt ou .md) em três blocos — Decisões tomadas, Pendências e Temas em debate — sempre perguntando antes o período (todo o período, última semana ou últimas 24h). Use SEMPRE que a usuária mandar um arquivo de conversa do WhatsApp ou pedir "resume esse grupo", "o que rolou no grupo", "me atualiza do grupo do condomínio/conselho/família/trabalho", "perdi a conversa, o que decidiram?", "quais pendências ficaram no grupo", mesmo que não diga "resumo". NÃO use para conversa de Slack/Telegram/e-mail nem para transcrever áudio do WhatsApp (isso é /etl-audio).
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

Rode o script direto no arquivo que a usuária mandou — `.zip`, `.txt` ou `.md` (o `.zip` é lido sem extrair as mídias):

```bash
python -I <pasta-da-skill>/scripts/parse_chat.py "<arquivo>" --periodo tudo|semana|24h
```

O script entende os formatos do iPhone (`[16/09/2026, 10:08:53] Nome: ...`, inclusive datas americanas com AM/PM), do Android (`16/09/2026 10:08 - Nome: ...`) e o markdown exportado por extensões (`## 16 de setembro de 2026` + `[10:08] **Nome:** ...`). Ele junta mensagens de várias linhas, troca mídias por `[mídia]`, remove mensagens apagadas e o aviso de criptografia, marca enquetes com `[ENQUETE ...]` e imprime um cabeçalho com nome do grupo (quando dá para saber), intervalo de datas, total de mensagens e participantes.

Leia a saída inteira — o resumo só é confiável se você viu o período todo. Se ela for longa demais para ler de uma vez (milhares de mensagens), redirecione para um arquivo temporário e leia em blocos, anotando decisões e pendências a cada bloco antes de seguir.

Se o script disser que não reconheceu nenhuma mensagem (ou se não houver Python), abra as primeiras linhas do arquivo para ver o formato e leia direto, aplicando o filtro de período à mão.

## Passo 3 — Entender antes de classificar

- **"Você" é a usuária** (quem exportou). Ela é chamada pelo nome nas mensagens dos outros também — confira o nome dela no perfil ou pelo contexto (ex.: "Adriana, desconheço…" respondendo a "Você").
- Use os nomes curtos das pessoas: "Marcos - Camburi Bay Casa 5" vira "Marcos (Casa 5)" na primeira menção e "Marcos" depois.
- Acompanhe cada assunto até o fim do período antes de classificar. Algo perguntado na terça e respondido na quinta é decisão, não pendência; uma tarefa assumida e depois dada como feita ("liguei, confirmado") não é mais pendência. Uma decisão revertida aparece só na versão final, com a anterior entre parênteses — "R$ 690 por pessoa (tinha ficado R$ 640 em 10/10; fornecedor subiu o preço)" — porque a usuária pode ter visto a primeira versão e agido com base nela.
- **Enquetes não são decisões por si só.** A maioria das exportações traz só a pergunta e as opções, sem os votos (`[ENQUETE — resultado não vem na exportação]`). Só trate como decidido se houver contagem de votos com vencedor claro ou se alguém confirmar o resultado em texto. Sem isso, agrupe as enquetes num único item em **Temas em debate** ("Enquete de 07/10 com 12 itens — terceirizado, reajuste, uniformes… — resultado não aparece na exportação; conferir no app"), em vez de listar cada uma.
- Quando o grupo marca uma reunião ou ligação, o que se decidiu nela normalmente não está no chat. Não presuma o resultado: registre que o assunto foi levado à reunião de tal dia e que o resultado não foi registrado no grupo.
- Se ficar em dúvida entre decisão e debate, ponha em debate e diga para onde está pendendo ("tendência: Cia dos Bordados, falta ver amostra"). Uma falsa decisão no resumo é pior do que um debate a mais, porque a usuária pode agir em cima dela.
- Uma mídia sem texto não diz nada — não invente o conteúdo. Se a conversa ao redor explica ("segue a planilha"), use isso.
- Mensagens de cortesia (bom dia, 🙏, "ok", "obrigado") não entram em nenhum bloco.

## Passo 4 — Escrever o resumo

Use exatamente esta estrutura:

```markdown
# Resumo — <nome do grupo (linha GRUPO do script); se não houver, deduza pelo assunto>
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
