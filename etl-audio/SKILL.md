---
name: etl-audio
description: >
  Transcrição de áudio ou vídeo com separação de speakers (diarization) via Mistral Voxtral.
  Output JSON estruturado pronto para análise posterior.
  Use quando o usuário fornecer qualquer arquivo de áudio ou vídeo para transcrever:
  reuniões, calls com clientes, aulas, voice notes do WhatsApp, podcasts, gravações de Zoom.
  Triggers: "transcreve esse áudio", "transcreve essa call", "transcrição da reunião",
  "transcreve o vídeo", "o que ele falou nesse áudio", qualquer arquivo de áudio/vídeo
  (.m4a, .mp3, .mp4, .wav, .ogg, .opus, .webm, .mov).
  NAO use para texto ou imagens — só para arquivos de áudio ou vídeo.
---

# etl-audio

Transcreve áudio ou vídeo com separação de speakers via Mistral Voxtral.
Output: JSON com nomes reais pronto para análise por LLM.

## Parâmetros

- **Idioma**: Português do Brasil (`pt`) por padrão.
  - Se o usuário não especificar, use `pt`.
  - Se houver indicação de que o áudio é em outro idioma (nome do arquivo, contexto da conversa), perguntar antes de transcrever: "O áudio está em inglês ou outro idioma?"
- **Modelo**: `voxtral-mini-latest`
- **Requisito**: `MISTRAL_API_KEY` no ambiente

---

## Fluxo

### 1. Verificar MISTRAL_API_KEY

Antes de qualquer coisa, rodar:

```bash
echo ${MISTRAL_API_KEY:0:4}
```

- Se retornar 4 caracteres: chave configurada, prosseguir.
- Se retornar vazio: parar e mostrar ao usuário:

```
Para usar /etl-audio você precisa de uma chave da API Mistral (gratuita).

Configure em 3 passos:

1. Acesse console.mistral.ai e crie uma conta gratuita
2. Vá em "API Keys" e gere uma nova chave
3. No terminal, rode:
   export MISTRAL_API_KEY="sua-chave-aqui"

Para não precisar fazer isso toda vez, adicione essa linha no ~/.zshrc (Mac)
ou ~/.bashrc (Linux) e reabra o terminal.

Depois de configurar, repita o comando que você estava tentando.
```

### 2. Verificar o arquivo

Antes de transcrever, confirmar:
- O arquivo existe no caminho fornecido
- A extensão é suportada: `.m4a`, `.mp3`, `.mp4`, `.wav`, `.ogg`, `.opus`, `.webm`, `.mov`
- Extensões maiúsculas (`.MP4`, `.M4A`) são válidas — o script trata normalmente

Se o arquivo não existir ou a extensão não for reconhecida, reportar ao usuário antes de prosseguir.

### 2. Transcrever

```bash
bash ~/.claude/skills/etl-audio/scripts/transcribe.sh <audio_file> /tmp/etl-raw.json
```

O script:
- Extrai áudio de vídeo automaticamente (mp4, mov, webm)
- Ativa diarization (separação de speakers)
- Salva JSON bruto em `/tmp/etl-raw.json`

**Se o arquivo for maior que ~25MB**, comprimir antes (Voxtral pode rejeitar arquivos grandes):

```bash
ffmpeg -i AUDIO_ORIGINAL -ac 1 -ar 16000 -c:a libmp3lame -b:a 24k /tmp/audio-comp.mp3 -y
bash ~/.claude/skills/etl-audio/scripts/transcribe.sh /tmp/audio-comp.mp3 /tmp/etl-raw.json
```

**Se o script retornar erro** (exit code não-zero):
- Mostrar a mensagem de erro ao usuário
- Se for "arquivo muito grande": oferecer comprimir com ffmpeg
- Se for "API key não definida": orientar a configurar `MISTRAL_API_KEY`
- Se for erro de API desconhecido: mostrar o JSON de erro bruto e parar

### 3. Identificar Speakers

Ler os primeiros 20 segmentos do `/tmp/etl-raw.json` e observar os padrões de cada speaker:
- Quem conduz, pergunta e estrutura → **facilitador/host**
- Quem responde, apresenta situação, participa → **participante**
- Vozes com fala muito curta e esporádica → podem ser o mesmo speaker com variação de volume

**Regras por número de speakers detectados:**

**1 speaker**
Pode ser voz nota (WhatsApp), monólogo ou falha de diarization. Informar ao usuário:
```
Detectei apenas 1 speaker na gravação. Pode ser:
- Um voice note ou monólogo
- Áudio curto/mono onde a diarization não conseguiu separar vozes

Qual é o nome de quem está falando? (ou deixe em branco para usar "Speaker")
```

**2 speakers** (caso mais comum)
```
Identifiquei 2 speakers na gravação:

- Speaker 0 — [padrão observado: ex. "conduz a conversa, faz perguntas"]
- Speaker 1 — [padrão observado: ex. "responde, apresenta sua situação"]

Quais são os nomes? (pode deixar em branco quem não quiser nomear)
```

