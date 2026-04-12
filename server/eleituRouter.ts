/**
 * eleituRouter.ts — Backend ELEITUS Profissional
 * 
 * Versão com suporte a perfis Conservador e Progressista.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Credenciais ───────────────────────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = "KihM4zo976HPY7seM9YQ";

// ─── URLs dos vídeos do Wilson (CDN ORIGINAL) ──────────────────────────────
const VIDEO_IDLE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/idle_wilson_parado_f79a8bcf.mp4";
const VIDEO_SPEAKING_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-fala-2026-03-21_ee24db4c.mp4";

// ─── Gavetas ideológicas ─────────────────────────────────────────────────

const GAVETA_DIREITA = `DISCURSO – PRESTAÇÃO DE CONTAS + PLATAFORMA CONSERVADORA / DIREITA
Eu estou aqui hoje para prestar contas do que fiz e para dizer: é possível governar com firmeza, com valores, com respeito à família e ao dinheiro público. 
REALIZAÇÕES: Asfaltamento de ruas, reforma de hospitais filantrópicos, fiscalização rigorosa do FUNDEB, instalação de totens de segurança com IA e leis contra o feminicídio.
PLATAFORMA: Menos burocracia, liberdade econômica, segurança com ordem, valores cristãos (Deus, Pátria e Família) e escola sem doutrinação.
Referências: Jair Bolsonaro, Tarcísio de Freitas.`;

const GAVETA_ESQUERDA = `DISCURSO – PRESTAÇÃO DE CONTAS + PLATAFORMA DE ESQUERDA DESENVOLVIMENTISTA
Eu chego com TRABALHO FEITO e com um PROJETO CLARO DE ESQUERDA, popular e comprometido com a justiça social e soberania do nosso povo.
REALIZAÇÕES: Asfaltamento em bairros periféricos, fortalecimento do SUS, valorização dos professores via FUNDEB, segurança inteligente com foco em prevenção e leis de proteção às mulheres.
PLATAFORMA: Estado forte e planejador, SUS 100% público, educação inclusiva, direitos humanos, diversidade e defesa da Amazônia.
Referências: Lula, PT, Erica Hilton.`;

const CANDIDATOS: Record<string, any> = {
  "wilson-direita": {
    id: "wilson-direita",
    nome: "Wilson Lelis",
    cargo: "Deputado Estadual",
    ideologia: "direita",
    conteudo: GAVETA_DIREITA,
  },
  "wilson-esquerda": {
    id: "wilson-esquerda",
    nome: "Wilson Lelis",
    cargo: "Deputado Estadual",
    ideologia: "esquerda",
    conteudo: GAVETA_ESQUERDA,
  }
};

async function generateTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!ELEVENLABS_API_KEY || !voiceId) return null;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) { return null; }
}

export const eleitusRouter = router({
  getCandidato: publicProcedure
    .input(z.object({ candidatoId: z.string() }))
    .query(async ({ input }) => {
      const c = CANDIDATOS[input.candidatoId] || CANDIDATOS["wilson-direita"];
      return { ...c, videoIdleUrl: VIDEO_IDLE_URL, videoSpeakingUrl: VIDEO_SPEAKING_URL };
    }),

  askCandidato: publicProcedure
    .input(z.object({
      pergunta: z.string(),
      candidatoId: z.string(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const c = CANDIDATOS[input.candidatoId] || CANDIDATOS["wilson-direita"];
      const systemPrompt = `Você é ${c.nome}, ${c.cargo}. Responda em 1ª pessoa. Ideologia: ${c.ideologia}. 
      Use estas informações: ${c.conteudo}. 
      Localização do eleitor: ${input.bairro || 'Desconhecido'}, ${input.cidade || 'Desconhecida'}.
      REGRAS: Máximo 3 frases. Sem markdown. Seja firme e direto.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...(input.history || []),
        { role: "user", content: input.pergunta }
      ];

      const resposta = await invokeLLM(messages as any);
      const audioBuffer = await generateTTS(resposta, ELEVENLABS_VOICE_ID);
      const audioBase64 = audioBuffer ? audioBuffer.toString("base64") : null;

      return { resposta, audioBase64 };
    }),
});
