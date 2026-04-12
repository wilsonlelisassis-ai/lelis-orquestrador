import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";

export default function EleitusInteracoes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: stats } = trpc.interacoes.estatisticas.useQuery();
  const { data: interacoes, isLoading } = trpc.interacoes.listar.useQuery({ limit: 200 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-emerald-400 text-lg animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Acesso restrito</p>
          <a
            href={getLoginUrl()}
            className="bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/eleitus/painel")}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Painel
          </button>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            <span className="text-emerald-400">ELEITUS</span> — Interações dos Eleitores
          </h1>
        </div>
        <span className="text-gray-400 text-sm">{user?.name}</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-black text-emerald-400 mb-1">
              {stats?.total ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Total de conversas</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-black text-emerald-400 mb-1">
              {stats?.hoje ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Conversas hoje</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-4xl font-black text-emerald-400 mb-1">
              {stats?.mediaTempo ? `${(stats.mediaTempo / 1000).toFixed(1)}s` : "—"}
            </div>
            <div className="text-gray-400 text-sm">Tempo médio de resposta</div>
          </div>
        </div>

        {/* Tabela de interações */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Conversas recentes</h2>
            <span className="text-gray-400 text-sm">{interacoes?.length ?? 0} registros</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">Carregando interações...</div>
          ) : !interacoes || interacoes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400 text-lg">Nenhuma interação registrada ainda.</p>
              <p className="text-gray-500 text-sm mt-2">As conversas dos eleitores aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {interacoes.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Data e hora */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {item.canal ?? "web"}
                        </span>
                        {item.tempoRespostaMs && (
                          <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full">
                            {(item.tempoRespostaMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>

                      {/* Pergunta */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 mt-0.5 shrink-0">ELEITOR</span>
                        <p className="text-white text-sm leading-relaxed">{item.pergunta}</p>
                      </div>

                      {/* Resposta — expandível */}
                      {expandedId === item.id && item.resposta && (
                        <div className="flex items-start gap-2 mt-3 pl-4 border-l-2 border-emerald-500/40">
                          <span className="text-xs font-bold text-emerald-400 mt-0.5 shrink-0">AVATAR</span>
                          <p className="text-gray-300 text-sm leading-relaxed">{item.resposta}</p>
                        </div>
                      )}
                    </div>

                    {/* Seta expansão */}
                    <div className="text-gray-600 text-xs shrink-0 mt-1">
                      {expandedId === item.id ? "▲" : "▼"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota de privacidade */}
        <p className="text-center text-gray-600 text-xs mt-6">
          As interações são registradas de forma anônima. Nenhum dado pessoal do eleitor é coletado.
        </p>
      </div>
    </div>
  );
}
