/* AVATEA Login — Futurismo Educacional / Tech Clarity
 * Fundo: hero classroom, formulário centralizado com card branco
 * Cores: azul claro sky, branco, cinza frio
 */
import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, BookOpen } from 'lucide-react'

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-hero-bg-myHG3EArDenA7zz5iaKzmu.webp'
const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-logo-XJHJN38PvCYMTa2DPEFanY.webp'

export default function Login() {
  const [, navigate] = useLocation()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          toast.error(error)
        } else {
          navigate('/chat')
        }
      } else {
        if (!name.trim()) {
          toast.error('Por favor, informe seu nome')
          return
        }
        const { error } = await signUp(email, password, name)
        if (error) {
          toast.error(error)
        } else {
          toast.success('Conta criada! Verifique seu e-mail para confirmar.')
          setMode('login')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero Image */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/50 to-slate-900/40" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO} alt="AVATEA Logo" className="w-12 h-12 object-contain" />
            <span className="text-3xl font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>AVATEA</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Aprendizado com<br />
            <span className="text-sky-300">Inteligência Artificial</span>
          </h2>
          <p className="text-lg text-white/80 max-w-md" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
            Converse com professores virtuais que respondem com vídeos personalizados. 
            Aprenda no seu ritmo, com a Dra. Sofia e outros especialistas.
          </p>
          <div className="flex gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-black text-sky-300">3</div>
              <div className="text-sm text-white/70">Avatares</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-sky-300">24/7</div>
              <div className="text-sm text-white/70">Disponível</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-sky-300">IA</div>
              <div className="text-sm text-white/70">Personalizada</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f0f8ff]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={LOGO} alt="AVATEA Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>AVATEA</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-sky-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <span className="text-sm font-semibold text-sky-500 uppercase tracking-wide">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar conta'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {mode === 'login' ? 'Entrar na plataforma' : 'Comece a aprender'}
            </h1>
            <p className="text-gray-500 mb-8" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
              {mode === 'login'
                ? 'Acesse sua conta para continuar aprendendo.'
                : 'Crie sua conta e comece a conversar com a Dra. Sofia.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-semibold mb-1.5 block">
                    Seu nome
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Como posso te chamar?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-sky-400 focus:ring-sky-400"
                    required
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="email" className="text-gray-700 font-semibold mb-1.5 block">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 focus:border-sky-400 focus:ring-sky-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 font-semibold mb-1.5 block">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 focus:border-sky-400 focus:ring-sky-400"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold text-base rounded-xl"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aguarde...</>
                ) : mode === 'login' ? (
                  'Entrar'
                ) : (
                  'Criar minha conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">
                {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              </span>
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sky-500 font-semibold text-sm hover:text-sky-600"
              >
                {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
