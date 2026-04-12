# AVATEA — Project TODO

## Concluído
- [x] Landing page com Dra. Sofia e design sky-blue futurista
- [x] Login e cadastro de usuários (Supabase Auth)
- [x] Página de perfil do usuário
- [x] Painel admin (/admin)
- [x] Logo futurista gerada e aplicada em todas as páginas
- [x] Nome AVATEA dobrado no header
- [x] Paleta de cores: laranja → azul claro sky em todo o projeto
- [x] Edge Function generate-avatar-video deployada no Supabase
- [x] Voz da Sofia clonada do vídeo original
- [x] Avatar da Sofia criado no VisionStory
- [x] Backend Express + tRPC instalado (web-db-user)
- [x] avatarRouter.ts criado com endpoints: createSession, sendMessage, generateVideo, checkVideoStatus
- [x] useAvatea.ts reescrito para usar tRPC (sem chamadas diretas do browser ao Supabase)
- [x] Correção de bug: token expirado causava Failed to fetch
- [x] Correção de bug: variável user duplicada no Home.tsx

## Em andamento
- [ ] Testar fluxo completo com novo hook tRPC (Wilson precisa testar)

## Pendente
- [ ] Histórico de conversas salvo por usuário no banco
- [ ] Rota /admin protegida apenas para e-mail do dono
- [ ] Notificação sonora quando vídeo ficar pronto
- [ ] Publicar o site (Publish button)

## Prioridade máxima (Wilson aguardando)
- [x] Corrigir player de vídeo — Sofia deve aparecer falando na tela após enviar mensagem
- [x] Vídeo de boas-vindas da Sofia ao entrar no chat (aparece imediatamente)
- [x] Testar fluxo completo e publicar

## Pedidos do Wilson (08/03/2026)
- [ ] Sofia de corpo inteiro no vídeo (não só busto)
- [ ] Quadro ao lado da Sofia com as respostas escritas de forma bonita
- [ ] Braço da Sofia apontando para o quadro
- [ ] Interação por voz — microfone para o usuário falar com a Sofia
- [x] Quadro permanente sempre visível com respostas escritas de forma bonita
- [x] Sofia de corpo inteiro à esquerda em cenário de sala de aula
- [x] Animação do braço apontando para o quadro quando ela responde
- [x] Vídeo do rosto sobreposto no corpo quando ela fala

## Correções urgentes (08/03 22h)
- [x] Quadro branco (não verde)
- [x] Sofia quase inteira na tela (não só busto)
- [x] Braço da Sofia apontando para o quadro quando explica
- [x] Vídeo gerado com o texto EXATO da resposta do chat (não texto genérico)
- [x] Sofia não repete falas genéricas — fala o que foi perguntado

## Integração Simli (09/03/2026)
- [x] Substituir VisionStory por Simli WebRTC para avatar em tempo real
- [x] Backend: avatarRouter com getSimliToken (faceId: d23a6786-c0f6-4a94-a305-bacccf621684)
- [x] Backend: getSimliIceServers e sendMessage com LLM
- [x] Frontend: SimliClient WebRTC com lip sync via Web Speech API
- [x] Testes unitários do avatarRouter (13 testes passando)
- [x] Foto base da Sofia visível enquanto Simli carrega (transição suave)
- [x] Botão de reconectar quando avatar desconecta
- [x] Indicador de status da conexão WebRTC (idle/connecting/connected/error)

## Correções urgentes (09/03/2026 — Wilson)
- [x] Voz da Sofia: usar voz feminina pt-BR (espeak-ng no servidor, sem voz masculina)
- [x] Avatar animado: enviar PCM16 real ao SimliClient para ativar lip sync e movimentos
- [ ] Braço apontando para o quadro com movimento real (não só emoji CSS)
- [ ] Latência: reduzir tempo de resposta (atualmente ~20s)

## TTS PCM16 Real (09/03/2026)
- [x] Backend: endpoint generateTTS usando espeak-ng + ffmpeg → PCM16 @ 16kHz
- [x] Backend: sendMessage agora inclui audioBase64 (PCM16) na resposta
- [x] Frontend: speakWithSimli envia PCM16 real ao SimliClient.sendAudioData() → lip sync ativo
- [x] Frontend: fallback Web Speech API com voz feminina pt-BR quando Simli não conectado
- [x] Testes: 18 testes passando (incluindo mock de child_process para TTS)

## Correções urgentes Wilson (09/03 — rápido e certeiro)
- [x] Fundo colorido de sala de aula cobrindo 100% da tela (imagem existente do HERO_BG)
- [x] Quadro branco sobreposto ao fundo (chat + explicações)
- [x] Remover espeak-ng (voz robótica) — usar Web Speech API com voz feminina pt-BR

