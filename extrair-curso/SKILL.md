---
name: extrair-curso
description: >
  Extrai curso online — vídeo, áudio MP3 e transcrição com timestamps — de plataformas
  de cursos como Hotmart, Kiwify, Teachable, Memberkit, Eduzz, comunidade Circle,
  Hubla, Greenn, Cademí, ou self-host. Funciona porque captura o stream HLS que o
  player do browser carrega — o usuário fica logado normalmente, a skill escuta o
  Chrome via DevTools Protocol. Use SEMPRE que o usuário pedir "extrair curso",
  "baixar curso", "salvar aulas", "transcrever curso inteiro", "fazer backup do curso",
  ou colar URL de uma aula em qualquer plataforma de cursos online. Aborta limpo se
  detectar DRM (Widevine/FairPlay/PlayReady) — comum em Hotmart Premium e Vimeo OTT.
  Roda em Claude Code (precisa de Bash); não funciona em Claude Desktop.
---

# /extrair-curso

Extrai cursos online — vídeo (opcional), áudio MP3, transcrição com timestamps, índice navegável — usando o **próprio browser autenticado** do usuário como porta de entrada. Não scrapa, não burla auth, não baixa direto da URL: deixa o player tocar normalmente e captura o stream m3u8 via Chrome DevTools Protocol.

A skill é plataforma-agnóstica porque HLS é padrão aberto. O que muda entre plataformas é o "chrome em volta" — botões de navegação, layout do player, nomes das aulas. Esse "chrome" é resolvido em runtime usando árvore de acessibilidade + raciocínio do Claude, sem seletor por plataforma.

## Quando usar / quando não usar

**Use quando:**
- Usuário cola URL de aula de plataforma de cursos online
- Pede "baixar curso inteiro", "transcrever todas as aulas", "fazer backup do curso que comprei", "estudar offline"

**Não use quando:**
- É vídeo de YouTube público — `youtube-downloader` é melhor
- Aluno só quer transcrever 1 arquivo de áudio que ele já tem — `/etl-audio` direto
- Plataforma usa DRM (Widevine/FairPlay/PlayReady) — skill detecta no manifest e aborta

## Pré-requisitos

1. **Claude Code** (não funciona em Claude Desktop — precisa Bash pra rodar Node + ffmpeg). **Windows: Git Bash (via Git for Windows) ou WSL2.** PowerShell/cmd nativo não roda os scripts.
2. **Google Chrome instalado.** A skill **spawna um Chrome dedicado próprio** com profile isolado em `~/.cache/extrair-curso/chrome-profile/`. **Não usa o Chrome principal do user** — não interfere com sessões dele, e ele pode usar o Chrome normal enquanto a skill roda.
3. **Node.js 22+** instalado separadamente (`brew install node` no Mac, `winget install OpenJS.NodeJS` no Windows). Não vem com Chrome.
4. **ffmpeg** instalado (`brew install ffmpeg` no Mac, `winget install Gyan.FFmpeg` no Windows).
5. **`/etl-audio`** instalada — esta skill delega a transcrição pra ela.
6. **Login na plataforma é HITL na primeira execução**: skill detecta se está deslogado e pede pro user logar uma vez. Login persiste enquanto JWT da plataforma não expirar (ex: Hotmart = 48h) e o profile dedicado não for limpo.

A skill é **autônoma**: ela embute internamente uma cópia da CLI `cdp.mjs` em `scripts/`. **Não precisa instalar `/chrome-cdp` separadamente** nem ativar remote debugging manualmente.

### Por que Chrome dedicado (e não o Chrome do user)

- **Isolamento:** user pode usar o Chrome principal sem que ações dele (mudar aba, fechar aba, navegar) atrapalhem o CDP da skill
- **Sem prompt "Allow debugging?"** porque o user-data-dir é próprio
- **Sem polluição** de extensions do user (ad-blockers, etc) que podem quebrar players
- **`--restore-last-session` flag:** preserva session cookies (TGC do CAS, JSESSIONID, etc) entre kills do Chrome — essencial pra SSO Hotmart e similares. Validado empiricamente em 2026-05-06.

## Sintaxe de invocação

```
/extrair-curso <url-da-primeira-aula>            # pergunta áudio vs vídeo antes de começar
/extrair-curso <url-da-primeira-aula> --audio    # explícito: só áudio + transcrição
/extrair-curso <url-da-primeira-aula> --video    # explícito: vídeo + áudio + transcrição
```

Sem URL, dispare a Pergunta 5 (ver "Protocolo de interação" abaixo).

## Protocolo de interação

**Toda pergunta ao aluno usa a tool `AskUserQuestion`.** Sem exceção. Não digite a pergunta como texto livre esperando resposta — é menos confiável e quebra UX em interfaces que renderizam choices nativamente. Vantagens: (a) opções clicáveis, (b) "Outro" automático pro aluno digitar livre se nenhuma opção encaixa, (c) registro estruturado da decisão.

Aplica-se a todos os pontos de decisão da skill, listados abaixo na ordem em que aparecem no fluxo. Use os formatos exatos como ponto de partida — adapte só se contexto exigir.

### Pergunta 1 — modo (se não veio `--audio` nem `--video`)

```
question: "Como quer baixar o curso?"
header: "Modo"
options:
  - label: "Só áudio (Recommended)"
    description: "MP3 ~15-45MB por aula. Ideal pra estudar e transcrever."
  - label: "Vídeo + áudio extraído"
    description: "MP4 1080p ~80-300MB. Skill extrai MP3 dele localmente (instantâneo)."
```

**Nota técnica:** se aluno escolher "Vídeo", a skill baixa apenas o MP4 e usa `ffmpeg -i video.mp4 -vn -c:a libmp3lame -b:a 64k audio.mp3` localmente pra gerar o MP3 (download é HLS uma vez, áudio sai quase de graça). Não vale a pena baixar dois streams separados — duplicaria tráfego sem benefício.

### Pergunta 2 — próxima aula não detectada

Quando passo 9 do loop falha em achar botão "próxima":

```
question: "Aula NN salva. Como continuar?"
header: "Próximo passo"
options:
  - label: "Vou colar a URL da próxima"
    description: "Você navega pra próxima aula no Chrome e cola a URL aqui."
  - label: "Encerrar curso"
    description: "Trato a captura como completa e gero o índice final."
```

### Pergunta 3 — confirmação de botão "próxima" identificado com baixa confiança

Quando o snap retornou múltiplos candidatos pra "próxima aula" e você não tem certeza:

```
question: "Encontrei {N} candidatos pra 'próxima aula'. Qual clico?"
header: "Botão próxima"
options:
  - label: "{descrição candidato 1}"
    description: "{role/texto/posição do elemento 1}"
  - label: "{descrição candidato 2}"
    description: "{role/texto/posição do elemento 2}"
  - label: "Nenhum, pula essa decisão"
    description: "Caio pra Pergunta 2 (cola URL ou encerra)."
```

### Pergunta 4 — cookies expirados durante captura

Quando `capture.sh` retorna exit 2 (auth):

```
question: "Cookies expiraram durante o download. O que fazer?"
header: "Auth"
options:
  - label: "Renovei a sessão, tenta de novo (Recommended)"
    description: "Eu já dei reload na aula no Chrome. Pode reusar a URL m3u8."
  - label: "Pula essa aula"
    description: "Marco como falha no índice e sigo pra próxima."
  - label: "Encerrar"
    description: "Paro aqui. Aulas já baixadas ficam intactas."
```

### Pergunta 5 — quando aluno não forneceu URL inicial

```
question: "Qual a URL da primeira aula?"
header: "URL"
options:
  - label: "Vou colar agora"
    description: "Cole a URL completa da primeira aula no Chrome."
  - label: "Não sei onde achar"
    description: "Eu te explico onde encontrar (depende da plataforma)."
```

### Pergunta 6 — tradução de legenda (apenas se idioma original ≠ português)

Após Fase 2 (transcrição completa), detecte o idioma original lendo o campo `language` do YAML frontmatter do primeiro `.md` (ou 2-3 segmentos). Se for diferente de português, dispare:

```
question: "O curso está em {idioma detectado}. Quer também legenda em português?"
header: "Tradução"
options:
  - label: "Sim, traduzir todas as legendas pra PT"
    description: "Cada SRT vira aula-NN.srt (PT, auto-load) + aula-NN.{lang}.srt (original)."
  - label: "Não, manter só no idioma original"
    description: "aula-NN.srt fica no idioma original. Sem tradução."
```

