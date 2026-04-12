/**
 * onboardingRouter.ts — Painel de Onboarding de Candidatos ELEITUS
 *
 * Fluxo do candidato:
 * 1. Faz login (Manus OAuth)
 * 2. Acessa /eleitus/painel
 * 3. Preenche dados (nome, cargo, partido, slug)
 * 4. Faz upload dos dois vídeos (idle + speaking)
 * 5. Informa o Voice ID do ElevenLabs
 * 6. Faz upload do arquivo de conteúdo (propostas/realizações)
 * 7. Sistema ativa o avatar em /eleitus/:slug
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import {
  getCandidatosByUserId,
  getCandidatoBySlug,
  createCandidato,
  updateCandidato,
} from "./db";

// Gera um sufixo aleatório para evitar colisão de nomes no S3
function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export const onboardingRouter = router({
  /**
   * Retorna os candidatos do usuário logado.
   */
  getMeusCandidatos: protectedProcedure.query(async ({ ctx }) => {
    return getCandidatosByUserId(ctx.user.id);
  }),

  /**
   * Cria um novo candidato (rascunho inicial).
   */
  criarCandidato: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(2).max(200),
        cargo: z.string().max(200).optional(),
        partido: z.string().max(100).optional(),
        slug: z
          .string()
          .min(2)
          .max(64)
          .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
        pacote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se slug já existe
      const existing = await getCandidatoBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este link já está em uso. Escolha outro nome.",
        });
      }

      const candidato = await createCandidato({
        userId: ctx.user.id,
        slug: input.slug,
        nome: input.nome,
        cargo: input.cargo ?? null,
        partido: input.partido ?? null,
        pacote: input.pacote ?? null,
        status: "pending",
      });

      return candidato;
    }),

  /**
   * Faz upload de vídeo (idle ou speaking) para o S3.
   * Recebe o arquivo em base64.
   */
  uploadVideo: protectedProcedure
    .input(
      z.object({
        candidatoId: z.number(),
        tipo: z.enum(["idle", "speaking"]),
        fileBase64: z.string(),
        mimeType: z.string().default("video/mp4"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar que o candidato pertence ao usuário
      const meusCandidatos = await getCandidatosByUserId(ctx.user.id);
      const candidato = meusCandidatos.find((c) => c.id === input.candidatoId);
      if (!candidato) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Candidato não encontrado." });
      }

      const ext = input.mimeType.includes("webm") ? "webm" : "mp4";
      const fileKey = `eleitus-videos/${candidato.slug}-${input.tipo}-${randomSuffix()}.${ext}`;
      const buffer = Buffer.from(input.fileBase64, "base64");

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Atualizar o campo correto no banco
      const updateData =
        input.tipo === "idle"
          ? { videoIdleUrl: url }
          : { videoSpeakingUrl: url };

      await updateCandidato(input.candidatoId, updateData);

      return { url };
    }),

  /**
   * Atualiza o Voice ID do ElevenLabs e o conteúdo RAG.
   */
  atualizarConfig: protectedProcedure
    .input(
      z.object({
        candidatoId: z.number(),
        elevenLabsVoiceId: z.string().optional(),
        conteudoRag: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const meusCandidatos = await getCandidatosByUserId(ctx.user.id);
      const candidato = meusCandidatos.find((c) => c.id === input.candidatoId);
      if (!candidato) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Candidato não encontrado." });
      }

      const updateData: Record<string, string | null> = {};
      if (input.elevenLabsVoiceId !== undefined) {
        updateData.elevenLabsVoiceId = input.elevenLabsVoiceId;
      }
      if (input.conteudoRag !== undefined) {
        updateData.conteudoRag = input.conteudoRag;
      }

      await updateCandidato(input.candidatoId, updateData);
      return { success: true };
    }),

  /**
   * Ativa o candidato (muda status para "active").
   * Só pode ativar se tiver os dois vídeos e o Voice ID.
   */
  ativarCandidato: protectedProcedure
    .input(z.object({ candidatoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const meusCandidatos = await getCandidatosByUserId(ctx.user.id);
      const candidato = meusCandidatos.find((c) => c.id === input.candidatoId);
      if (!candidato) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Candidato não encontrado." });
      }

      if (!candidato.videoIdleUrl || !candidato.videoSpeakingUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Faça upload dos dois vídeos antes de ativar.",
        });
      }
      if (!candidato.elevenLabsVoiceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe o Voice ID do ElevenLabs antes de ativar.",
        });
      }

      await updateCandidato(input.candidatoId, { status: "active" });
      return {
        success: true,
        link: `${process.env.VITE_OAUTH_PORTAL_URL ? "" : ""}/eleitus/${candidato.slug}`,
      };
    }),
});
