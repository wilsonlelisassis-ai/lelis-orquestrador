/* AVATEA Chat — Simli como avatar principal (WebRTC lip sync + voz ElevenLabs)
 * Layout: Simli (Sofia animada) à direita + Quadro de texto à esquerda
 * Fundo: imagem estática da Sofia em repouso
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useAvatea, type Persona } from '@/hooks/useAvatea'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Send, Loader2, LogOut, Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Paperclip
} from 'lucide-react'
import { SimliClient, LogLevel } from 'simli-client'
import { QuadroRico } from '@/components/QuadroRico'

const SOFIA_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/sofia_oficial_55d08f52.jpg'
const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-logo-XJHJN38PvCYMTa2DPEFanY.webp'
const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-hero-bg-myHG3EArDenA7zz5iaKzmu.webp'

const PERSONAS: { id: Persona; name: string; title: string; photo?: string }[] = [
  { id: 'doutora_sofia', name: 'Dra. Sofia', title: 'Professora AVATEA', photo: SOFIA_PHOTO },
  { id: 'professor_joao', name: 'Prof. Tio Wilson', title: 'Em breve' },
  { id: 'medica_especialista', name: 'Vitória', title: 'Em breve' },
]

type SimliStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'

export default function Chat() {
  const [, navigate] = useLocation()
  const { user, signOut } = useAuth()
  const avatea = useAvatea()
  const [inputText, setInputText] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [simliStatus, setSimliStatus] = useState<SimliStatus>('idle')
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  // Refs para Simli WebRTC — o vídeo do Simli fica VISÍVEL
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const simliClientRef = useRef<SimliClient | null>(null)
  const simliStartedRef = useRef(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const recognitionRef = useRef<any>(null)

  const getSimliTokenMutation = trpc.avatar.getSimliToken.useMutation()
  const getSimliIceServersQuery = trpc.avatar.getSimliIceServers.useQuery(undefined, { enabled: false })

  // ── Inicializar SimliClient ──────────────────────────────────────────────
  const initSimli = useCallback(async () => {
    if (simliStartedRef.current) return
    if (!videoRef.current || !audioRef.current) return

    simliStartedRef.current = true
    setSimliStatus('connecting')

    try {
      const { sessionToken } = await getSimliTokenMutation.mutateAsync({ persona: 'doutora_sofia' })
      const iceResult = await getSimliIceServersQuery.refetch()
      const iceServers = iceResult.data?.iceServers ?? []

      const client = new SimliClient(
        sessionToken,
        videoRef.current,
        audioRef.current,
        iceServers,
        LogLevel.ERROR,
        'p2p'
      )

      simliClientRef.current = client

      client.on('start', () => {
        console.log('[Simli] ✅ Avatar conectado!')
        setSimliStatus('connected')
        const silence = new Uint8Array(6000).fill(0)
        client.sendAudioData(silence)
      })

      client.on('stop', () => {
        setSimliStatus('disconnected')
        simliStartedRef.current = false
      })

      client.on('error', (detail: string) => {
        console.error('[Simli] Erro:', detail)
        setSimliStatus('error')
        simliStartedRef.current = false
      })

      client.on('startup_error', (message: string) => {
        console.error('[Simli] Erro ao iniciar:', message)
        setSimliStatus('error')
        simliStartedRef.current = false
      })

      client.on('speaking', () => setIsSpeaking(true))
      client.on('silent', () => setIsSpeaking(false))

      await client.start()
    } catch (err) {
      console.error('[Simli] Falha ao iniciar:', err)
      setSimliStatus('error')
      simliStartedRef.current = false
      toast.error('Não foi possível conectar o avatar. Tente reconectar.')
    }
  }, [getSimliTokenMutation])

  const reconnectSimli = useCallback(async () => {
    if (simliClientRef.current) {
      await simliClientRef.current.stop()
      simliClientRef.current = null
    }
    simliStartedRef.current = false
    setSimliStatus('idle')
    setTimeout(() => initSimli(), 500)
  }, [initSimli])

  useEffect(() => {
    if (user && videoRef.current && audioRef.current) {
      initSimli()
    }
    return () => {
      if (simliClientRef.current) {
        simliClientRef.current.stop().catch(() => {})
        simliClientRef.current = null
      }
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Falar via ElevenLabs MP3 → Simli faz lip sync com o áudio ──────────
  const speakWithSimli = useCallback(async (text: string, audioBase64: string | null) => {
    if (isMuted) return
    setIsSpeaking(true)

    // Prioridade 1: ElevenLabs MP3 → tocar no <audio> HTML (voz real)
    // E simultaneamente enviar PCM16 ao Simli para sincronizar a boca
    if (audioBase64 && audioRef.current) {
      try {
        const binaryStr = atob(audioBase64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)

        // 1a) Tocar MP3 no <audio> HTML — voz real da Sofia
        const audio = audioRef.current
        audio.src = url
        audio.volume = 1.0
        audio.onended = () => { URL.revokeObjectURL(url); setIsSpeaking(false) }
        audio.onerror = () => { URL.revokeObjectURL(url); setIsSpeaking(false) }
        await audio.play()
        console.log('[ElevenLabs] Tocando MP3 da Sofia')

        // 1b) Simultaneamente: converter MP3 → PCM16 → enviar ao Simli para lip sync
        if (simliClientRef.current && simliStatus === 'connected') {
          try {
            const audioCtx = new AudioContext({ sampleRate: 16000 })
            const arrayBuffer = await blob.arrayBuffer()
            const decoded = await audioCtx.decodeAudioData(arrayBuffer)

            const targetSampleRate = 16000
            const sourceSampleRate = decoded.sampleRate
            const channelData = decoded.getChannelData(0)
            let samples: Float32Array

            if (sourceSampleRate !== targetSampleRate) {
              const ratio = sourceSampleRate / targetSampleRate
              const outputLength = Math.floor(channelData.length / ratio)
              samples = new Float32Array(outputLength)
              for (let i = 0; i < outputLength; i++) {
                const srcIdx = i * ratio
                const idx = Math.floor(srcIdx)
                const frac = srcIdx - idx
                samples[i] = (channelData[idx] ?? 0) + frac * ((channelData[idx + 1] ?? channelData[idx] ?? 0) - (channelData[idx] ?? 0))
              }
            } else {
              samples = channelData
            }

            const pcm16 = new Int16Array(samples.length)
            for (let i = 0; i < samples.length; i++) {
              pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)))
            }

            const chunkSize = 6000
            const pcmBytes = new Uint8Array(pcm16.buffer)
            for (let offset = 0; offset < pcmBytes.length; offset += chunkSize) {
              simliClientRef.current.sendAudioData(pcmBytes.slice(offset, offset + chunkSize))
            }
            await audioCtx.close()
            console.log(`[Simli] PCM16 enviado para lip sync (${pcm16.length} samples)`)
          } catch (pcmErr) {
            console.warn('[Simli PCM] Erro ao enviar PCM (lip sync desativado):', pcmErr)
          }
        }
        return
      } catch (err) {
        console.error('[ElevenLabs] Erro ao tocar MP3:', err)
      }
    }

    // Fallback final: Web Speech API
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.88
    utterance.pitch = 1.15
    utterance.volume = 1.0
    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const ptFemale = voices.find(v =>
        v.lang.startsWith('pt') &&
        (v.name.toLowerCase().includes('luciana') || v.name.toLowerCase().includes('vitoria') ||
         v.name.toLowerCase().includes('francisca') || v.name.toLowerCase().includes('female'))
      ) || voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.startsWith('pt'))
      if (ptFemale) utterance.voice = ptFemale
    }
    if (window.speechSynthesis.getVoices().length > 0) selectVoice()
    else window.speechSynthesis.onvoiceschanged = () => { selectVoice(); window.speechSynthesis.onvoiceschanged = null }
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [isMuted, simliStatus])

  useEffect(() => {
    if (avatea.error) {
      toast.error(avatea.error)
      avatea.clearError()
    }
  }, [avatea.error])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMB = 10
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxMB}MB`)
      return
    }
    setAttachedFile(file)
    toast.success(`Arquivo anexado: ${file.name}`)
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const handleSend = async () => {
    if (!inputText.trim() || avatea.isLoading) return
    const text = inputText.trim()
    setInputText('')
    setAttachedFile(null)
    const result = await avatea.sendMessage(text)
    if (result) {
      if (result.imageUrl) setCurrentImageUrl(result.imageUrl)
      else setCurrentImageUrl(null)
      await speakWithSimli(result.text, result.audioBase64)
    }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePersonaChange = (persona: Persona) => {
    const p = PERSONAS.find(x => x.id === persona)
    if (p?.title === 'Em breve') {
      toast.info(`${p.name} estará disponível em breve!`)
      return
    }
    avatea.setPersona(persona)
  }

  const handleSignOut = async () => {
    if (simliClientRef.current) await simliClientRef.current.stop().catch(() => {})
    signOut()
    navigate('/')
  }

  const toggleVoice = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      toast.error('Seu navegador não suporta reconhecimento de voz')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => { setIsListening(false); toast.error('Erro ao capturar voz.') }
      recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      setTimeout(async () => {
        const result = await avatea.sendMessage(transcript)
        setInputText('')
        if (result) {
          if (result.imageUrl) setCurrentImageUrl(result.imageUrl)
          else setCurrentImageUrl(null)
          await speakWithSimli(result.text, result.audioBase64)
        }
      }, 300)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const activePersona = PERSONAS.find(p => p.id === avatea.persona) || PERSONAS[0]
  const lastAssistantMsg = [...avatea.messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a1428' }}>

      {/* Fundo com imagem da sala de aula */}
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          opacity: 0.35,
        }}
      />
      <div className="fixed inset-0" style={{ background: 'rgba(10,20,40,0.65)', zIndex: 1 }} />

      {/* Áudio ElevenLabs — oculto */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'rgba(10,20,40,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(56,189,248,0.15)' }}
      >
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="AVATEA" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>AVATEA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-1">
              {PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePersonaChange(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    avatea.persona === p.id ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  } ${p.title === 'Em breve' ? 'opacity-40' : ''}`}
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/perfil')}
              className="w-8 h-8 rounded-lg bg-sky-500 hover:bg-sky-400 flex items-center justify-center text-white font-black text-xs transition-colors"
              title="Meu perfil"
            >
              {user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}
            </button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/40 hover:text-red-400 p-1.5">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== ÁREA PRINCIPAL: Quadro (esquerda) + Simli (direita) ===== */}
      <div className="relative z-10 flex-1 flex items-stretch" style={{ minHeight: 'calc(100vh - 56px - 76px)' }}>

        {/* ── QUADRO DE TEXTO (esquerda) ── */}
        <div
          className="flex-1 flex flex-col justify-center p-8"
          style={{ maxWidth: '55%' }}
        >
          {/* Moldura do quadro — simula um quadro branco/lousa */}
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.97)',
              border: '6px solid #8B6914',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(139,105,20,0.3)',
              minHeight: '60vh',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Barra superior do quadro */}
            <div
              style={{
                background: 'linear-gradient(90deg, #8B6914, #C9A227, #8B6914)',
                height: '12px',
                borderRadius: '0',
              }}
            />

            {/* Conteúdo do quadro — QuadroRico com markdown, LaTeX, código e imagens */}
            <div
              className="flex-1 overflow-y-auto p-8"
            >
              <QuadroRico
                content={lastAssistantMsg?.content || ''}
                imageUrl={currentImageUrl}
                isLoading={avatea.isLoading}
                onImageError={() => setCurrentImageUrl(null)}
              />
            </div>

            {/* Barra inferior do quadro */}
            <div
              style={{
                background: 'linear-gradient(90deg, #8B6914, #C9A227, #8B6914)',
                height: '12px',
              }}
            />
          </div>
        </div>

        {/* ── AVATAR SIMLI (direita) ── */}
        <div
          className="flex flex-col items-center justify-end"
          style={{ width: '45%', paddingBottom: '0' }}
        >
          {/* Vídeo do Simli — VISÍVEL, ocupa toda a altura disponível */}
          <div className="relative w-full h-full flex items-end justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                maxHeight: 'calc(100vh - 56px - 76px)',
              }}
            />

            {/* Badge de status */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(10,20,40,0.8)', backdropFilter: 'blur(8px)' }}
            >
              <div className={`w-2 h-2 rounded-full ${
                simliStatus === 'connected' ? (isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-green-400') :
                simliStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                simliStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              <span className="text-white text-xs font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {simliStatus === 'connected' ? (isSpeaking ? 'Falando...' : `${activePersona.name} — Online`) :
                 simliStatus === 'connecting' ? 'Conectando...' :
                 simliStatus === 'error' ? 'Erro — clique para reconectar' : 'Aguardando...'}
              </span>
              {(simliStatus === 'error' || simliStatus === 'disconnected') && (
                <button
                  onClick={reconnectSimli}
                  className="text-sky-400 hover:text-sky-300 text-xs underline ml-1"
                >
                  Reconectar
                </button>
              )}
            </div>

            {/* Controles flutuantes */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${
                  isMuted ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white/80 hover:bg-black/70'
                }`}
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => simliStatus !== 'connected' && simliStatus !== 'connecting' && reconnectSimli()}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-sm ${
                  simliStatus === 'connected' ? 'bg-green-500/40 text-green-300' : 'bg-black/50 text-white/30 hover:text-white/60'
                }`}
                title={`Avatar: ${simliStatus}`}
              >
                {simliStatus === 'connected' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BARRA DE INPUT ===== */}
      <div
        className="relative z-50 px-4 py-4"
        style={{ background: 'rgba(10,20,40,0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(56,189,248,0.2)' }}
      >
        <div className="container max-w-3xl mx-auto">
          {avatea.messages.filter(m => m.role === 'user').slice(-1).map(msg => (
            <div key={msg.id} className="text-xs text-white/30 truncate px-1 mb-1.5" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
              Você: {msg.content}
            </div>
          ))}
          {/* Arquivo anexado */}
          {attachedFile && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg bg-sky-500/20 border border-sky-500/30">
              <Paperclip className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-xs text-sky-300 truncate flex-1" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-white/40 hover:text-red-400 text-xs ml-1">×</button>
            </div>
          )}

          <div className="flex gap-2">
            {/* Input oculto de arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Botão de anexar arquivo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all bg-white/10 text-white/60 hover:bg-sky-500/30 hover:text-sky-400 border border-sky-900/40"
              title="Anexar arquivo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <Input
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎤 Ouvindo...' : `Pergunte algo para a ${activePersona.name}...`}
              disabled={avatea.isLoading || isListening}
              className="flex-1 h-11 rounded-xl bg-white/10 border-sky-900/40 text-white placeholder:text-white/30 focus:border-sky-500 focus:ring-sky-500"
              style={{ fontFamily: 'Source Sans 3, sans-serif' }}
            />
            <button
              onClick={toggleVoice}
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-white/60 hover:bg-sky-500/30 hover:text-sky-400 border border-sky-900/40'
              }`}
              title={isListening ? 'Parar' : 'Falar com a Sofia'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || avatea.isLoading}
              className="h-11 w-11 p-0 bg-sky-500 hover:bg-sky-400 rounded-xl shrink-0"
            >
              {avatea.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