Se aluno escolher traduzir:
1. Renomeie `aula-NN.srt` → `aula-NN.<lang-original>.srt`
2. Use Claude (ou outro LLM/Google Translate) pra traduzir cada segmento mantendo timestamps idênticos
3. Salve resultado em `aula-NN.srt` (default, auto-load)

### Pergunta 7 — login HITL no Chrome dedicado (primeira execução por plataforma)

Quando setup inicial detectar `isLoggedOut: true` (passo 4 do Setup):

```
question: "Chrome dedicado abriu mas você não está logado em {plataforma}. Loga e me avisa quando terminar."
header: "Login"
options:
  - label: "Loguei, pode continuar (Recommended)"
    description: "Login feito na janela do Chrome dedicado. Skill vai retomar a captura."
  - label: "Não consigo logar"
    description: "Plataforma exige 2FA, captcha difícil, ou outra fricção."
  - label: "Cancelar extração"
    description: "Aborto agora. Tentamos depois."
```

**Importante:** o user precisa logar **na janela do Chrome dedicado que abriu** (não no Chrome principal dele). Janela tem ícone separado no dock e profile isolado. Após login, sessão persiste em runs futuros graças a `--restore-last-session`.

### Default se aluno escolher "Outro" (custom)

Sempre que o aluno digitar texto livre via "Outro": interprete o intent. Se for ambíguo, faça uma SEGUNDA `AskUserQuestion` pra desambiguar — não chute.

## Fluxo

### Setup inicial (uma vez por sessão de extração)

1. **Spawn (ou reuso) do Chrome dedicado.** A skill nunca conecta ao Chrome principal do user — sempre usa um Chrome próprio com profile isolado. Chame:
   ```bash
   DTAP=$(bash scripts/spawn-or-attach-chrome.sh "<url-da-aula>")
   export CDP_PORT_FILE="$DTAP"
   ```
   Script é **idempotente:** se Chrome dedicado já estiver vivo, retorna o `DevToolsActivePort` existente em milissegundos. Se não, spawna com flags corretas (`--user-data-dir`, `--remote-debugging-port=0`, `--restore-last-session`, etc) e aguarda inicialização. **Todos os comandos `cdp.mjs` daqui pra frente herdam `CDP_PORT_FILE`** — não esqueça de exportar.

2. **Encontre a aba.** Use `node scripts/cdp.mjs list` pra listar abas. Como o Chrome dedicado tem profile próprio, geralmente só haverá 1-2 abas (a principal). Se você passou URL pro spawn, ela já está aberta — pegue o target da primeira aba.

3. **Habilite Network domain.** Antes de qualquer chamada que dependa de eventos de rede, faça `node scripts/cdp.mjs evalraw <target> Network.enable '{}'`. Sem isso, `Network.getCookies` falha silenciosamente.

4. **Detecção de login + HITL inicial.** Após o Chrome carregar a aba, verifique:
   ```bash
   node scripts/cdp.mjs eval <target> "({isLoggedOut: document.body.innerText.includes('Cadastre-se aqui') && document.body.innerText.includes('Entrar') && !document.body.innerText.includes('Sair'), url: location.href})"
   ```
   Se `isLoggedOut: true` ou se URL redirecionou pra página de SSO (`sso.hotmart.com/login`, etc), dispare a Pergunta 7 (login HITL). Aguarde user logar manualmente na janela do Chrome dedicado e confirmar. Login persiste em runs futuros graças ao `--restore-last-session` no spawn.

   **Detecção alternativa por plataforma:** Hotmart Club mostra modal "Perfil close INTERESSES Cursos Comunidades" com `bodyLen ≈ 200` quando deslogado — heurística rápida quando precisar.

### Classificação de tipo de aula (CRÍTICA)

Antes de baixar qualquer coisa, **classifique a aula** — nem toda aula é vídeo. Plataformas como Hotmart Club misturam tipos no mesmo curso:

```bash
node scripts/cdp.mjs eval <target> "({
  iframe: [...document.querySelectorAll('iframe')].find(f => f.src.includes('cf-embed.play.hotmart') && f.clientWidth > 100)?.src,
  dlCount: [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Download').length
})"
```

| Sinal | Tipo da aula | Fluxo |
|---|---|---|
| `iframe` presente (player com `clientWidth > 100`) | **vídeo** | Fast path (Panda/Hotmart Player) → `hotmart-extract.sh` ou `capture.sh` |
| `iframe` ausente, `dlCount > 0` | **texto + materiais** | `text-aula-extract.sh` (extrai texto + baixa materiais via `Page.setDownloadBehavior`) |
| `iframe` ausente, `dlCount == 0` | **texto puro** | `text-aula-extract.sh` (só `.md`) |
| Sem título, sem iframe, sem botões | **fim do curso** ou aula vazia | Pula |

**Por que essa classificação importa:** descobrimos em campo (curso BrandsDecoded) que ~50% das aulas eram texto + PDFs/ZIPs anexados, não vídeos. O loop antigo ignorava aulas-texto silenciosamente. Agora trata os 3 casos.

### Estrutura do fluxo principal (modo vídeo)

A captura é dividida em **2 fases** pra dar feedback claro ao aluno:

- **Fase 1** (loop por aula) — para cada aula: classifica → baixa MP4 (vídeo) ou MD+materiais (texto). Navega pra próxima.
- **Fase 2** (em lote, depois) — extrai MP3 dos MP4 baixados (rápido, ~2s/aula) e transcreve via `bash transcribe.sh --srt` gerando `.json` (raw source of truth), `.md` (LLM/humano-friendly: YAML frontmatter + `## [HH:MM:SS]` headers) e `.srt` (legenda pra player) com mesmo basename do MP4.

**No modo áudio** (sem `--video`), as fases colapsam — baixa MP3 direto + transcreve por aula. Aulas-texto são tratadas igual no modo áudio (texto não tem o que extrair de áudio).

### Regra de feedback ao aluno (CRÍTICA)

**NÃO rode o loop completo em background sem reportar progresso.** Aluno fica perdido. Em vez disso:

- **A cada aula finalizada na Fase 1**, emita mensagem direta ao chat com formato:
  > *"✓ Aula N/total — `título` (XmYs, NMB) — restam M aulas"*
- Inclua duração e tamanho pra dar noção de quanto falta.
- Se você está rodando script em background, **faça poll a cada ~60s e reporte** as aulas novas que apareceram desde o último report. Não espere o `=== FIM ===`.
- Em Fase 2 (que é rápida), uma mensagem só basta: *"Extraindo áudio dos N vídeos... ✓ pronto em Xs"*.

A intuição: aluno pediu "baixa o curso todo" — mas isso pode levar 10-30min. Ele precisa saber a cada poucos minutos: *"tá vivo, tá progredindo, tá faltando X"*. Sem isso, ele perde confiança ou abandona o monitoramento.

### Para cada aula (loop = Fase 1)

1. **Detecte o player e tente fast path.** Inspecione iframes da página:
   ```bash
   node scripts/cdp.mjs eval <target> "[...document.querySelectorAll('iframe')].map(f => ({src: f.src, w: f.clientWidth})).filter(f => f.w > 100)"
   ```
   Se o `src` bater com algum **provider conhecido** (ver tabela "Fast paths" abaixo), construa a URL m3u8 pública direto e pule pro passo 4. Senão, prossiga.

2. **Espere o player carregar metadata** (apenas se fast path falhou). O m3u8 master é requisitado assim que o player atinge `HAVE_METADATA` (readyState ≥ 1). Loop com poll de 500ms por até 30s:
   ```bash
   node scripts/cdp.mjs eval <target> "({rs: document.querySelector('video')?.readyState, t: document.querySelector('video')?.currentTime})"
   ```
   Continue assim que `rs >= 1` ou `t > 0`. Se elemento `<video>` está dentro de iframe cross-origin, esse query retorna null — vai pro passo 3 com captura via Network domain.

