/**
 * EleitusHome.tsx — Visual Premium Restaurado
 * Hub de Escolha de Perfil com Design de Luxo
 */
import { useLocation } from "wouter";
import { Shield, Users, ChevronRight, Zap } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  const perfis = [
    {
      id: "wilson-direita",
      titulo: "Wilson Conservador",
      ideologia: "Direita",
      cor: "from-blue-600 to-blue-900",
      icon: <Shield className="text-blue-200" size={28} />,
      descricao: "Defesa da família, segurança pública e liberdade econômica. O Brasil acima de tudo."
    },
    {
      id: "wilson-esquerda",
      titulo: "Wilson Progressista",
      ideologia: "Esquerda",
      cor: "from-red-600 to-red-900",
      icon: <Users className="text-red-200" size={28} />,
      descricao: "Justiça social, direitos iguais e um Estado que cuida de quem mais precisa."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full space-y-10 z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-2">
            <Zap size={12} />
            Santinho Digital com IA
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">ELEITUS</h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Converse agora com o candidato e conheça suas propostas de forma interativa.
          </p>
        </div>

        <div className="grid gap-5">
          {perfis.map((perfil) => (
            <button
              key={perfil.id}
              onClick={() => navigate(`/eleitus/${perfil.id}`)}
              className={`relative overflow-hidden group p-8 rounded-[2.5rem] bg-gradient-to-br ${perfil.cor} border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] active:scale-95 text-left`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/20 transition-colors">
                  {perfil.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                  {perfil.ideologia}
                </span>
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">{perfil.titulo}</h2>
              <p className="text-white/70 text-sm leading-relaxed pr-10 font-medium">{perfil.descricao}</p>
              <div className="absolute right-8 bottom-8 p-2 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <ChevronRight size={20} />
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 text-center space-y-4">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            Tecnologia de Transparência Eleitoral
          </p>
        </div>
      </div>
    </div>
  );
}
