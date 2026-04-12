import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { trpc } from '@/lib/trpc'
import { Mic, Volume2, VolumeX, ChevronLeft, Send, Loader2 } from 'lucide-react'

export default function Eleitus() {
  const params = useParams<{ candidatoId?: string }>()
  const candidatoId = params.candidatoId || 'wilson-direita'

  const [pergunta, setPergunta]     = useState('')
  const [mensagens, setMensagens]   = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [mudo, setMudo]             = useState(false)
  const [gravando, setGravando]     = useState(false)
  const [falando, setFalando]       = useState(false)
  const [ultimaResposta, setUltimaResposta] = useState('')

  const idleVideoRef     = useRef<HTMLVideoElement>(null)
  const speakingVideoRef = useRef<HTMLVideoElement>(null)
  const audioRef         = useRef<HTMLAudioElement>(null)

  const { data: candidato } = trpc.eleitus.getCandidato.useQuery({ candidatoId })
  const askMutation = trpc.eleitus.askCandidato.useMutation()

  const tocarAudioTTS = useCallback((audioBase64: string) => {
    if (!audioRef.current || mudo) return
    const bytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
    audioRef.current.src = url
    audioRef.current.onplay = () => { setFalando(true); speakingVideoRef.current?.play().catch(() => {}) }
    audioRef.current.onended = () => { setFalando(false); speakingVideoRef.current?.pause(); if (speakingVideoRef.current) speakingVideoRef.current.currentTime = 0; URL.revokeObjectURL(url) }
    audioRef.current.play().catch(() => { setFalando(false) })
  }, [mudo])

  const enviar = async (texto: string) => {
    if (!texto.trim() || carregando) return
    setCarregando(true); setPergunta(''); setUltimaResposta('')
    try {
      const data = await askMutation.mutateAsync({ pergunta: texto.trim(), candidatoId, history: mensagens.slice(-4) })
      setMensagens(prev => [...prev, { role: 'user', content: texto.trim() }, { role: 'assistant', content: data.resposta }])
      setUltimaResposta(data.resposta)
      if (data.audioBase64) tocarAudioTTS(data.audioBase64)
    } catch (e) {
        console.error(e)
    } finally { setCarregando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 z-0">
        <video 
          ref={idleVideoRef} 
          src={candidato?.videoIdleUrl || "https://d257y8p2n2y66c.cloudfront.net/wilson_idle.mp4"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${falando ? 'opacity-0' : 'opacity-100'}`} 
          muted playsInline autoPlay loop 
        />
        <video 
          ref={speakingVideoRef} 
          src={candidato?.videoSpeakingUrl || "https://d257y8p2n2y66c.cloudfront.net/wilson_speaking.mp4"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${falando ? 'opacity-100' : 'opacity-0'}`} 
          muted playsInline loop 
        />
      </div>

      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => window.history.back()} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
          <ChevronLeft size={24} color="white" />
        </button>
        <div className="text-right">
          <h1 className="text-white font-black text-xl tracking-tighter uppercase">{candidato?.nome || 'Wilson Lelis'}</h1>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{candidato?.cargo || 'Candidato'}</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-6 flex flex-col gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {ultimaResposta && (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
            <p className="text-white text-lg font-medium leading-relaxed text-center">{ultimaResposta}</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full flex gap-3 items-center">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={pergunta} 
              onChange={(e) => setPergunta(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && enviar(pergunta)} 
              placeholder="Pergunte ao candidato..." 
              className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl py-4 px-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all" 
            />
            <button 
              onClick={() => enviar(pergunta)} 
              disabled={carregando || !pergunta.trim()} 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              {carregando ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <button className={`p-4 rounded-2xl backdrop-blur-2xl border transition-all active:scale-90 bg-white/10 border-white/20 hover:bg-white/20`}>
            <Mic size={24} color="white" />
          </button>
          <button onClick={() => setMudo(!mudo)} className="p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all active:scale-90">
            {mudo ? <VolumeX size={24} color="white" /> : <Volume2 size={24} color="white" />}
          </button>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