**3 ou mais speakers**
Mostrar os primeiros 2-3 turnos de cada speaker para o usuário identificar a voz:
```
Identifiquei [N] speakers na gravação:

- Speaker 0 — "[primeira fala do speaker 0, até 80 caracteres...]"
- Speaker 1 — "[primeira fala do speaker 1, até 80 caracteres...]"
- Speaker 2 — "[primeira fala do speaker 2, até 80 caracteres...]"
[...]

Quais são os nomes de cada um? (pode deixar em branco quem não quiser nomear)
Dica: se dois speakers forem a mesma pessoa (erro de diarization), me informe quais unificar.
```

Aguardar a resposta do usuário antes de continuar.

### 4. Gerar JSON Final

Após o usuário confirmar os nomes, construir o JSON final **substituindo** os speaker numbers pelos nomes reais. Speakers sem nome recebem "Speaker N" como fallback.

Salvar em arquivo. **Nome do arquivo:** usar `transcript-YYYY-MM-DD.json` no diretório do arquivo original como padrão, ou o caminho que o usuário especificar.

Estrutura obrigatória:

```json
{
  "metadata": {
    "file": "reuniao-cliente.mp3",
    "model": "voxtral-mini-2602",
    "language": "pt",
    "transcribed_at": "2025-05-05",
    "speakers": {
      "speaker_0": "Ana (facilitadora)",
      "speaker_1": "Carlos (cliente)"
    },
    "total_segments": 142,
    "duration_seconds": 3720
  },
  "segments": [
    {
      "speaker": "Ana",
      "text": "Bom dia Carlos, vamos começar com o status do projeto...",
      "start": 0.0,
      "end": 4.2
    },
    {
      "speaker": "Carlos",
      "text": "Bom dia! Então, essa semana finalizamos...",
      "start": 4.5,
      "end": 12.1
    }
  ]
}
```

Para calcular `duration_seconds`: pegar o campo `end` do último segmento em `/tmp/etl-raw.json`.

### 5. Apresentar Resumo e Sugestões

Após salvar, exibir:

```
Transcrição salva em: /caminho/transcript-2025-05-05.json

Duração total: [X min Y seg]
Segmentos por speaker:
  Ana: 73 segmentos
  Carlos: 69 segmentos

Arquivo: 142 segmentos no total
```

Em seguida, oferecer ações concretas baseadas no tipo de áudio inferido:

**Se for reunião ou call com cliente:**
```
O que quer fazer agora?
1. Extrair tarefas e próximos passos
2. Resumir os pontos principais discutidos
3. Identificar dores e pedidos do cliente
4. Gerar ata formal da reunião
```

**Se for voice note ou mensagem curta:**
```
O que quer fazer agora?
1. Resumir o conteúdo em texto
2. Redigir uma resposta
3. Extrair itens de ação mencionados
```

**Se for aula ou treinamento:**
```
O que quer fazer agora?
1. Gerar resumo dos pontos principais
2. Criar sumário por tópico com timestamps
3. Extrair conceitos-chave e definições
4. Gerar quiz de revisão
```

Se o usuário não der contexto sobre o tipo de áudio, usar a sugestão genérica:
```
Quer que eu analise o conteúdo, extraia tarefas ou gere um resumo?
```

---

## Casos de Uso Comuns

| Tipo de áudio | Ação recomendada pós-transcrição |
|---|---|
| Reunião de equipe | Extrair decisões e próximos passos |
| Call com cliente | Identificar dores, pedidos e compromissos assumidos |
| Aula ou treinamento | Gerar resumo dos pontos principais por tema |
| Voice note do WhatsApp | Resumir e/ou redigir resposta |
| Entrevista ou podcast | Criar sumário por tópico com timestamps |
| Depoimento ou testemunho | Transcrever literalmente, sem edição |

---

## Tratamento de Erros

| Situação | O que fazer |
|---|---|
| API retorna erro sem `segments` | Mostrar o erro bruto ao usuário; verificar se o arquivo é válido e < 3h |
| Diarization retorna só 1 speaker | Perguntar se é monólogo/voice note; oferecer transcrição sem separação |
| Áudio silencioso ou ininteligível | A API pode retornar `segments` vazio ou `text` em branco — reportar ao usuário |
| Arquivo maior que 25MB | Comprimir com ffmpeg antes de enviar (ver Passo 2) |
| `language` errado | Se o texto transcrito parecer truncado ou sem sentido, perguntar se o áudio está em outro idioma e retranscrever |
| Dois speakers parecem ser o mesmo | Aceitar instrução do usuário para unificar speakers no JSON final |
| Extensão de arquivo não reconhecida | Informar ao usuário; se for vídeo com extensão incomum, tentar extrair áudio com ffmpeg mesmo assim |

**Nota sobre `language`:** o script hardcoda `language=pt`. Se o áudio for em inglês ou outro idioma, alterar o parâmetro `-F "language=pt"` no comando curl dentro do script, ou comprimir e enviar manualmente com o idioma correto.

---

## Notas Técnicas

- `timestamp_granularities=word` é incompatível com `language` — o script usa `segment` para evitar conflito
- Speakers são identificados como inteiros (`0`, `1`, `2`...) no JSON bruto — Claude faz o mapeamento para nomes no Passo 4
- O JSON bruto em `/tmp/etl-raw.json` é temporário; o JSON final com nomes é o entregável
- ffmpeg é necessário apenas para vídeos ou compressão — áudios `.mp3`/`.m4a`/`.opus` vão direto para a API
