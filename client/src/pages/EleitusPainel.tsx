/**
 * EleitusPainel.tsx — Painel de Gerenciamento de Candidatos ELEITUS
 * Acesso: /eleitus/painel (requer login)
 */
import { useState, useRef } from 'react'
import { useLocation } from 'wouter'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'
import { getLoginUrl } from '@/const'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  CheckCircle,
  Upload,
  Mic,
  FileText,
  Play,
  Loader2,
  LogIn,
  Plus,
  ExternalLink,
  ChevronRight,
  Video,
  AlertCircle,
  Info,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EleitusPainel() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [, navigate] = useLocation()

  const [formNome, setFormNome] = useState('')
  const [formCargo, setFormCargo] = useState('')
  const [formPartido, setFormPartido] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formPacote, setFormPacote] = useState('teste')
  const [criandoCandidato, setCriandoCandidato] = useState(false)

  const [candidatoSelecionado, setCandidatoSelecionado] = useState<number | null>(null)
  const [voiceId, setVoiceId] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [uploadingIdle, setUploadingIdle] = useState(false)
  const [uploadingSpeaking, setUploadingSpeaking] = useState(false)
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [ativando, setAtivando] = useState(false)

  const idleInputRef = useRef<HTMLInputElement>(null)
  const speakingInputRef = useRef<HTMLInputElement>(null)
  const conteudoInputRef = useRef<HTMLInputElement>(null)

  const { data: candidatos, refetch: refetchCandidatos } = trpc.onboarding.getMeusCandidatos.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )
  const criarMutation = trpc.onboarding.criarCandidato.useMutation()
  const uploadVideoMutation = trpc.onboarding.uploadVideo.useMutation()
  const atualizarConfigMutation = trpc.onboarding.atualizarConfig.useMutation()
  const ativarMutation = trpc.onboarding.ativarCandidato.useMutation()

  const handleCriarCandidato = async () => {
    if (!formNome || !formSlug) {
      toast.error('Preencha o nome e o link personalizado.')
      return
    }
    setCriandoCandidato(true)
    try {
      const novo = await criarMutation.mutateAsync({
        nome: formNome,
        cargo: formCargo || undefined,
        partido: formPartido || undefined,
        slug: formSlug,
        pacote: formPacote,
      })
      toast.success(`Candidato ${formNome} criado com sucesso!`)
      setFormNome('')
      setFormCargo('')
      setFormPartido('')
      setFormSlug('')
      await refetchCandidatos()
      if (novo?.id) setCandidatoSelecionado(novo.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar candidato.'
      toast.error(msg)
    } finally {
      setCriandoCandidato(false)
    }
  }

  const handleUploadVideo = async (tipo: 'idle' | 'speaking', file: File) => {
    if (!candidatoSelecionado) return
    const setter = tipo === 'idle' ? setUploadingIdle : setUploadingSpeaking
    setter(true)
    try {
      const base64 = await fileToBase64(file)
      await uploadVideoMutation.mutateAsync({
        candidatoId: candidatoSelecionado,
        tipo,
        fileBase64: base64,
        mimeType: file.type || 'video/mp4',
      })
      toast.success(`Vídeo ${tipo === 'idle' ? 'de espera' : 'de fala'} enviado com sucesso!`)
      await refetchCandidatos()
    } catch {
      toast.error('Erro ao enviar vídeo. Tente novamente.')
    } finally {
      setter(false)
    }
  }

  const handleUploadConteudo = async (file: File) => {
    if (!candidatoSelecionado) return
    try {
      const text = await file.text()
      setConteudo(text)
      toast.success('Arquivo carregado! Revise e salve.')
    } catch {
      toast.error('Erro ao ler arquivo.')
    }
  }

  const handleSalvarConfig = async () => {
    if (!candidatoSelecionado) return
    setSalvandoConfig(true)
    try {
      await atualizarConfigMutation.mutateAsync({
        candidatoId: candidatoSelecionado,
        elevenLabsVoiceId: voiceId || undefined,
        conteudoRag: conteudo || undefined,
      })
      toast.success('Configurações salvas com sucesso!')
      await refetchCandidatos()
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSalvandoConfig(false)
    }
  }

  const handleAtivar = async () => {
    if (!candidatoSelecionado) return
    setAtivando(true)
    try {
      await ativarMutation.mutateAsync({ candidatoId: candidatoSelecionado })
      toast.success('Avatar ativado com sucesso! 🎉')
      await refetchCandidatos()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ativar.'
      toast.error(msg)
    } finally {
      setAtivando(false)
    }
  }

  const candidatoAtual = candidatos?.find((c) => c.id === candidatoSelecionado)
  const ehTeste = candidatoAtual?.pacote === 'teste'

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-black text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Painel ELEITUS</h1>
          <p className="text-slate-400 mb-6">Faça login para gerenciar seus candidatos</p>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Cabeçalho */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-lg font-black text-white">E</span>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ELEITUS</span>
          <span className="text-slate-500 text-sm">/ Painel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => navigate('/eleitus')}
          >
            Ver demonstração
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => navigate('/eleitus/interacoes')}
          >
            Interações dos Eleitores
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna esquerda */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Meus Candidatos
          </h2>

          <div className="space-y-2 mb-4">
            {candidatos?.length === 0 && (
              <p className="text-slate-500 text-sm">Nenhum candidato criado ainda.</p>
            )}
            {candidatos?.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCandidatoSelecionado(c.id)
                  setVoiceId(c.elevenLabsVoiceId ?? '')
                  setConteudo(c.conteudoRag ?? '')
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  candidatoSelecionado === c.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p className="text-slate-500 text-xs">{c.cargo ?? 'Sem cargo'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {c.status === 'active' ? 'Ativo' : 'Pendente'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Formulário novo candidato */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-900">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Novo Candidato
            </h3>
            <div className="space-y-2">
              <Input
                placeholder="Nome completo"
                value={formNome}
                onChange={(e) => {
                  setFormNome(e.target.value)
                  if (!formSlug) setFormSlug(slugify(e.target.value))
                }}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
              />
              <Input
                placeholder="Cargo (ex: Deputado Estadual)"
                value={formCargo}
                onChange={(e) => setFormCargo(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
              />
              <Input
                placeholder="Partido"
                value={formPartido}
                onChange={(e) => setFormPartido(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
              />
              <div>
                <Input
                  placeholder="Link: eleitus.com.br/seu-nome"
                  value={formSlug}
                  onChange={(e) => setFormSlug(slugify(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                />
                {formSlug && (
                  <p className="text-xs text-emerald-400 mt-1">eleitus.com.br/{formSlug}</p>
                )}
              </div>
              <select
                value={formPacote}
                onChange={(e) => setFormPacote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-md px-3 py-2"
              >
                <option value="teste">Teste — R$ 799 (50 santinhos)</option>
                <option value="starter">Starter — R$ 4.900</option>
                <option value="padrao">Padrão — R$ 9.900</option>
                <option value="avancado">Avançado — R$ 19.900</option>
              </select>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm"
                onClick={handleCriarCandidato}
                disabled={criandoCandidato}
              >
                {criandoCandidato ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Plus className="w-4 h-4 mr-1" /> Criar</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-2">
          {!candidatoAtual ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Video className="w-12 h-12 mb-3 opacity-30" />
              <p>Selecione ou crie um candidato para configurar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cabeçalho candidato */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{candidatoAtual.nome}</h2>
                  <p className="text-slate-400 text-sm">
                    {candidatoAtual.cargo} · {candidatoAtual.partido}
                  </p>
                </div>
                {candidatoAtual.status === 'active' && (
                  <a
                    href={`/eleitus/${candidatoAtual.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 text-sm hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver avatar
                  </a>
                )}
              </div>

              {/* Aviso pacote teste */}
              {ehTeste && (
                <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-semibold text-sm mb-1">Pacote Teste — Conteúdo Reduzido</p>
                    <p className="text-yellow-200/70 text-xs leading-relaxed">
                      O pacote teste inclui apenas <strong>2 realizações</strong> e <strong>ideais políticos básicos</strong>.
                      O avatar responderá perguntas simples sobre essas informações. Para um avatar completo,
                      que responde tudo e faz campanha de verdade, contrate um dos pacotes completos.
                      O valor pago no teste (<strong>R$ 799</strong>) é abatido do pacote completo se contratado em até 7 dias.
                    </p>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Vídeo Parado', ok: !!candidatoAtual.videoIdleUrl },
                  { label: 'Vídeo Falando', ok: !!candidatoAtual.videoSpeakingUrl },
                  { label: 'Voz Clonada', ok: !!candidatoAtual.elevenLabsVoiceId },
                  { label: 'Plataforma Política', ok: !!candidatoAtual.conteudoRag },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      item.ok
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-700 bg-slate-900 text-slate-500'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${item.ok ? 'text-emerald-400' : 'text-slate-700'}`} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Upload de vídeos */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-900">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Video className="w-5 h-5 text-emerald-400" />
                  Arquivos de Vídeo do Candidato
                </h3>
                <div className="flex items-start gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    São necessários <strong className="text-white">dois arquivos de vídeo</strong>, gravados em formato vertical (9:16), preferencialmente MP4:
                    <br />• <strong className="text-white">Vídeo Parado:</strong> candidato parado, respirando naturalmente, piscando os olhos — sem falar (aprox. 1 minuto)
                    <br />• <strong className="text-white">Vídeo Falando:</strong> candidato gesticulando, animado, como se estivesse explicando algo — sem áudio necessário (aprox. 1 minuto)
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vídeo Parado */}
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Vídeo Parado</p>
                    <p className="text-xs text-slate-500 mb-2">Candidato parado, respirando e piscando os olhos</p>
                    {candidatoAtual.videoIdleUrl && (
                      <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enviado com sucesso
                      </p>
                    )}
                    <input
                      ref={idleInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadVideo('idle', file)
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full"
                      onClick={() => idleInputRef.current?.click()}
                      disabled={uploadingIdle}
                    >
                      {uploadingIdle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {candidatoAtual.videoIdleUrl ? 'Substituir vídeo' : 'Enviar vídeo parado'}
                    </Button>
                  </div>

                  {/* Vídeo Falando */}
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Vídeo Falando</p>
                    <p className="text-xs text-slate-500 mb-2">Candidato gesticulando e animado, como se explicasse algo</p>
                    {candidatoAtual.videoSpeakingUrl && (
                      <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Enviado com sucesso
                      </p>
                    )}
                    <input
                      ref={speakingInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadVideo('speaking', file)
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full"
                      onClick={() => speakingInputRef.current?.click()}
                      disabled={uploadingSpeaking}
                    >
                      {uploadingSpeaking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {candidatoAtual.videoSpeakingUrl ? 'Substituir vídeo' : 'Enviar vídeo falando'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Voz Clonada */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-900">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-emerald-400" />
                  Arquivo de Voz do Candidato
                </h3>
                <div className="flex items-start gap-2 mb-3 p-3 bg-slate-800/50 rounded-lg">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Envie um <strong className="text-white">arquivo de áudio MP3 de aproximadamente 1 minuto</strong> com a voz natural do candidato falando claramente.
                    Quanto mais natural e expressiva a fala, melhor será a clonagem da voz.
                    Após o processamento, cole abaixo o código de identificação da voz gerado.
                  </p>
                </div>
                <Input
                  placeholder="Código de identificação da voz (ex: KihM4zo976HPY7seM9YQ)"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm"
                />
              </div>

              {/* Plataforma Política */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-900">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Plataforma Política — Ideias e Realizações
                </h3>
                {ehTeste && (
                  <div className="flex items-start gap-2 mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-200/80 leading-relaxed">
                      <strong>Pacote Teste:</strong> inclua apenas <strong>2 realizações principais</strong> e seus <strong>ideais políticos em até 5 linhas</strong>.
                      O avatar responderá apenas sobre essas informações. Para um avatar completo e detalhado, contrate o pacote completo.
                    </p>
                  </div>
                )}
                <p className="text-sm text-slate-400 mb-3">
                  {ehTeste
                    ? 'Cole aqui as 2 realizações e os ideais políticos do candidato (texto simples).'
                    : 'Propostas, realizações, ideias e posições políticas completas. Cole o texto ou importe um arquivo TXT.'}
                </p>
                <input
                  ref={conteudoInputRef}
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadConteudo(file)
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 mb-3"
                  onClick={() => conteudoInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar arquivo TXT
                </Button>
                <Textarea
                  placeholder={ehTeste
                    ? "Realizações:\n1. [Descreva a 1ª realização]\n2. [Descreva a 2ª realização]\n\nIdeais políticos:\n[Descreva brevemente sua visão política]"
                    : "Cole aqui as propostas, realizações e ideias do candidato..."}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={ehTeste ? 6 : 10}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm resize-none"
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={handleSalvarConfig}
                  disabled={salvandoConfig}
                >
                  {salvandoConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar configurações
                </Button>
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  onClick={handleAtivar}
                  disabled={
                    ativando ||
                    !candidatoAtual.videoIdleUrl ||
                    !candidatoAtual.videoSpeakingUrl ||
                    !voiceId
                  }
                >
                  {ativando ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {candidatoAtual.status === 'active' ? 'Reativar avatar' : 'Ativar avatar'}
                </Button>
              </div>

              {/* Link do avatar */}
              {candidatoAtual.status === 'active' && (
                <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-4">
                  <p className="text-sm text-emerald-400 font-semibold mb-1">
                    ✅ Avatar ativo! Compartilhe este link com os eleitores:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-white text-sm bg-slate-900 px-3 py-1.5 rounded-lg flex-1">
                      {window.location.origin}/eleitus/{candidatoAtual.slug}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/eleitus/${candidatoAtual.slug}`
                        )
                        toast.success('Link copiado!')
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
