/* AVATEA Landing Page — Futurismo Educacional / Tech Clarity
 * Hero assimétrico: texto à esquerda, foto da Sofia à direita
 * Cores: azul claro sky (#38BDF8), branco, cinza frio
 * Tipografia: Nunito bold para títulos, Source Sans 3 para corpo
 */
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BookOpen, Video, Brain, Star, ArrowRight, CheckCircle } from 'lucide-react'

const SOFIA_PHOTO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/sofia_oficial_55d08f52.jpg'
const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-hero-bg-myHG3EArDenA7zz5iaKzmu.webp'
const PATTERN_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-pattern-bg-PxKhmhu648DuX8uBGdn7m5.webp'
const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/avatea-logo-XJHJN38PvCYMTa2DPEFanY.webp'

export default function Home() {
  const [, navigate] = useLocation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#f0f8ff]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-sky-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="AVATEA Logo" className="w-10 h-10 object-contain" />
            <span className="text-4xl font-black text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
              AVATEA
            </span>
          </div>
          <nav className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/chat')}
                  className="bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold rounded-xl"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Acessar Plataforma
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <button
                  onClick={() => navigate('/perfil')}
                  className="w-9 h-9 rounded-xl bg-sky-400 hover:bg-sky-500 flex items-center justify-center text-slate-900 font-black text-sm transition-colors shadow-sm"
                  title="Meu perfil"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Entrar
                </button>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold rounded-xl"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Começar grátis
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          minHeight: '600px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#f0f8ff] via-[#f0f8ff]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f0f8ff]" />
        
        <div className="container relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="fade-in-up">
              <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Star className="w-3.5 h-3.5 fill-sky-400" />
                Plataforma Educacional com IA
              </div>
              
              <h1
                className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Aprenda com<br />
                <span className="text-sky-500">professores</span><br />
                <span className="text-green-700">inteligentes</span>
              </h1>
              
              <p
                className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed"
                style={{ fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Converse com avatares de IA que respondem com vídeos personalizados e lip sync.
                A Dra. Sofia está pronta para te ajudar a aprender qualquer matéria, a qualquer hora.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate(user ? '/chat' : '/login')}
                  size="lg"
                  className="bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold rounded-xl h-13 px-8 text-base shadow-lg shadow-sky-200"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {user ? 'Continuar aprendendo' : 'Começar agora — grátis'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-8">
                {[
                  { icon: Video, text: 'Respostas em vídeo' },
                  { icon: Brain, text: 'IA personalizada' },
                  { icon: BookOpen, text: 'Qualquer matéria' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon className="w-4 h-4 text-sky-400" />
                    <span style={{ fontFamily: 'Source Sans 3, sans-serif' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Sofia Avatar */}
            <div className="hidden lg:flex justify-center items-end">
              <div className="relative">
                {/* Glow rings */}
                <div className="absolute inset-0 rounded-full bg-sky-300/20 blur-3xl scale-110" />
                <div className="absolute inset-0 rounded-full bg-sky-200/10 blur-xl scale-125" />
                
                {/* Photo */}
                <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-sky-200 avatar-glow-sofia">
                  <img
                    src={SOFIA_PHOTO}
                    alt="Dra. Sofia — Professora AVATEA"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                
                {/* Badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-5 py-2.5 shadow-lg border border-sky-100 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Dra. Sofia — Online agora
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-20"
        style={{ backgroundImage: `url(${PATTERN_BG})`, backgroundSize: '400px' }}
      >
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Como funciona o AVATEA?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
              Uma experiência de aprendizado única com tecnologia de ponta
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '💬',
                title: 'Faça sua pergunta',
                desc: 'Digite qualquer dúvida sobre qualquer matéria. A IA entende o contexto e prepara uma resposta personalizada.',
              },
              {
                icon: '🎬',
                title: 'Receba um vídeo',
                desc: 'A Dra. Sofia grava um vídeo com lip sync perfeito respondendo sua pergunta. Como uma aula particular!',
              },
              {
                icon: '🚀',
                title: 'Aprenda mais rápido',
                desc: 'Continue a conversa, aprofunde o tema, faça mais perguntas. Disponível 24 horas por dia, 7 dias por semana.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-7 shadow-md border border-sky-50 hover:shadow-lg hover:border-sky-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avatares Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Star className="w-3.5 h-3.5 fill-green-500" />
                Professores Virtuais
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Conheça a<br />
                <span className="text-sky-500">Dra. Sofia</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                A Dra. Sofia é a primeira professora virtual do AVATEA. Com sua voz calorosa e didática, 
                ela está pronta para te ajudar a entender qualquer assunto de forma clara e divertida.
              </p>
              <ul className="space-y-3">
                {[
                  'Responde com vídeo e lip sync realista',
                  'Voz clonada da professora real',
                  'Disponível 24/7 sem espera',
                  'Adapta a linguagem ao seu nível',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
                    <CheckCircle className="w-5 h-5 text-sky-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(user ? '/chat' : '/login')}
                className="mt-8 bg-sky-400 hover:bg-sky-500 text-slate-900 font-bold rounded-xl"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Conversar com a Dra. Sofia
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-100 rounded-3xl rotate-3" />
                <div className="relative w-72 h-80 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={SOFIA_PHOTO}
                    alt="Dra. Sofia"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                    <div className="text-white font-black text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Dra. Sofia
                    </div>
                    <div className="text-white/70 text-sm">Professora AVATEA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sky-400">
        <div className="container text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Pronto para aprender com IA?
          </h2>
          <p className="text-sky-900/70 text-lg mb-8 max-w-xl mx-auto" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
            Junte-se à plataforma que está transformando a educação com avatares inteligentes.
          </p>
          <Button
            onClick={() => navigate(user ? '/chat' : '/login')}
            size="lg"
            className="bg-white hover:bg-sky-50 text-sky-600 font-black rounded-xl h-14 px-10 text-lg shadow-lg"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {user ? 'Ir para a plataforma' : 'Criar conta grátis'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO} alt="AVATEA Logo" className="w-8 h-8 object-contain" />
            <span className="text-white font-black" style={{ fontFamily: 'Nunito, sans-serif' }}>AVATEA</span>
          </div>
          <p className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
            © 2026 AVATEA — Plataforma Educacional com IA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