3. **Capture o m3u8 master via Network domain do CDP.** `node scripts/cdp.mjs net <target>` só captura recursos da página principal — para players em iframes cross-origin (Panda, Vimeo, Mux), use o helper `scripts/iframe-capture.mjs`:
   ```bash
   node scripts/iframe-capture.mjs <iframe-target-id>
   ```
   Esse helper atacha no iframe via `Target.attachToTarget`, habilita `Network.enable`, e escuta requests por 20s.

   **Atenção crítica de timing:** se o player **já estava tocando** quando a skill iniciou, os segmentos já estão no buffer e o player não pede mais nada — captura retorna vazio. Soluções, em ordem de robustez:
   - **(a) Fast path** (passo 1) — não depende de captura
   - **(b) `Page.reload` no iframe + esperar player + capturar** — força tudo a ser re-requested
   - **(c) Pular a posição do vídeo** (`currentTime + 60`) — força player a buscar segments novos da posição futura

   Use `Page.reload` se você não tem fast path. Pra reload via CDP no iframe específico, é parte do `iframe-capture.mjs`.

   **Não escolha rendition** — o master m3u8 já contém todas; ffmpeg negocia sozinho.

3. **Detecte DRM.** Baixe o master com `curl -s <m3u8>` e busque por:
   - `KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"` → Widevine
   - `KEYFORMAT="com.apple.streamingkeydelivery"` → FairPlay
   - `KEYFORMAT="urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95"` → PlayReady

   `EXT-X-KEY:METHOD=SAMPLE-AES` ou `METHOD=AES-128` **sem** `KEYFORMAT` apontando pros UUIDs acima **não é DRM** — é AES-128 simples e ffmpeg lida.

   Se for DRM real, aborte:
   > *"Esse curso usa DRM ({método}). Não dá pra extrair. Plataformas comuns com DRM: Hotmart Premium, Vimeo OTT, Kajabi enterprise."*

4. **Capture cookies.**
   ```bash
   node scripts/cdp.mjs evalraw <target> Network.getCookies "{\"urls\":[\"<dominio-do-m3u8>\"]}"
   ```
   Monta string Cookie: `k1=v1; k2=v2; ...`. Pegue Referer = URL atual da aula.

5. **Capture metadados ANTES de baixar.** Pegue título e número da aula:
   ```bash
   node scripts/cdp.mjs eval <target> "document.title"
   ```
   Se o `<title>` não tiver o título da aula, faça `node scripts/cdp.mjs snap <target>` e procure heading principal. Slug = título normalizado: lowercase, sem acentos, espaços→hífen, max 80 chars.

6. **Baixe a mídia.**

   **Modo áudio:** baixa MP3 direto.
   ```bash
   bash scripts/capture.sh <m3u8-url> ~/cursos/<slug-curso>/aula-NN-<slug-titulo>.mp3 "<cookies>" "<referer>"
   ```

   **Modo vídeo:** baixa **só o MP4** nesse passo. Não extraia áudio aqui — isso é fase separada (passo 10) pra dar feedback claro pro aluno.
   ```bash
   bash scripts/capture.sh --video <m3u8-url> ~/cursos/<slug-curso>/aula-NN-<slug-titulo>.mp4 "<cookies>" "<referer>"
   ```

   `capture.sh` retorna exit 0 em sucesso. Se exit ≠ 0, leia stderr — se contém `403` ou `401`, cookies expiraram: dispare a Pergunta 4 (ver "Protocolo de interação"). Conforme a escolha, retoma do passo 4, pula a aula ou encerra.

7. **Transcreva via `transcribe.sh` — só no modo áudio direto.** No modo vídeo, transcrição é parte da fase 2 (passo 10) depois de extrair os MP3. Invoque `bash ~/.claude/skills/etl-audio/scripts/transcribe.sh <mp3> <basename>.json` passando o caminho do MP3. **Sem flag `--srt` no modo áudio** (não há MP4 pra acompanhar). Gera dois arquivos ao lado do MP3 com mesmo basename: `.json` (raw Voxtral, source of truth) e `.md` (YAML frontmatter + `## [HH:MM:SS]` headers, formato LLM-friendly).

8. **Salve metadados da aula.** Crie `aula-NN-<slug-titulo>.meta.json` (sufixo `.meta` evita colisão com o `.json` da transcrição):
   ```json
   {
     "numero": NN,
     "titulo": "Título completo da aula",
     "url_aula": "https://...",
     "m3u8_master": "https://...",
     "duracao_segundos": 1234,
     "capturado_em": "2026-05-05T13:42:00Z",
     "tamanho_mp3_bytes": 12345678
   }
   ```

9. **Navegue pra próxima aula.** Faça `node scripts/cdp.mjs snap <target>` e identifique o elemento que avança — pode ser botão "Próxima"/"Next"/"Continuar", `aria-label` indicando próximo, seta `→`, item destacado seguinte numa lista lateral, ou atalho de teclado documentado. Use seu raciocínio sobre o que faz sentido visualmente.

   Tendo identificado, clique. Como o `cdp.mjs click` exige seletor CSS, **prefira `eval` com lookup por texto** quando o elemento for identificado pelo conteúdo:
   ```bash
   # Por seletor CSS (se você consegue construir um)
   node scripts/cdp.mjs click <target> 'button[aria-label="Próxima aula"]'

   # Por texto (mais robusto cross-platform)
   node scripts/cdp.mjs eval <target> "[...document.querySelectorAll('button,a')].find(el => /próxima|next|continuar/i.test(el.textContent))?.click()"
   ```
   Espere a URL mudar (poll de 200ms até 10s). Se mudou, volte ao passo 1 do loop.

   **Se múltiplos candidatos plausíveis** → dispare a Pergunta 3.
   **Se nada plausível ou após clique a URL não muda** → dispare a Pergunta 2.

### Fase 2 — Extração de áudio + transcrição em lote (apenas modo vídeo)

Depois que o loop da Fase 1 terminar (todos os MP4 baixados), processe **todos de uma vez**, dando feedback agregado ao aluno. Não intercale com o loop — o aluno já viu progresso aula por aula na Fase 1; agora ele quer ver "tô extraindo áudio dos N vídeos" como bloco.

**Anuncie o início:**
> *"Fase 1 concluída — {N} vídeos baixados. Iniciando Fase 2: extração de áudio e transcrição."*

**Para cada `aula-NN-*.mp4` em `~/cursos/<slug>/`:**

```bash
for VIDEO in ~/cursos/<slug>/aula-*.mp4; do
  BASE="${VIDEO%.mp4}"
  if [ ! -f "$BASE.mp3" ]; then
    ffmpeg -hide_banner -loglevel error -i "$VIDEO" -vn -c:a libmp3lame -b:a 64k -y "$BASE.mp3"
    echo "  ✓ $(basename "$BASE").mp3"
  fi
done
```

A extração é praticamente instantânea (~1-2s por aula de 30min). Pra curso de 30 aulas leva menos de 1min.

**Depois das extrações:** invoque `bash ~/.claude/skills/etl-audio/scripts/transcribe.sh --srt <mp3> <basename>.json` em cada MP3 (sequencial — Mistral Voxtral tem rate limit). Pra cada aula:
1. Script recebe path do MP3 e basename do output
2. Salva 3 arquivos ao lado do MP3 com mesmo basename:
   - `aula-NN-*.json` — raw Voxtral (source of truth)
   - `aula-NN-*.md` — YAML frontmatter + `## [HH:MM:SS]` headers (LLM/humano)
   - `aula-NN-*.srt` — legenda pro player (auto-load com mesmo basename do MP4)
3. Reporta progresso: *"Transcrição {N}/{total}: {título}"*

**Por que `--srt` no modo vídeo:** o MP4 está ao lado, e VLC/IINA/QuickTime auto-carregam SRT com mesmo basename. No modo áudio (sem MP4) omitir `--srt` evita arquivo órfão.

Se aluno quiser pular transcrição (custo Mistral, pra curso longo), faça uma `AskUserQuestion`:

```
question: "Áudio extraído. Transcrever também?"
header: "Transcrição"
options:
  - label: "Sim, transcrever tudo (Recommended)"
    description: "Usa transcribe.sh em cada MP3. Demora ~30s/aula. Custo Mistral por hora de áudio."
  - label: "Pular, só salvar MP3 e MP4"
    description: "Você transcreve manualmente depois se precisar."
```

## Modo batch — múltiplos cursos com pool paralelo

