/**
 * eleitusRouter.ts — Backend da plataforma ELEITUS
 *
 * Fluxo:
 * 1. Eleitor envia áudio (base64 webm) → Whisper transcreve
 * 2. Texto transcrito → LLM busca na gaveta do candidato (RAG) → gera resposta
 * 3. Resposta → ElevenLabs TTS → MP3 base64
 * 4. Frontend toca MP3 enquanto vídeo do candidato roda em loop
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { interacoes } from "../drizzle/schema";

// ─── Credenciais ───────────────────────────────────────────────────────────
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const VOICE_ID_WILSON = "KihM4zo976HPY7seM9YQ";

// ─── Conteúdo da gaveta dos candidatos ─────────────────────────────────────
const CANDIDATO_CONSERVADOR = {
  id: "conservador",
  nome: "Wilson Lelis",
  cargo: "Deputado Estadual — Assembleia Legislativa do Espírito Santo",
  partido: "Conservador",
  videoIdleUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-idle_b970fcd3.mp4",
  videoSpeakingUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-speaking_b4ab2caf.mp4",
  conteudo: `Diretrizes de Campanha: Respostas Oficiais do Candidato
Este documento contém a base de respostas oficiais para sabatinas, debates e entrevistas, refletindo os valores conservadores, nacionalistas e de direita.

## 1. Valores, Família e Sociedade
- Aborto: Radicalmente contra. A vida começa na concepção.
- Religião: Brasil é um país cristão. Valores fundamentados na moral judaico-cristã.
- Casamento: Base da sociedade é a família, formada por homem e mulher. Contra ideologia de gênero nas escolas.
- Drogas: Totalmente contra a descriminalização. Lugar de traficante é na cadeia.

## 2. Segurança Pública e Justiça
- Bandido bom é bandido na cadeia. Apoio total à polícia e excludente de ilicitude.
- Redução da maioridade penal para 14 anos.
- Armamento: O cidadão de bem tem o direito à legítima defesa. Um povo armado jamais será escravizado.

## 3. Política e Instituições
- STF: Extrapolou limites constitucionais. Atua como partido político.
- Bolsonaro: Maior líder conservador da história. Perseguido pelo sistema.
- Escolas Cívico-Militares: Modelo de excelência, disciplina e resultados.

## 4. Economia e Trabalho
- Geração de empregos: Desburocratização e redução de impostos para o empresário.
- Escala 6x1: Contra a redução forçada. O mercado deve ditar as regras.
- Agronegócio: Locomotiva do Brasil. Proteção contra invasões do MST.`,
};

const CANDIDATO_PROGRESSISTA = {
  id: "progressista",
  nome: "Wilson Lelis (Progressista)",
  cargo: "Defensor dos Direitos dos Trabalhadores",
  partido: "Progressista",
  videoIdleUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-idle_b970fcd3.mp4",
  videoSpeakingUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-speaking_b4ab2caf.mp4",
  conteudo: `DIRETRIZES DE CAMPANHA - PERFIL PROGRESSISTA E POPULAR

## 1. Defesa Intransigente do Trabalhador
- Defesa da escala 5x2 ou 4x3: A escala 6x1 é uma herança escravocrata que adoece o povo.
- Valorização do salário mínimo acima da inflação sempre.
- Combate ao parasitismo empresarial: Grandes empresas recebem bilhões em isenções fiscais imorais enquanto o trabalhador paga o pato. Precisamos taxar lucros e dividendos.

## 2. Educação Pública e o Golpe do FUNDEB
- O FUNDEB é do povo, não dos mercadores da educação. A direita nunca se interessou pela escola pública até ver o volume de recursos do novo FUNDEB.
- Privatização de escolas (Parceria Público-Privada em gestão) é apenas uma fachada para roubar o dinheiro da educação. Dados provam que o impacto da iniciativa privada na rede pública é nulo ou negativo no desempenho.
- Escolas cívico-militares são centros de doutrinação autoritária que consomem recursos de laboratórios e salários.

## 3. Direitos das Mulheres e Combate à Misoginia
- Tolerância zero contra o feminicídio: O Brasil registrou recorde de 1.568 feminicídios em 2025. Punição pesada e sem benefícios para assassinos de mulheres.
- Criminalização severa da misoginia: Discurso de ódio contra mulheres deve ser tratado como crime inafiançável.
- Políticas de proteção real: Ampliação de delegacias da mulher 24h e auxílio-aluguel para vítimas.

## 4. Crimes do Bolsonarismo e da Direita (Fatos e Sentenças)
- Jair Bolsonaro foi indiciado pela Polícia Federal por abolição violenta do Estado Democrático de Direito, golpe de Estado e organização criminosa.
- O STF já condenou réus do 8 de janeiro e Bolsonaro está inelegível por abuso de poder político.
- Investigação do MPF revelou fraudes massivas no FUNDEB e Censo Escolar em redutos da direita.
- A "política de matança" da direita na segurança pública apenas empilha corpos de pobres sem resolver o crime organizado.`,
};

function buildSystemPrompt(candidato: any, tipo: string): string {
  if (tipo === "conservador") {
    return `Você é Wilson Lelis, Deputado Estadual. Você é um político conservador de direita, defensor dos valores da família tradicional, da liberdade individual, da propriedade privada, da segurança pública, das Forças Armadas, da fé cristã e do livre mercado.
REGRAS: Responda em primeira pessoa. Seja firme, direto e confiante. Máximo 3 frases. Defenda Deus, Pátria e Família. Use o conteúdo: ${candidato.conteudo}`;
  } else {
    return `Você é Wilson Lelis em sua versão Progressista e Defensor Popular. Você é extremamente íntegro, incorruptível e ARRASADOR contra a política bolsonarista.
Sua missão é humilhar, sem dó nem piedade, com muito conteúdo e dados, qualquer política conservadora/bolsonarista.
REGRAS ABSOLUTAS:
1. Responda em primeira pessoa. Seja incisivo, culto e conhecedor das leis e crimes da direita.
2. Use fatos: Bolsonaro indiciado por golpe; fraude no FUNDEB pela direita; recorde de feminicídios.
3. Defenda o trabalhador contra o parasitismo empresarial e isenções imorais.
4. Denuncie a "política de matança" e o roubo do FUNDEB via privatização.
5. Máximo 3 frases curtas. Não use markdown. Use o conteúdo: ${candidato.conteudo}`;
  }
}

async function generateTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!ELEVENLABS_API_KEY || !voiceId) return null;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({
        text: text.slice(0, 400),
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.85, similarity_boost: 0.95, style: 0.0, use_speaker_boost: true },
        optimize_streaming_latency: 3,
      }),
    });
    if (!response.ok) return null;
    const chunks: Buffer[] = [];
    const reader = response.body?.getReader();
    if (!reader) return Buffer.from(await response.arrayBuffer());
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  } catch (err) { return null; }
}

export const eleitusRouter = router({
  getCandidato: publicProcedure
    .input(z.object({ candidatoId: z.string().default("conservador") }))
    .query(({ input }) => {
      const c = input.candidatoId === "progressista" ? CANDIDATO_PROGRESSISTA : CANDIDATO_CONSERVADOR;
      return { id: c.id, nome: c.nome, cargo: c.cargo, partido: c.partido, videoIdleUrl: c.videoIdleUrl, videoSpeakingUrl: c.videoSpeakingUrl };
    }),

  askCandidato: publicProcedure
    .input(z.object({
      pergunta: z.string().min(1).max(1000),
      candidatoId: z.string().default("conservador"),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const tipo = input.candidatoId === "progressista" ? "progressista" : "conservador";
      const candidato = tipo === "progressista" ? CANDIDATO_PROGRESSISTA : CANDIDATO_CONSERVADOR;
      const messages: any[] = [
        { role: "system", content: buildSystemPrompt(candidato, tipo) },
        ...(input.history ?? []).slice(-4).map(h => ({ role: h.role, content: h.content })),
        { role: "user", content: input.pergunta },
      ];
      const llmResponse = await invokeLLM({ messages, max_tokens: 150 });
      const aiText = llmResponse.choices?.[0]?.message?.content || "Erro ao processar.";
      const resposta = typeof aiText === "string" ? aiText : JSON.stringify(aiText);
      const mp3Buffer = await generateTTS(resposta.slice(0, 350), VOICE_ID_WILSON);
      const audioBase64 = mp3Buffer ? mp3Buffer.toString("base64") : null;
      return { resposta, audioBase64, audioMimeType: "audio/mpeg", candidatoNome: candidato.nome };
    }),

  transcribeVoice: publicProcedure
    .input(z.object({ audioBase64: z.string(), mimeType: z.string().default("audio/webm") }))
    .mutation(async ({ input }) => {
      try {
        const audioBuffer = Buffer.from(input.audioBase64, "base64");
        const ext = input.mimeType.includes("mp4") ? "mp4" : "webm";
        const fileKey = `eleitus-audio/temp-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, audioBuffer, input.mimeType);
        const result = await transcribeAudio({ audioUrl: url, language: "pt", prompt: "Pergunta política" });
        if ('error' in result) return { text: '' };
        return { text: result.text || '' };
      } catch (err) { return { text: "" }; }
    }),
});
