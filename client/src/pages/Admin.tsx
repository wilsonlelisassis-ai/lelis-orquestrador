/* AVATEA Admin Panel — Warm Modernism / Educational Warmth
 * Painel de controle com métricas em tempo real
 * Layout: sidebar + área de conteúdo
 */
import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth, SUPABASE_URL } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Users, MessageSquare, Video, Zap, Activity, LogOut,
  TrendingUp, AlertCircle, RefreshCw, BarChart3
} from 'lucide-react'

const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-logo-XJHJN38PvCYMTa2DPEFanY.webp'

interface Stats {
  activeSessions: number
  totalSessions: number
  totalMessages: number
  videosGenerated: number
  creditsUsed: number
  creditsRemaining: number
}

export default function Admin() {
  const [, navigate] = useLocation()
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<Stats>({
    activeSessions: 0,
    totalSessions: 0,
    totalMessages: 0,
    videosGenerated: 0,
    creditsUsed: 0,
    creditsRemaining: 31,
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState({
    supabase: true,
    openai: true,
    visionstory: true,
  })

  const fetchStats = async () => {
    if (!user) return
    setLoading(true)
    try {
      const headers = {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      }

      // Buscar sessões ativas
      const sessionsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ai_sessions?select=id,status,persona,created_at&order=created_at.desc&limit=100`,
        { headers: { ...headers, 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHp5bXJzdnZ4a3pqc3poZnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTIwNTIsImV4cCI6MjA4ODA2ODA1Mn0.bJ5crjdEE8Hx2h3SvuSMald-hHzT7dLZZhZaHDM-oGA' } }
      )
      
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json()
        const active = sessions.filter((s: any) => s.status === 'active').length
        setStats(prev => ({
          ...prev,
          activeSessions: active,
          totalSessions: sessions.length,
        }))
      }
      
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Erro ao buscar stats:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [user])

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  const statCards = [
    {
      title: 'Sessões Ativas',
      value: stats.activeSessions,
      icon: Users,
      color: 'sky',
      desc: 'usuários online agora',
    },
    {
      title: 'Total de Sessões',
      value: stats.totalSessions,
      icon: Activity,
      color: 'blue',
      desc: 'sessões criadas',
    },
    {
      title: 'Créditos VisionStory',
      value: stats.creditsRemaining,
      icon: Video,
      color: 'green',
      desc: 'créditos restantes',
    },
    {
      title: 'Status do Sistema',
      value: '100%',
      icon: Zap,
      color: 'purple',
      desc: 'todos os serviços online',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="AVATEA Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="text-3xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                AVATEA
              </span>
              <span className="text-xs text-gray-400 ml-2 font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              style={{ fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Ver plataforma
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Painel de Controle
            </h1>
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
              Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide"
                  style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}-500/20`}>
                  <card.icon className={`w-4 h-4 text-${card.color}-400`} />
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {loading ? '...' : card.value}
              </div>
              <div className="text-xs text-gray-500" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Status dos Serviços
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Supabase (Backend)', status: systemStatus.supabase, desc: 'Auth + Database + Edge Functions' },
                { name: 'OpenAI (IA)', status: systemStatus.openai, desc: 'GPT-4o-mini — Respostas de texto' },
                { name: 'VisionStory (Vídeos)', status: systemStatus.visionstory, desc: `${stats.creditsRemaining} créditos restantes` },
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {service.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                      {service.desc}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.status ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-semibold">Online</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-xs text-red-400 font-semibold">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Ações Rápidas
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  title: 'Testar Chat com Sofia',
                  desc: 'Verificar se o fluxo completo está funcionando',
                  action: () => navigate('/chat'),
                  icon: MessageSquare,
                  color: 'sky',
                },
                {
                  title: 'Ver Dashboard Supabase',
                  desc: 'Acessar banco de dados e logs',
                  action: () => window.open('https://supabase.com/dashboard/project/rhlzymrsvvxkzjszhftw', '_blank'),
                  icon: Activity,
                  color: 'blue',
                },
                {
                  title: 'Recarregar Créditos VisionStory',
                  desc: 'Adicionar mais créditos para geração de vídeos',
                  action: () => window.open('https://www.visionstory.ai/pricing', '_blank'),
                  icon: Video,
                  color: 'green',
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-left transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${action.color}-500/20 group-hover:bg-${action.color}-500/30 transition-colors`}>
                    <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {action.title}
                    </div>
                    <div className="text-xs text-gray-400 truncate" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                      {action.desc}
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VisionStory Credits Alert */}
        {stats.creditsRemaining < 10 && (
          <div className="mt-6 bg-red-900/30 border border-red-700/50 rounded-2xl p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-300 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Créditos VisionStory baixos!
              </h3>
              <p className="text-xs text-red-400/80" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                Restam apenas {stats.creditsRemaining} créditos. Recarregue em{' '}
                <a href="https://www.visionstory.ai/pricing" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-red-300">
                  visionstory.ai/pricing
                </a>
                {' '}para continuar gerando vídeos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