Quando o user pede "baixa todos os cursos da plataforma X" ou cola URL de página tipo `/purchases`, **não processe sequencial**. Use o `pool-runner.sh` pra paralelizar download e transcrição (4 workers cada). Speedup típico: 3-4x vs sequencial.

### Quando ativar

- User cola URL de página listando múltiplos cursos (`/purchases`, `/my-courses`, dashboard)
- User pede "baixar todos os cursos comprados" ou similar
- Você identifica ≥3 cursos pendentes na plataforma

Se for 1-2 cursos, processa sequencial (overhead do batch não compensa).

### Arquitetura

**Master (Claude main thread):** discovery + classificação. Sequencial, mas rápido (só DOM querying, sem download).
**Workers (pool-runner.sh):** download HLS + transcribe Mistral. Paralelos, 4 simultâneos.

### Fluxo

#### 1. Discovery (sequencial)

Pra cada curso na lista do user:
1. Spawn-or-attach Chrome dedicado, navegue pra URL do produto
2. Liste todas as aulas (`a[href*="/content/"]` no Hotmart Club, ajuste por plataforma)
3. **Pra cada aula:** classifique (vídeo / texto+materiais / texto puro)
4. Pra aulas-texto: extraia **imediatamente** sequencial (rápido, ~3s cada via `text-aula-extract.sh`)
5. Pra aulas-vídeo: **NÃO baixe ainda** — colete iframe URL + cookies + outpath e gere uma linha em `~/.cache/extrair-curso/download-jobs.txt`:
   ```
   bash ~/.claude/skills/extrair-curso/scripts/hotmart-extract.sh "<iframe-url>" "<outpath-mp4>" "<referer>"
   ```

Repita pra todos os cursos. Ao final tem `download-jobs.txt` com 1 linha = 1 download.

**Custo Hotmart token Akamai:** os tokens das iframes têm TTL de 8min. Se o discovery for muito lento (>5min), tokens podem expirar antes do pool começar a baixar. Pra cursos com >50 aulas-vídeo, divida em batches: discovery + download de 30-40 aulas → próximo batch.

#### 2. Pool de download (paralelo)

```bash
bash scripts/pool-runner.sh 4 ~/.cache/extrair-curso/download-jobs.txt /tmp/pool-download
```

- **4 workers** simultâneos. Hotmart Player aguenta esse paralelismo (cada um tem sua sessão Akamai).
- Cada worker grava log próprio em `/tmp/pool-download/job-NNNN.log`.
- Status agregado em `/tmp/pool-download/status.txt`.

