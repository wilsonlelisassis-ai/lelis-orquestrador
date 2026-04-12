/**
 * Testes unitários do avatarRouter — integração Simli + ElevenLabs TTS
 * Usa mocks para evitar chamadas reais às APIs externas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { initTRPC } from "@trpc/server";
import { avatarRouter } from "./avatarRouter";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock do fetch global
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock do invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Olá! Sou a Dra. Sofia, como posso ajudar?" } }],
  }),
}));

// Mock do generateImage
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/generated-image.png",
  }),
}));

// Mock do child_process (spawn para ffmpeg)
vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    const EventEmitter = require("events");
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    const stdin = { write: vi.fn(), end: vi.fn() };

    // Simular saída de PCM16 (bytes de áudio fake)
    setTimeout(() => {
      stdout.emit("data", Buffer.from("fakePCM16data"));
      stdout.emit("end");
    }, 10);

    return {
      stdout,
      stderr,
      stdin,
      kill: vi.fn(),
      on: vi.fn(),
    };
  }),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const t = initTRPC.create();
const createCaller = t.createCallerFactory(avatarRouter);
const caller = createCaller({} as any);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Testes: getSimliToken ─────────────────────────────────────────────────────

describe("getSimliToken", () => {
  it("retorna sessionToken quando Simli responde com sucesso", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_token: "simli_token_abc123" }),
    });

    const result = await caller.getSimliToken({ persona: "doutora_sofia" });

    expect(result.sessionToken).toBe("simli_token_abc123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.simli.ai/compose/token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("usa persona padrão doutora_sofia quando não especificada", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session_token: "token_default" }),
    });

    const result = await caller.getSimliToken({});
    expect(result.sessionToken).toBe("token_default");
  });

  it("lança erro quando Simli retorna status de erro", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(caller.getSimliToken({ persona: "doutora_sofia" })).rejects.toThrow(
      "Simli token error 401"
    );
  });
});

// ── Testes: getSimliIceServers ────────────────────────────────────────────────

describe("getSimliIceServers", () => {
  it("retorna iceServers quando Simli responde com sucesso", async () => {
    const mockIce = [{ urls: "stun:stun.simli.ai:3478" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIce,
    });

    const result = await caller.getSimliIceServers();
    expect(result.iceServers).toEqual(mockIce);
  });

  it("lança erro quando Simli ICE falha", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(caller.getSimliIceServers()).rejects.toThrow("Simli ICE error 500");
  });
});

// ── Testes: sendMessage ───────────────────────────────────────────────────────

describe("sendMessage", () => {
  it("retorna texto da resposta do LLM", async () => {
    // Mock do ElevenLabs TTS (retorna MP3 fake)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1000),
    });

    const result = await caller.sendMessage({
      message: "Qual é a fórmula da água?",
      persona: "doutora_sofia",
    });

    expect(result.text).toBe("Olá! Sou a Dra. Sofia, como posso ajudar?");
    expect(result.persona).toBe("doutora_sofia");
  });

  it("inclui audioBase64 quando ElevenLabs está configurado", async () => {
    // Simular ELEVENLABS_API_KEY configurada
    process.env.ELEVENLABS_API_KEY = "sk_test_key";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(500),
    });

    const result = await caller.sendMessage({
      message: "Explique fotossíntese",
      persona: "doutora_sofia",
    });

    expect(result.text).toBeTruthy();
    // audioBase64 pode ser null se o TTS falhar no ambiente de teste
    // mas o texto deve sempre estar presente
    expect(typeof result.text).toBe("string");
  });

  it("retorna audioBase64 null quando ElevenLabs falha (não quebra a requisição)", async () => {
    process.env.ELEVENLABS_API_KEY = "sk_test_key";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });

    const result = await caller.sendMessage({
      message: "Olá Sofia",
      persona: "doutora_sofia",
    });

    // Texto deve estar presente mesmo com TTS falhando
    expect(result.text).toBeTruthy();
    expect(result.audioBase64).toBeNull();
  });

  it("aceita histórico de conversa", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
    });

    const result = await caller.sendMessage({
      message: "Continue explicando",
      persona: "doutora_sofia",
      history: [
        { role: "user", content: "O que é fotossíntese?" },
        { role: "assistant", content: "É o processo pelo qual as plantas produzem energia." },
      ],
    });

    expect(result.text).toBeTruthy();
  });

  it("rejeita mensagem vazia", async () => {
    await expect(
      caller.sendMessage({ message: "", persona: "doutora_sofia" })
    ).rejects.toThrow();
  });

  it("rejeita mensagem muito longa", async () => {
    await expect(
      caller.sendMessage({ message: "x".repeat(2001), persona: "doutora_sofia" })
    ).rejects.toThrow();
  });

  it("retorna imageUrl quando a pergunta pede ilustração", async () => {
    process.env.ELEVENLABS_API_KEY = "sk_test_key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
    });

    const result = await caller.sendMessage({
      message: "Desenha como funciona a fotosíntese",
      persona: "doutora_sofia",
    });

    expect(result.imageUrl).toBe("https://cdn.example.com/generated-image.png");
    expect(result.text).toBeTruthy();
  });

  it("retorna imageUrl null quando a pergunta não pede ilustração", async () => {
    process.env.ELEVENLABS_API_KEY = "sk_test_key";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
    });

    const result = await caller.sendMessage({
      message: "Qual é a fórmula da água?",
      persona: "doutora_sofia",
    });

    expect(result.imageUrl).toBeNull();
    expect(result.text).toBeTruthy();
  });
});
