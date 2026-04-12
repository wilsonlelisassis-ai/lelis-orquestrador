/* AVATEA Profile — Futurismo Educacional / Tech Clarity
 * Página de perfil do usuário com dados, avatar inicial e opção de sair
 * Cores: azul claro sky, branco, cinza frio
 */
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, LogOut, User, Mail, Calendar, MessageSquare, BookOpen, Video } from 'lucide-react'

const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-logo-XJHJN38PvCYMTa2DPEFanY.webp'

export default function Profile() {
  const [, navigate] = useLocation()
  const { user, signOut } = useAuth()

  if (!user) {
    navigate('/login')
    return null
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  // Gerar iniciais do nome para o avatar
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  // Formatar data de criação
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Membro recente'

  return (
    <div className="min-h-screen bg-[#f0f8ff]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-sky-100 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="AVATEA Logo" className="w-10 h-10 object-contain" />
            <span className="text-4xl font-black text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
              AVATEA
            </span>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-semibold transition-colors"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao chat
          </button>
        </div>
      </header>

      <div className="container py-10 max-w-2xl mx-auto">
        {/* Card principal do perfil */}
        <div className="bg-white rounded-3xl shadow-lg border border-sky-100 overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-sky-400 to-sky-500" />

          {/* Avatar e nome */}
          <div className="px-8 pb-8">
            <div className="flex items-end gap-5 -mt-12 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-sky-500 shrink-0"
                style={{ fontFamily: 'Nunito, sans-serif' }}>
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {user.name || 'Usuário AVATEA'}
                </h1>
                <p className="text-gray-500 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                  Aluno da plataforma
                </p>
              </div>
            </div>

            {/* Dados do usuário */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl">
                <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nome</p>
                  <p className="text-gray-800 font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {user.name || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl">
                <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">E-mail</p>
                  <p className="text-gray-800 font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl">
                <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Membro desde</p>
                  <p className="text-gray-800 font-semibold capitalize" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card de atividade */}
        <div className="bg-white rounded-3xl shadow-lg border border-sky-100 p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Sua jornada de aprendizado
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: MessageSquare, label: 'Perguntas feitas', value: '—', color: 'sky' },
              { icon: Video, label: 'Vídeos assistidos', value: '—', color: 'green' },
              { icon: BookOpen, label: 'Matérias exploradas', value: '—', color: 'purple' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 text-${color}-500`} />
                </div>
                <div className="text-2xl font-black text-gray-800 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {value}
                </div>
                <div className="text-xs text-gray-400" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
            Histórico de atividades em breve
          </p>
        </div>

        {/* Ações */}
        <div className="bg-white rounded-3xl shadow-lg border border-sky-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Conta
          </h2>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/chat')}
              className="w-full h-12 bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold rounded-xl justify-start gap-3"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <MessageSquare className="w-4 h-4" />
              Ir para o chat com a Dra. Sofia
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full h-12 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl justify-start gap-3"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