## ElevenLabs + Sofia solta (09/03)
- [x] Configurar ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID como secrets de ambiente
- [x] Backend: TTS via ElevenLabs API → MP3 → PCM16 via ffmpeg integrado no sendMessage
- [x] Backend: sendMessage retorna audioBase64 PCM16 para lip sync real no Simli
- [x] Frontend: Sofia solta em pé (sem moldura circular), corpo inteiro visível
- [x] Frontend: braço apontando para o quadro com animação CSS
- [x] Frontend: speakWithSimli envia PCM16 real ao SimliClient.sendAudioData()
- [x] Testes: 12 testes passando

## Cronograma Wilson (10/03/2026 — uma tarefa por vez)
- [x] Tarefa 1: Voz ElevenLabs com Voice ID correto da Sofia (q81ICgNRffaGt46pm9ve)
- [ ] Tarefa 2: Microfone de volta (reconhecimento de voz)
- [ ] Tarefa 3: Reduzir delay de resposta
- [ ] Tarefa 4: Integrar vídeos do Runway nos momentos certos

## Correções sequenciais Wilson (10/03 - tarde)
- [x] Tarefa 2: Foto da Sofia solta em frente ao quadro (sem moldura, sem vídeo Simli na frente)
- [ ] Tarefa 3: Voz ElevenLabs direta no browser (Audio element, não Simli sobrescrevendo)
- [ ] Tarefa 4: Lip sync / boca correta (sem caricatura)
- [ ] Tarefa 5: Reduzir delay (paralelizar LLM + TTS)

## Vídeo Runway + Voz ElevenLabs (10/03 - agora)
- [ ] Upload vídeo Runway da Sofia para CDN e substituir foto estática
- [ ] Sincronizar voz ElevenLabs com o vídeo (tocar áudio MP3 diretamente no browser)

## Reestruturação Layout Chat (09/03/2026 — continuação)
- [x] Vídeo sofia-apontando.mp4 como fundo full-screen (position: fixed, objectFit: cover)
- [x] Remover quadro HTML/CSS criado por código
- [x] Texto das respostas sobreposto na área direita do vídeo (onde fica o quadro branco)
- [x] Microfone na barra de input (já estava presente, confirmado)
- [x] Controles flutuantes (som, status Simli) no canto inferior esquerdo
- [ ] Ajustar posição do overlay de texto para coincidir exatamente com o quadro do vídeo (testar visualmente)

## Upload de Arquivo (11/03/2026)
- [x] Adicionar botão de upload de arquivo na barra de input do chat (clipe, aceita PDF/DOC/TXT/imagens até 10MB)

## Imagens no Quadro (12/03/2026)
- [x] Exibir imagem gerada por IA no quadro quando a pergunta pedir ilustração (detectImageRequest + generateImage + exibição no quadro)

## Quadro Rico - Nano Banana Style (12/03/2026)
- [x] Instalar react-markdown, KaTeX, react-syntax-highlighter
- [x] Criar componente QuadroRico com markdown, LaTeX, código e imagens
- [x] Renderizar markdown no quadro (negrito, listas, títulos, tabelas, blockquotes)
- [x] Renderizar equações matemáticas com KaTeX (ex: y = x², integrais, frações)
- [x] Renderizar blocos de código com syntax highlight (Python, JS, etc.)
- [x] Exibir imagens geradas por IA no quadro
- [x] Backend retorna imageUrl quando pergunta pede ilustração
- [ ] Integrar vídeo da Sofia (quando Wilson entregar) ao lado do quadro

## ELEITUS — Migração para publicação permanente (15/03/2026)
- [x] Copiar páginas Eleitus.tsx, EleitusPainel.tsx, EleitusInteracoes.tsx para avatea-web
- [x] Copiar eleituRouter.ts e onboardingRouter.ts para avatea-web/server/
- [x] Atualizar schema.ts com tabelas candidatos, interacoes, santinhos
- [x] Atualizar db.ts com funções do ELEITUS
- [x] Atualizar routers.ts com eleitus, onboarding, interacoes, santinho
- [x] Atualizar App.tsx com rotas /eleitus, /eleitus/painel, /eleitus/interacoes
- [x] Instalar qrcode.react
- [x] Verificar que /eleitus carrega corretamente (HTTP 200)
- [x] Verificar que API /api/trpc/eleitus.getCandidato responde (HTTP 200)
- [ ] Salvar checkpoint e publicar com link permanente
# ELEITUS integrado - build Sun Mar 15 15:10:27 EDT 2026