**Reportar progresso a cada 60-90s** (regra do pitfall #7). Use loop com `ScheduleWakeup` ou conte linhas `done` no status.txt:
```bash
DONE=$(grep -c ' done ' /tmp/pool-download/status.txt)
TOTAL=$(wc -l < /tmp/pool-download/status.txt)
echo "Download: $DONE/$TOTAL"
```

#### 3. Pool de transcrição (paralelo, depois do download)

Após pool de download terminar, gere `transcribe-jobs.txt`:

```bash
# Discovery: lista todos MP4 sem .json correspondente — usa Python (zsh glob falha em alguns contextos)
python3 << 'PYEOF' > ~/.cache/extrair-curso/transcribe-jobs.txt
import glob, os, subprocess
mp4s = sorted(glob.glob(os.path.expanduser('~/cursos/<slug>/aula-*.mp4')))
for v in mp4s:
    base = v[:-4]
    if os.path.exists(base + '.json'): continue  # skip já transcritos
    # Validação anti-pitfall #14: MP4 corrompido (moov atom missing) passa
    # silencioso pra ffmpeg + transcribe e quebra o pool inteiro.
    if subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', v],
                      capture_output=True).returncode != 0:
        print(f"# SKIP corrupted: {v}", file=__import__('sys').stderr)
        continue
    if os.path.getsize(v) < 1_000_000:
        print(f"# SKIP too small: {v}", file=__import__('sys').stderr)
        continue
    mp3 = base + '.mp3'
    pre = "" if os.path.exists(mp3) else f"ffmpeg -hide_banner -loglevel error -i '{v}' -vn -c:a libmp3lame -b:a 64k -y '{mp3}' && "
    # Retry built-in: 5 tentativas, sleep 60s entre cada (pitfall #2)
    print(f"{pre}for i in 1 2 3 4 5; do bash ~/.claude/skills/etl-audio/scripts/transcribe.sh --srt '{mp3}' '{base}.json' && break; sleep 60; done")
PYEOF

# MAX_PARALLEL=2 (não 4 — ver pitfall #2). Voxtral 429-throttla agressivo
# quando 4 calls começam quase simultâneas. 2 + retry built-in em cada job =
# 17/17 OK validado em campo. 4 paralelos = 10/20 falhas no mesmo batch.
bash scripts/pool-runner.sh 2 ~/.cache/extrair-curso/transcribe-jobs.txt /tmp/pool-transcribe
```

**Default MAX_PARALLEL=2 pra transcrição** (não 4). Cada job tem retry built-in (5 tentativas × sleep 60s). Detalhes em pitfall #2.

#### 4. Encerramento

Após ambos os pools terminarem:
- Pra cada curso, gere `index.md` próprio (mesma estrutura da seção Encerramento sequencial)
- Reporte: *"Batch concluído: {N} cursos, {M} aulas-vídeo, {K} aulas-texto, {failed} falhas. Pasta raiz: ~/cursos/."*
- Se houver falhas em `pool-download/status.txt` ou `pool-transcribe/status.txt`, liste os jobs failed com link pro log pra usuário inspecionar.

### Reporting durante o batch

Master Claude **NÃO bloqueia** esperando o pool terminar. Em vez disso:
1. Spawna `pool-runner.sh` em background com `run_in_background: true`
2. A cada 60-90s, lê `status.txt` e reporta:
   > *"Download: 23/47 ✓, 4 em progresso, 20 pendentes (12 min ETA)"*
3. Quando pool termina (PID exit), avança pra próxima fase

### Limites e cuidados

- **Disco**: 12 cursos × 5 aulas-vídeo × 100MB = ~6GB. Verifique espaço antes de começar.
- **Banda**: 4 downloads paralelos a 5MB/s cada = 20MB/s sustentado. Se conexão for menor, baixe `MAX_PARALLEL` pra 2.
- **Custo Mistral**: estime antes — ~US$ 0,001/min de áudio. 60h de áudio = ~US$ 4.
- **Hotmart Akamai token expiry**: discovery + download tem que terminar dentro de 8min POR aula. Pool de 4 workers consome 4 jobs/8min = ~30 jobs/hora.
- **Falhas:** o `pool-runner.sh` não retenta automaticamente. Se um download falhar (token expired, network blip), o job fica `fail` no status. Após o pool, identifique os fails e re-rode só esses (re-extrai cookies frescos primeiro).

### Encerramento

Quando o usuário disser "fim" ou skill detectar última aula (sem botão "próxima" identificável + URL não muda):

1. Gere `index.md` em `~/cursos/<slug-curso>/`:
   ```markdown
   # {Nome do curso}

   Capturado em {data ISO}. {N} aulas. Origem: {URL base}.

   ## Aulas

   | # | Título | Duração | Arquivos |
   |---|--------|---------|----------|
   | 01 | Introdução ao tema | 12:34 | [áudio](aula-01-introducao.mp3) · [transcrição](aula-01-introducao.md) · [SRT](aula-01-introducao.srt) · [json](aula-01-introducao.json) |
   | 02 | ... | ... | ... |

   ## Como verificar
   - Escute `aula-01-*.mp3` e confira se o áudio tá nítido.
   - Abra `aula-01-*.md` — formato LLM/humano com YAML frontmatter + `## [HH:MM:SS]` headers. Confira se a transcrição faz sentido.
   - SRT (modo vídeo só) carrega automático no VLC/IINA com o MP4 ao lado.
   - JSON é raw Voxtral, source of truth — útil pra reprocessar/reformatar depois.
   ```

2. Reporte: *"Pronto. {N} aulas em `~/cursos/<slug-curso>/`. Total {duração-total}, {tamanho-total}. Abre o `index.md` pra navegar."*

## Fast paths (providers conhecidos)

Quando o player é de um provider conhecido com **URLs públicas previsíveis**, pule a captura via CDP — é mais rápido e robusto. Detecte pelo `src` do iframe principal da aula.

| Provider | Sinal no iframe `src` | Como obter URL master m3u8 |
|---|---|---|
| **Panda Video** | `*.tv.pandavideo.com.br/embed/?v=<videoId>` | URL pública direta: `https://b-{playerId}.tv.pandavideo.com.br/{videoId}/master.m3u8` (playerId vem do subdomínio do iframe: `vz-e016c86e-56e`). Sem cookies, sem auth. |
| **Hotmart Player nativo** | `cf-embed.play.hotmart.com/embed/<mediaCode>` | Curl o iframe URL com **cookies da page hotmart.com** (`Network.getCookies` no target da page) + headers `Origin: https://hotmart.com` + `Referer: https://hotmart.com/`. Parsear `<script id="__NEXT_DATA__">` do HTML. URL m3u8 está em `pageProps.applicationData.mediaAssets[0].url`. Token Akamai expira em **~8 minutos** — baixar imediatamente. ffmpeg precisa de `Origin: https://cf-embed.play.hotmart.com` + `Referer: https://cf-embed.play.hotmart.com/`. |

Para cada fast path: faça `curl -sIL <url>` primeiro. Se retornar `200` com `Content-Type: application/vnd.apple.mpegurl`, use direto — pode pular cookies, etl com `curl -s <url>` para conferir DRM, e ir direto pro `capture.sh` sem cookies. Se retornar 401/403, **NÃO** insista — caia no fluxo de captura via CDP (que vai pegar a URL signed com auth válida).

**Plataformas que usam Panda Video** (cobertas pelo fast path Panda): Hotmart Club (alguns cursos), Cademí, Greenn, Memberkit.

**Hotmart Player nativo** é usado por boa parte dos cursos no Hotmart Club. Detecção: iframe começa com `cf-embed.play.hotmart.com`. Extração via `__NEXT_DATA__` (ver tabela acima). **Caveat de segurança:** o token Akamai expira em ~8min, então a sequência **extrair → baixar** deve rodar como uma transação atômica por aula, não em fases batched. Pra cursos longos, tratar como exceção do fluxo padrão de "Fase 1 captura todos os MP4, depois Fase 2 extrai áudios" — no caso Hotmart, fazer download imediato após extração de cada aula.

Use o helper `scripts/hotmart-extract.sh` que encapsula a transação atômica. Antes de chamar, capture cookies da page hotmart.com uma vez:
```bash
node scripts/cdp.mjs evalraw <page-target> Network.getCookies '{"urls":["https://hotmart.com/"]}' > /tmp/hotmart-cookies.json
bash scripts/hotmart-extract.sh "<iframe-src>" ~/cursos/<slug>/aula-NN-<titulo>.mp4
```
O script faz curl com cookies → parseia `__NEXT_DATA__` → chama ffmpeg com headers Hotmart corretos. Cookies duram a sessão do browser (geralmente horas), então captura é única por sessão de extração.

## Aulas-texto e materiais anexados

Plataformas de cursos mais ricas (Hotmart Club, Memberkit) têm aulas que são **só texto + arquivos anexos** (PDFs, ZIPs, planilhas) — sem vídeo nenhum. O fluxo CDP ignora essas aulas se você só procurar por iframes.

### Helper: `scripts/text-aula-extract.sh`

Encapsula a extração:
```bash
bash scripts/text-aula-extract.sh <target-id> <outdir> <basename>
# ex: text-aula-extract.sh 09E41500 ~/cursos/brandsdecoded aula-02-prompts-claude
# Saída:
#   ~/cursos/brandsdecoded/aula-02-prompts-claude.md
#   ~/cursos/brandsdecoded/aula-02-prompts-claude/<materiais>...
```

O script:
1. Lê título via `h1.h5._font-weight-bold` (Hotmart Club; se outra plataforma, ajustar seletor)
2. Encontra container que contém "Informações da aula" e extrai `innerText`
3. Limpa ruído de UI (`Concluir`, `+ 10`, `Informações da aula`) e gera `.md`
4. Conta botões `Download` na página
5. Se houver materiais: usa `Page.setDownloadBehavior` pra direcionar downloads pra pasta da aula, clica cada botão, espera `.crdownload` desaparecer

### Padrão `Page.setDownloadBehavior` (importante)

Ao invés de tentar interceptar URLs assinadas e fazer curl com Bearer/cookies/headers customizados, **deixe o browser fazer o download** e instrua o CDP onde salvar:

```bash
node scripts/cdp.mjs evalraw <target> Page.enable '{}'
node scripts/cdp.mjs evalraw <target> Page.setDownloadBehavior \
  "{\"behavior\":\"allow\",\"downloadPath\":\"/abs/path/destino\"}"
# Agora qualquer download que a aba disparar vai cair em /abs/path/destino
node scripts/cdp.mjs eval <target> "[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Download')?.click()"
```

Vantagens vs interceptar URL:
- ✓ Browser resolve auth (cookies, Bearer, x-product-id, redirects) sozinho
- ✓ Funciona pra qualquer plataforma sem mapear API
- ✓ Robusto a mudanças de endpoint
- ✓ Sem necessidade de extrair tokens do localStorage

Caveat: monitorar `*.crdownload` no destino pra saber quando download terminou (Chrome usa essa extensão durante transferência).

### Seletores Hotmart Club (referência)

| O que | Seletor |
|---|---|
| Título da aula | `h1.h5._font-weight-bold` (único na página) |
| Container do conteúdo | ancestor mais próximo do título que contém "Informações da aula" |
| Botão próxima aula | `a[aria-label="Próxima"]` (use `.href` + `cdp.mjs nav`, não `.click()` — autoplay drift) |
| Botão aula anterior | `a[aria-label="Anterior"]` |
| Botões Download | `button` com `textContent.trim() === 'Download'` |
| Iframe player vídeo | `iframe[src*="cf-embed.play.hotmart"]` com `clientWidth > 100` |

## Plataforma desconhecida — consulte referências antes de desistir

Quando os fast paths falham e o caminho CDP genérico também não funciona (player exótico, auth não-convencional, DRM esquisito), **não relate fracasso direto pro aluno**. Antes, consulte projetos de referência open-source que provavelmente já resolveram aquela plataforma:

| Referência | URL | Quando consultar |
|---|---|---|
| **Katomart** | `github.com/katomaro/katomart` | Plataforma brasileira (Eduzz, Kiwify, Gran Cursos, Estratégia Concursos, SafeVideo, etc). 40+ plataformas mapeadas, código Python ativo até abr/2026. Usa Playwright. Tem receita pra Widevine via CDM + Bento4 mp4decrypt. |
| **Gist juvenal/Hotmart** | `gist.githubusercontent.com/juvenal/2d9a822325769d30c45c635fbf388c1b/raw` | Específico de Hotmart. Mostra a API oficial (`api-club.hotmart.com`, `contentplayer.hotmart.com`) com auth OAuth Sparkle. Útil pra listar módulos/aulas via API ao invés de DOM. ~2018 — endpoints podem ter mudado. |

### Como usar como referência

1. Identifique a plataforma pelo domínio do iframe ou da URL principal
2. Faça `WebFetch` ou clone o repo Katomart e procure o módulo correspondente (`platforms/<nome>.py` ou similar)
3. Adapte o método (auth, listagem, extração) pro nosso fluxo CDP — não rode o código deles direto, traduza a lógica
4. Se descobrir um padrão estável, **adicione novo fast path** na tabela acima pra não precisar reaprender da próxima vez

A intuição: o ecossistema brasileiro de cursos online já foi mapeado por desenvolvedores motivados. Se a skill não sabe extrair de uma plataforma X, é altíssima chance de Katomart já ter o método. Não desista — pesquise.

## Cookies: opcionais por padrão

Plataformas se dividem em duas categorias de auth:

- **Signed URL** (Panda Video, Mux, alguns Vimeo): a URL m3u8 inclui token na própria URL. Cookies não importam. Capture sem cookies primeiro; se ffmpeg dá 200, está OK.
- **Cookie-based** (alguns LMS self-hosted, Teachable antigo): m3u8 é URL fixa, mas cada segmento exige cookie. Capture cookies via `Network.getCookies` e passe pro `capture.sh`.

Tente sem cookies primeiro. Se `capture.sh` retornar exit 2 (auth error), aí captura cookies e tenta de novo.

## Pontos críticos

### Por que captura via player (e não download direto)

Plataformas assinam URLs com TTL curto (5–30 min) e/ou exigem cookies de sessão em cada segmento. Tentar baixar via API ou URL direta dá 403 nesses casos. Deixar o player carregar é o caminho que respeita auth da plataforma — do ponto de vista dela, é o usuário assistindo. **Exceção:** providers com URLs públicas (Panda Video) — fast path pula essa dança.

### Áudio-only por padrão

Vídeo HD = 1–3GB; áudio MP3 64kbps = 15–45MB pra aula de 30–90min. Pra 99% do uso (estudo, indexação, transcrição), áudio basta. `--video` salva também o MP4 pra quem quer reassistir.

### Resumível em sessões diferentes

O loop é tolerante a interrupção: se aluno fechar e voltar amanhã, é só listar `~/cursos/<slug>/aula-*.json` pra saber por onde parou e retomar.

## Composição com outras skills

- **CDP**: `scripts/cdp.mjs` é cópia local da CLI `/chrome-cdp`. Skill é autônoma.
- **`/etl-audio`**: chamada via `bash ~/.claude/skills/etl-audio/scripts/transcribe.sh [--srt] <mp3> <basename>.json`. Sempre gera `.json` (raw Voxtral) + `.md` (YAML frontmatter + `## [HH:MM:SS]` headers). Com `--srt`, gera também `.srt` pro player. Modo vídeo passa `--srt` (tem MP4 ao lado), modo áudio omite (sem MP4).

## Convenções de output

```
~/cursos/
└── <slug-do-curso>/
    ├── aula-01-introducao.mp3
    ├── aula-01-introducao.mp4         (opcional, se --video)
    ├── aula-01-introducao.json        (raw Voxtral — source of truth)
    ├── aula-01-introducao.md          (transcrição LLM/humano-friendly)
    ├── aula-01-introducao.srt         (só modo vídeo — auto-load com MP4)
    ├── aula-01-introducao.en.srt      (apenas se houver tradução: original com sufixo)
    ├── aula-02-...
    └── index.md
```

Slugs: lowercase, sem acentos, espaços→hífen, max 80 chars, prefixo `aula-NN-` resolve colisões de título.

### Regra de naming SRT (importante)

VLC, IINA, QuickTime auto-carregam o SRT que tem **mesmo basename** que o vídeo. Use isso a favor do aluno:

- **Sem tradução** (curso no idioma do aluno): `aula-NN.srt` = idioma original. Único arquivo, auto-load.
- **Com tradução** (aluno pediu legenda em outro idioma):
  - `aula-NN.srt` = **idioma escolhido pelo aluno** (default, auto-load)
  - `aula-NN.<lang-original>.srt` = idioma original (alternativo, ele troca manualmente no player se quiser)

Exemplo: curso em inglês, aluno pediu PT → `aula-01.srt` (PT, auto-load) + `aula-01.en.srt` (EN, alternativo).

Razão: aluno abre o vídeo, vê legenda no idioma que pediu, sem precisar configurar nada. Original fica disponível pra comparação.

## Exemplo end-to-end

```
[Usuário]: /extrair-curso https://comunidade.escoladeautomacao.com.br/c/curso-x/aula-1-introducao

[Skill]:
  ✓ Aba localizada (target 6BE827FA, "Curso X - Aula 1")
  ✓ Network domain habilitado
  ✓ Player carregou metadata (readyState=2)
  ✓ m3u8 master: https://stream.../master.m3u8
  ✓ DRM check: limpo (AES-128 simples, ffmpeg lida)
  ✓ Cookies capturados (5 cookies)
  ⏬ Baixando áudio... 14.2 MB em 8s
  📝 Transcrevendo via transcribe.sh... 12 minutos transcritos
  💾 aula-01-introducao.{mp3,json,md} salvos (modo áudio: sem .srt)
  🔍 Procurando próxima aula... botão "Próxima aula" identificado
  ✓ Avançou pra aula 2

  ... loop ...

  ✓ Curso completo: 18 aulas, 4h32min, 312 MB
  📂 ~/cursos/curso-x/index.md
```

## Limites conhecidos

- **DRM** (Widevine/FairPlay/PlayReady): aborta. Sem como contornar legalmente.
- **Player não-HTML5** (Flash legado, players proprietários sem `<video>`): passo 1 do loop falha. Skill avisa e pede ação manual.
- **Paywall por aula** (não por curso): cada captura consome quota da plataforma; skill apenas baixa.
- **Cursos com >100 aulas**: pode levar horas. Loop é incremental — pode rodar em sessões.

## Pitfalls aprendidos em campo

Lições de execuções reais que **devem** virar regra automática. Cada uma destrói uma execução se ignorada.

### 1. Parsing de CSV/dados estruturados → SEMPRE Python, NUNCA bash `read IFS='|'`

`read -r NN TITLE URL ... <<< "$linha"` quebra com strings UTF-8 longas: títulos como `Equipamento Importa?` viram `uipamento Importa?`, gerando NN corrompido e download na pasta errada. Aconteceu em 6+ aulas no curso Arthur Miller.

**Regra:** scripts que processam linhas com títulos ou URLs longas **devem** usar Python (`with open(csv) as f: parts = line.split('|')`). Bash `read` só pra ASCII curto e controlado.

### 2. Mistral Voxtral: default MAX_PARALLEL=2 com retry built-in — não 4

5+ workers paralelos disparam `429 Rate limit exceeded` imediatamente. **4 também falha em batches médios:** validado 2026-05-06 no batch BrandsDecoded (20 jobs com `MAX_PARALLEL=4` → **10 falharam de cara** com 429 porque 4 calls começam quase simultâneas e Voxtral throttla agressivo). Re-rodando os 10 com `MAX_PARALLEL=2` + retry built-in (5 tentativas × sleep 60s) → **10/10 OK no primeiro retry**.

**Regra atual:**
1. **Default `MAX_PARALLEL=2`** pra transcrição em batch. NÃO use 4.
2. **Retry built-in em cada job** do `transcribe-jobs.txt`. Forma do comando:
   ```bash
   for i in 1 2 3 4 5; do bash transcribe.sh --srt MP3 JSON && break; sleep 60; done
   ```
   Sleep 60s entre tentativas dá margem pra Voxtral resetar o counter da chave.
3. **Sempre skip outputs válidos** (`is_valid_json()` checando `json.loads` + tamanho > 100B) pra retomadas não re-pagarem chamadas — economiza custo Mistral real.
4. **Pra batches grandes (>50 vídeos):** considere `MAX_PARALLEL=1` puro com sleep 5s entre jobs. Curso Pedro Adão (83 vídeos, ~75h) só foi viável sequencial com retry exponencial (`30s → 60s → 120s → 240s → 480s`).

Pace observado:
- 20 vídeos curtos+médios × 2 paralelos × ~1-2min/job = **~15min total** (BrandsDecoded 2026-05-06).
- 70+ vídeos longos × 1 sequencial × ~2-3min/job = **~2.5h total** (Pedro Adão).

Wakeups longos (1500-1800s) entre checks pra não queimar context cache.

### 3. Dedupe de aulas: por `mediaCode` do iframe, NÃO por slug do título

Dois links diferentes do Hotmart Club podem ter o mesmo título visível (ex: "O Primeiro Desafio" aparecendo em módulos diferentes). Detecção por slug gera duplicata silenciosa. Detecção por `mediaCode` (ID interno do player no iframe URL: `cf-embed.play.hotmart.com/embed/<mediaCode>`) é confiável.

**Regra:** ao coletar URLs, manter um `set()` de `mediaCode` já visto. Se repetir, pula com aviso. Se a coleta terminou e existe duplicata mesmo assim, deletar via `md5sum` antes de gerar `index.md`.

### 4. Validar JSON após gerar — fallback se ffprobe falhou

`ffprobe` pode falhar silenciosamente (lib desalinhada após `brew update` de dependência transitiva tipo x265). Se script Bash usa `$(ffprobe ...)` direto no JSON, gera arquivo inválido (`"duracao_segundos": ,`).

**Regra:** após escrever JSON, ler de volta com `json.load` ou `python3 -c "import json; json.load(open('x'))"`. Se inválido, fallback duracao_segundos=0 e adicionar à lista de "fixar depois". No fim do pipeline, varrer e re-rodar ffprobe naquelas que ficaram zeradas.

### 5. LIVEs longas (>1h) podem travar no token Akamai mid-download

ffmpeg fica em rebuffering perpétuo quando token original expira durante download de uma live longa. Não dá erro — só para de progredir. Tamanho do arquivo congela mas elapsed continua subindo.

**Regra:** monitorar progresso do ffmpeg — se `time=` no stderr não avançar por 60s, matar e reiniciar pegando novo token (re-curl no iframe). Pra LIVEs aceitar truncamento parcial e documentar no `index.md`.

### 6. Workers paralelos: cada um grava em log separado, NUNCA `tee` compartilhado

`bash worker.sh ... 2>&1 | tee -a log.txt &` com múltiplos workers em paralelo intercala saídas no meio das linhas: `[start 19] título[start 20] título`. Vira impossível parsear status.

**Regra:** cada worker grava em `/tmp/worker-NN.log` próprio. Status agregado lê os arquivos depois pra montar progresso. Stdout do orquestrador imprime só "[start NN]" e "[OK NN]" — sem tee de output ffmpeg.

### 7. Feedback obrigatório a cada 60-90s — não apenas no `=== FIM ===`

Já existia regra "feedback aula-por-aula", mas ficou claro que rodar 5+ minutos sem update faz user perder confiança e pedir cancelamento. Mesmo quando processo está progredindo bem.

**Regra reforçada:** após lançar um background task que dura mais de 60s, **sempre** agendar `ScheduleWakeup(delaySeconds=90)` pra reportar progresso. Não esperar mensagem do user pra dar update.

### 8. Cleanup de processos órfãos: `pkill -9 ffmpeg`, não só `pkill -f wrapper`

Matar o wrapper bash (`pkill -f extract-loop.sh`) deixa ffmpeg child rodando como orphan, segurando recursos e confundindo o estado (download "fantasma" continua escrevendo no arquivo).

**Regra:** sequência de cleanup correta:
```bash
pkill -f "wrapper-script.sh" 2>/dev/null   # mata orquestrador
sleep 2
pkill -9 ffmpeg 2>/dev/null                # mata ffmpeg residual
pkill -9 -f hotmart-mp3 2>/dev/null        # mata helpers
```

### 9. brew updates podem quebrar ffmpeg silenciosamente

Atualização de lib transitiva (x265, x264) deixa ffmpeg referenciando `.215.dylib` que virou `.216.dylib`. ffprobe morre com `Symbol not found`. ffmpeg pode até continuar carregando se for chamado direto.

**Regra:** se algum download começa falhar do nada no meio do pipeline, primeira diagnóstico é `ffmpeg -version` + `ffprobe -version`. Se reclamar de symbol/library, `brew reinstall ffmpeg` resolve em ~30s.

### 10. Modal "Perfil" do Hotmart Club = sessão SSO expirou (não é bug de CDP)

**Hipótese antiga (descartada):** "navegações via CDP travam o app Next.js do Hotmart Club no modal Perfil". Falsa. Reproduzido em Chrome dedicado limpo: o modal aparece **logo de cara** quando o user não tem sessão SSO válida — não tem nada a ver com nav-via-CDP.

**Causa real:** SSO Hotmart depende do cookie `TGC` (Ticket Granting Cookie do CAS) — cookie session-only, HttpOnly+Secure+SameSite=None. Quando o cookie expira ou some, o app renderiza o modal "Perfil" em vez do conteúdo, mostrando "Cadastre-se aqui / Entrar". JWT do localStorage (`token`, `oidc.user:*`) sozinho **não é suficiente** porque o app sempre passa por SSO antes de checar localStorage.

**Sintoma:**
```javascript
const next = document.getElementById('__next');
const isExpired = next && next.innerText.length < 300 && next.innerText.startsWith('Perfil');
```

**Regra:** se Chrome dedicado foi spawned com `--restore-last-session` (passo 1 do Setup), TGC persiste entre kills do Chrome — sessão sobrevive. Se mesmo assim aparecer o modal, JWT do localStorage expirou (Hotmart: 48h após login). Dispare a Pergunta 7 pra re-login HITL.

**Validação empírica (2026-05-06):** com `--restore-last-session`, kill via `pkill -TERM` + relaunch preservou TGC, JSESSIONID, hmSsoSessionState. Sem a flag, todos sumiam → forçava re-login. Confirmado em 2 relaunches consecutivos.

### 11. ffmpeg paralelo lendo do mesmo SSD USB → falhas silenciosas

4 workers ffmpeg lendo simultâneamente arquivos grandes (>500MB) de SSD USB causou 4/83 falhas com **stderr vazio e exit code != 0** no curso Pedro Adão (2026-05-06). O retry sequencial (1 worker) recuperou todos sem mudar uma vírgula no comando. Diagnóstico: contenção de I/O do barramento USB satura buffer/timeout do ffmpeg quando múltiplos readers competem por sequencial-read em arquivos contíguos grandes.

**Regra:** pra extração de MP3 em batch (Fase 2 do modo vídeo, ou processamento de cursos já-baixados):
- Se origem é **SSD interno NVMe**: 4 workers seguros (I/O headroom enorme).
- Se origem é **SSD USB ou HD externo**: 2 workers no máximo, ou sequencial pra batches grandes (>50 arquivos).
- **Sempre tenha um retry sequencial das falhas** mesmo com stderr vazio — provavelmente vão passar.

### 12. Use case: processar curso já-baixado (sem CDP)

Usuário pode invocar `/extrair-curso` apontando pra um diretório local de MP4s já baixados (backup antigo, download de outra ferramenta). Nesse caso, **pule todo o setup de Chrome/CDP e fast-paths** — a captura via stream m3u8 não se aplica.

**Fluxo reduzido:**
1. Walk recursivo do diretório raiz, listar `*.mp4` (e PDFs/PNGs/DOCs como materiais)
2. Pular pra Fase 2 da skill: extração de MP3 com ffmpeg
3. Pular pra "Fase 2.5": transcrição via `transcribe.sh`
4. Gerar `index.md` espelhando hierarquia original do disco

**Detecção:** se o argumento de `/extrair-curso` é um path absoluto que existe localmente (`Path(arg).is_dir()`), não tente parsear como URL. Pergunte: "Detectei diretório local com N MP4s — você quer extrair áudio + transcrever (sem CDP)?"

**Output split (default validado em campo, 2026-05-06):** ao processar curso de SSD externo, sempre:
- **MP4 + MP3 + SRT ficam no SSD** — mídia pesada, MP4 raramente reabre, MP3 só serve pra re-transcrever, SRT auto-load só vale ao lado do MP4. Copiar pro disco interno é redundância sem ganho.
- **JSON + MD + materiais (PDFs/PNGs/DOCs/XLSX/CSV/PPTX) sempre vão pra `~/cursos/<slug>/`**. JSON+MD é leve (~20MB pra curso longo) e essencial pro estudo/LLM. Materiais (~15-50MB típico) são consultados durante estudo — copiá-los local torna o curso 100% utilizável sem o SSD montado, e o `index.md` com paths relativos vira self-contained.
- **Comando:** `rsync -a --include='*/' --include='*.pdf' --include='*.png' --include='*.jpg' --include='*.jpeg' --include='*.docx' --include='*.xlsx' --include='*.csv' --include='*.pptx' --exclude='*' "<ssd-root>/" "~/cursos/<slug>/"` — preserva hierarquia, traz só os materiais.
- **NUNCA copie MP3/SRT/MP4 pro disco interno por default.** Se transcrição ainda não rodou e você precisa MP3 temporário, gere ele no SSD ao lado do MP4. Após a Fase 2, o MP3 vira redundante — só serve pra re-rodar Voxtral com outro modelo.

**Anti-pitfall:** `transcribe.sh` pode escrever MP3 temporário (preprocessing ffmpeg) e SRT no diretório de output JSON. Sempre rode `find ~/cursos/<slug>/ \( -name '*.mp3' -o -name '*.srt' \) -delete` no fim do pipeline pra limpar artefatos órfãos. Verifique com `find ~/cursos/<slug>/ -type f | awk -F. '{print $NF}' | sort | uniq -c` que só sobraram extensões esperadas (md, json, pdf, png, etc).

**Layout final por módulo, NÃO por cohort/snapshot (pitfall validado em campo, 2026-05-06):** quando o curso tem múltiplos snapshots ou cohorts da mesma estrutura (ex: backup com pastas "Curso N1", "Curso N2", ... cada uma com módulos `01-`, `02-`, ...), espelhar essa estrutura em `~/cursos/<slug>/` cria 28+ pastas de top-level que dificultam navegação. **Default:** colapsar pra layout por módulo:

```
~/cursos/pedro-adao/
├── index.md
├── 01-start-here/
│   ├── 01-introduction-challenge_course--c03.{json,md}
│   ├── 01-introduction-challenge_course--c04.{json,md}
│   └── workbook.pdf            # materiais deduplicados por md5
├── 04-challenge-design/
│   ├── 01-design_2--c05.{json,md}
│   ├── 02-design_3--c04.{json,md}
│   └── 05-challenge-design.pdf
├── 10-bonuses/
│   ├── 04-MOVEMENT MAKER MOVIES/   # submódulos preservados quando úteis
│   │   └── ...
│   └── 05-Jump Start June/
│       └── ...
└── 11-crush-it-live/
    └── ...
```

**Naming convention:**
- Transcrição: `<numero>-<titulo-original>--c<XX>.{json,md}` onde `<XX>` é o cohort/snapshot (zero-padded). Sufixo `--c<XX>` permite ordenar por número da aula sem misturar cohorts.
- Material: `<numero>-<nome-original>.<ext>` sem sufixo de cohort. Dedupe por md5 antes de mover (PDFs idênticos em múltiplos snapshots são comuns; manter só 1).
- Submódulos (sub-pastas dentro de um módulo): preserve quando organizam material (ex: `10-BONUSES/03-TRAINING VIDEOS/`, `11-Crush It LIVE/01-Day 1/`). NÃO preserve sub-pastas de aluno individual ou de cohort.

**Detecção de "múltiplos snapshots/cohorts":** se ao escanear `<src-dir>` você ver ≥3 pastas de top-level com mesmo prefixo (`<curso> 1`, `<curso> 2`, `<curso> 3`, ...) e estrutura interna semelhante, **assuma snapshots do mesmo curso**. Confirme com user via `AskUserQuestion` antes de colapsar — pode ser que sejam cursos diferentes que só tem nomes parecidos (raro). Layout por módulo deve ser default; layout espelhado só se user explicitamente preferir snapshots separados.

### 13. Não mostre log inteiro de falhas (visualização)

Quando `transcribe-progress.json` acumula 50+ falhas com payloads de erro repetitivos (todas 429), `cat ... | python -m json.tool` despeja milhares de linhas no contexto. Use sempre filtro Python compacto:

```bash
cat progress.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"{d['done']}/{d['total']} ok={d['ok']} fail={d['fail']}\"); [print('FAIL:',f['file'][:80],'::',f['error'][:80]) for f in d['failures'][:5]]"
```

Truncar arquivo a 80 chars + erro a 80 chars + máx 5 falhas = output cabe em ~10 linhas. **Pitfall importante pra wakeups longos** — output de status deve ser conciso ou queima cache rapidamente.

### 14. Módulos colapsáveis no Hotmart Club: aulas escondidas até clicar no botão de módulo

Alguns cursos no Hotmart Club (validado em **Content Machine 3.0** em 2026-05-06) têm **módulos colapsáveis**. Aulas dentro dos módulos NÃO aparecem como `<a href="/content/...">` no DOM até o botão de módulo ser clicado. Discovery padrão (`document.querySelectorAll('a[href*="/content/"]')`) retorna 0 aulas e o curso parece "vazio" — falsa negativa silenciosa.

**Sintoma:** curso com 10 aulas reais aparece com `Aulas: 0` no discovery. Inspeção manual mostra 3 botões com texto tipo `"11. Acesse o Content Machine0%"` (módulo `1` + título `1. Acesse...` concatenados).

**Detecção:** botões cujo `textContent.trim().replace(/\s+/g, '')` casa com regex `/^\d+\d+\.\s*/` ou `/^\d+\d+\.[A-Za-zÀ-ÿ]/`.

**Fix:** **chamar `btn[reactPropsKey].onClick()`** (NÃO `btn.click()` — não dispara handler React em alguns componentes). `reactPropsKey` é a chave do botão começando com `__reactProps`:

```javascript
const moduleButtons = [...document.querySelectorAll('button')].filter(b =>
  /^\d+\d+\./.test(b.textContent.trim().replace(/\s+/g, ''))
);
for (const m of moduleButtons) {
  const reactKey = Object.keys(m).find(k => k.startsWith('__reactProps'));
  if (reactKey) m[reactKey].onClick();
}
```

Aguarde 2s pra re-render dos `<a>` dentro dos módulos antes de listar.

**Implementado em `scripts/discover-courses.sh`** via função `expand_collapsible_modules` chamada antes de listar links. Idempotente: se a página não tem módulos colapsáveis, retorna 0 e o fluxo segue normal.

### 15. CDP_PORT_FILE não herda em subshells do `bash -c`

`pool-runner.sh` executa cada job via `bash -c "$cmd"` que cria subshell limpo, **sem env exportada do parent**. Workers que dependem de `CDP_PORT_FILE` (worker-extract-lesson.sh, text-aula-extract.sh) falham imediatamente exit=2 com "CDP_PORT_FILE não setada", mesmo o parent shell tendo exportado a variável.

Sintoma observado em campo: pool-runner com 7 jobs todos falhando exit=2 em <1s, sem nenhum download iniciar.

**Fix:** workers devem ter **fallback default** apontando pro path padrão do Chrome dedicado, em vez de exigir env explícita:

```bash
export CDP_PORT_FILE="${CDP_PORT_FILE:-$HOME/.cache/extrair-curso/chrome-profile/DevToolsActivePort}"
[[ ! -s "$CDP_PORT_FILE" ]] && { echo "Chrome dedicado não rodando — chame spawn-or-attach-chrome.sh primeiro" >&2; exit 2; }
```

Aplicado em: `worker-extract-lesson.sh`, `text-aula-extract.sh`, `discover-courses.sh`. **Hotmart-extract.sh não precisa** porque não usa CDP diretamente (só curl + ffmpeg).

**Por que fallback é melhor que `pool-runner` exportar:** o spawn-or-attach-chrome.sh sempre cria o profile no path padrão `~/.cache/extrair-curso/chrome-profile/`, então fallback é determinístico. Forçar o pool-runner a propagar env complica o script e ainda falha se rodar fora do batch (ex: worker chamado direto pelo Claude main thread).

### 16. MP4 parciais corrompidos passam silenciosos pra fase de transcrição

Quando o pool de download é morto via `pkill` no meio (race condition, user cancel, novos jobs adicionados que invalidam download em curso), MP4s ficam com **poucos KB** (header sem moov atom). Esses arquivos parecem válidos no `find . -name '*.mp4'` e são incluídos no `transcribe-jobs.txt`, mas:

- ffmpeg falha com `moov atom not found` → MP3 não gerado → transcribe.sh crash
- Job inteiro do pool fica `fail` exit=1, mas a causa raiz é MP4 corrupto (não 429 ou rede)

Validado em 2026-05-06: 2 MP4 corruptos (11MB + 28MB com header truncado) deixaram pool-transcribe falhar 2/20 jobs sem motivo aparente.

**Fix duplo:**
1. **Trap em workers de download** (`worker-extract-lesson.sh`, `hotmart-extract.sh`) pra remover MP4 < 1MB em SIGTERM/SIGINT/erro:
   ```bash
   cleanup_partial() {
     local size=$(stat -f %z "$OUT" 2>/dev/null || stat -c %s "$OUT" 2>/dev/null || echo 0)
     [[ "$size" -lt 1000000 ]] && rm -f "$OUT"
   }
   trap cleanup_partial INT TERM
   ```
2. **Validação anti-corrupção ao gerar `transcribe-jobs.txt`:** rodar `ffprobe -v error -show_entries format=duration` em cada MP4 antes de incluir. Inválidos vão pra retry-download list (re-baixar) em vez de transcrever.

**Workaround manual** se já tem MP4 corrupto na pasta: copiar versão válida de outra extração (ex: outro curso que linka o mesmo `mediaCode`), OU re-baixar via `worker-extract-lesson.sh`.
