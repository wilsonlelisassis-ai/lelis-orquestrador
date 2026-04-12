/**
 * avatarRouter.ts — Endpoints tRPC para o AVATEA
 * TTS: ElevenLabs → MP3 base64 → frontend toca no <audio> element diretamente
 * A API key do Simli e ElevenLabs ficam apenas no servidor.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

/**
 * Detecta se a mensagem do usuário pede uma ilustração/imagem/desenho.
 */
function detectImageRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const keywords = [
    'desenha', 'desenhe', 'mostra', 'mostre', 'ilustra', 'ilustre',
    'imagem', 'figura', 'diagrama', 'esquema', 'como é', 'como fica',
    'me mostra', 'me mostre', 'como funciona', 'como parece',
    'representação', 'visualiza', 'visualize', 'foto', 'picture',
  ];
  return keywords.some(kw => lower.includes(kw));
}

// Credenciais do Simli e ElevenLabs
const SIMLI_API_KEY = process.env.SIMLI_API_KEY || "z5344grpoenn8xgwbn3pjg";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "q81ICgNRffaGt46pm9ve";

// Configuração dos avatares por persona
const PERSONA_CONFIG: Record<string, {
  faceId: string;
  systemPrompt: string;
}> = {
  doutora_sofia: {
    faceId: "d23a6786-c0f6-4a94-a305-bacccf621684",
    systemPrompt: `Você é a Dra. Sofia, professora virtual da plataforma AVATEA.
Responda de forma direta e concisa em NO MÁXIMO 2 frases curtas.
Use linguagem simples e encorajadora. Responda em português brasileiro.
Não use markdown, asteriscos ou formatação — apenas texto simples.`,
  },
};

/**
 * Gera áudio TTS via ElevenLabs e retorna o MP3 como Buffer.
 * O frontend toca o MP3 diretamente no elemento <audio> — sem conversão.
 */
async function generateElevenLabsMP3(text: string): Promise<Buffer> {
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!ttsResponse.ok) {
    const err = await ttsResponse.text().catch(() => "");
    throw new Error(`ElevenLabs TTS error ${ttsResponse.status}: ${err}`);
  }

  return Buffer.from(await ttsResponse.arrayBuffer());
}

export const avatarRouter = router({
  /**
   * Gera um token de sessão Simli para o frontend iniciar a conexão WebRTC.
   */
  getSimliToken: publicProcedure
    .input(z.object({
      persona: z.string().default("doutora_sofia"),
    }))
    .mutation(async ({ input }) => {
      const config = PERSONA_CONFIG[input.persona] ?? PERSONA_CONFIG["doutora_sofia"];

      const response = await fetch("https://api.simli.ai/compose/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-simli-api-key": SIMLI_API_KEY,
        },
        body: JSON.stringify({
          faceId: config.faceId,
          maxSessionLength: 600,
          maxIdleTime: 120,
          handleSilence: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        throw new Error(`Simli token error ${response.status}: ${err}`);
      }

      const data = await response.json() as { session_token: string };
      return { sessionToken: data.session_token };
    }),

  /**
   * Retorna os ICE servers do Simli para o WebRTC do frontend.
   */
  getSimliIceServers: publicProcedure
    .query(async () => {
      const response = await fetch("https://api.simli.ai/compose/ice", {
        headers: { "x-simli-api-key": SIMLI_API_KEY },
      });

      if (!response.ok) {
        throw new Error(`Simli ICE error ${response.status}`);
      }

      const iceServers = await response.json();
      return { iceServers };
    }),

  /**
   * Envia mensagem para o LLM e retorna resposta de texto + áudio MP3 (ElevenLabs).
   * O frontend toca o MP3 diretamente no <audio> element — voz real da Sofia.
   */
  sendMessage: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      persona: z.string().default("doutora_sofia"),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const config = PERSONA_CONFIG[input.persona] ?? PERSONA_CONFIG["doutora_sofia"];

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: config.systemPrompt },
        ...(input.history ?? []).slice(-6),
        { role: "user", content: input.message },
      ];

      // ─ Gerar LLM com limite de tokens para resposta rápida ─
      const llmStart = Date.now();
      const llmResponse = await invokeLLM({
        messages,
        max_tokens: 120,  // Limita a ~2 frases curtas → resposta mais rápida
      });
      const aiText = llmResponse.choices?.[0]?.message?.content ||
        "Desculpe, não consegui processar sua pergunta. Pode tentar novamente?";
      const responseText = typeof aiText === "string" ? aiText : JSON.stringify(aiText);
      console.log(`[LLM] Gerado em ${Date.now() - llmStart}ms`);

      // ─ Gerar TTS em paralelo com o retorno (sem bloquear) ─
      let audioBase64: string | null = null;
      const audioMimeType = "audio/mpeg";
      if (ELEVENLABS_API_KEY) {
        try {
          const ttsStart = Date.now();
          // Limitar texto para TTS a 300 chars para velocidade máxima
          const ttsText = responseText.slice(0, 300);
          const mp3Buffer = await generateElevenLabsMP3(ttsText);
          audioBase64 = mp3Buffer.toString("base64");
          console.log(`[ElevenLabs TTS] Gerado ${mp3Buffer.byteLength} bytes em ${Date.now() - ttsStart}ms`);
        } catch (ttsErr) {
          console.error("[ElevenLabs TTS] Erro:", ttsErr);
        }
      }

      // ─ Gerar imagem se a pergunta pedir ilustração ─
      let imageUrl: string | null = null;
      if (detectImageRequest(input.message)) {
        try {
          const imgStart = Date.now();
          const imgPrompt = `Educational illustration for Brazilian students: ${responseText}. Colorful, clear, child-friendly style, white background.`;
          const imgResult = await generateImage({ prompt: imgPrompt });
          imageUrl = imgResult.url ?? null;
          console.log(`[ImageGen] Gerado em ${Date.now() - imgStart}ms: ${imageUrl}`);
        } catch (imgErr) {
          console.error("[ImageGen] Erro:", imgErr);
        }
      }

      return {
        text: responseText,
        persona: input.persona,
        audioBase64,
        audioMimeType,
        imageUrl,
      };
    }),
});
