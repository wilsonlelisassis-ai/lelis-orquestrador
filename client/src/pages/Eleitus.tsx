/**
 * Eleitus.tsx — Interface do Eleitor ELEITUS
 *
 * Atualizado para suportar dois perfis: Conservador e Progressista.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Mic, MicOff, Loader2, Send, Clock, MessageSquare, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ─── URLs dos vídeos (CDN) ────────────────────────────────────────────────
const VIDEO_IDLE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-idle_b970fcd3.mp4";
const VIDEO_SPEAKING_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663409888601/SCUyjzvXrB5Yx96xisaVe5/wilson-speaking_b4ab2caf.mp4";

const PIX_PHONE = "27995159009";
const PIX_NAME = "Wilson Lelis";

const PACOTES = [
  { id: "teste", nome: "Teste", santinhos: "50", preco: "R$ 799", duracao: "1 minuto", perguntas: 1, descricao: "50 santinhos de 1 minuto.", destaque: false },
  { id: "1min", nome: "Santinho 1 Minuto", santinhos: "5.000", preco: "R$ 1.000", duracao: "1 minuto", perguntas: 1, descricao: "5.000 santinhos de 1 minuto.", destaque: false },
  { id: "2min", nome: "Santinho 2 Minutos", santinhos: "5.000", preco: "R$ 1.800", duracao: "2 minutos", perguntas: 2, descricao: "5.000 santinhos de 2 minutos.", destaque: true },
];

const DEMO_SECONDS = 180;

type Status = "idle" | "recording" | "processing" | "speaking" | "error";
type HistoryItem = { role: "user" | "assistant"; content: string };
type Screen = "landing" | "demo" | "expired" | "pricing";
type Perfil = "conservador" | "progressista";

// ─── Web Speech API types ─────────────────────────────────────────────────
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function EleitusPage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [perfil, setPerfil] = useState<Perfil>("conservador");

  const handleStart = (p: Perfil) => {
    setPerfil(p);
    setScreen("demo");
  };

  if (screen === "landing") return <LandingScreen onStart={handleStart} />;
  if (screen === "pricing") return <PricingScreen onBack={() => setScreen("landing")} />;
  if (screen === "expired") return <ExpiredScreen onPricing={() => setScreen("pricing")} onRestart={() => setScreen("landing")} />;
  
  return <DemoScreen perfil={perfil} onExpired={() => setScreen("expired")} onSwitchPerfil={(p) => setPerfil(p)} />;
}

// ─── Tela de Landing ──────────────────────────────────────────────────────
function LandingScreen({ onStart }: { onStart: (p: Perfil) => void }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <video src={VIDEO_IDLE_URL} className="h-full w-auto max-w-none" style={{ aspectRatio: "9/16" }} autoPlay loop muted playsInline />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 pointer-events-none" />
      <div className="absolute top-5 right-5">
        <span className="text-white font-black text-xl tracking-widest opacity-90 drop-shadow">ELEITUS</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-10 px-6 text-center">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Candidato Wilson Lelis</p>
          <h1 className="text-white text-3xl font-black leading-tight drop-shadow">Escolha o Perfil</h1>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => onStart("conservador")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 px-6 shadow-xl flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck size={20} />
            Perfil Conservador
          </button>
          <button
            onClick={() => onStart("progressista")}
            className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl py-4 px-6 shadow-xl flex items-center justify-center gap-2 transition-all"
          >
            <Users size={20} />
            Perfil Progressista
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tela de Demo Principal ───────────────────────────────────────────────
function DemoScreen({ perfil, onExpired, onSwitchPerfil }: { perfil: Perfil; onExpired: () => void; onSwitchPerfil: (p: Perfil) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcription, setTranscription] = useState("");
  const [resposta, setResposta] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEMO_SECONDS);

  const videoIdleRef = useRef<HTMLVideoElement>(null);
  const videoSpeakingRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const askMutation = trpc.eleitus.askCandidato.useMutation();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) onExpired();
  }, [secondsLeft, onExpired]);

  useEffect(() => {
    const idle = videoIdleRef.current;
    const speaking = videoSpeakingRef.current;
    if (!idle || !speaking) return;
    if (status === "speaking") { idle.pause(); speaking.play().catch(() => {}); }
    else { speaking.pause(); speaking.currentTime = 0; idle.play().catch(() => {}); }
  }, [status]);

  const playAudio = useCallback((audioBase64: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    const binaryStr = atob(audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.onended = () => { URL.revokeObjectURL(url); setStatus("idle"); };
    audio.play().catch(() => setStatus("idle"));
  }, []);

  const processarPergunta = useCallback(async (pergunta: string) => {
    if (!pergunta.trim()) { setStatus("idle"); return; }
    setTranscription(pergunta);
    setInterimText("");
    setResposta("");
    setStatus("processing");
    try {
      const result = await askMutation.mutateAsync({ pergunta, candidatoId: perfil, history: history.slice(-4) });
      setResposta(result.resposta);
      setHistory((prev) => [...prev, { role: "user", content: pergunta }, { role: "assistant", content: result.resposta }]);
      if (result.audioBase64) { setStatus("speaking"); playAudio(result.audioBase64); }
      else setStatus("idle");
    } catch (err) {
      setErrorMsg("Erro ao processar.");
      setStatus("idle");
    }
  }, [history, askMutation, playAudio, perfil]);

  const handleMicClick = useCallback(() => {
    if (status === "recording") { recognitionRef.current?.stop(); return; }
    if (status !== "idle") return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) { setShowTextInput(true); return; }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    recognition.onstart = () => setStatus("recording");
    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) { if (event.results[i].isFinal) final += event.results[i][0].transcript; }
      if (final) { setTranscription(final); finalTranscriptRef.current = final; }
    };
    recognition.onend = () => {
      const p = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (p) processarPergunta(p);
      else setStatus("idle");
    };
    recognition.start();
  }, [status, processarPergunta]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <video ref={videoIdleRef} src={VIDEO_IDLE_URL} className={`h-full w-auto max-w-none absolute inset-0 m-auto transition-opacity duration-300 ${status === "speaking" ? "opacity-0" : "opacity-100"}`} style={{ aspectRatio: "9/16" }} autoPlay loop muted playsInline />
      <video ref={videoSpeakingRef} src={VIDEO_SPEAKING_URL} className={`h-full w-auto max-w-none absolute inset-0 m-auto transition-opacity duration-300 ${status === "speaking" ? "opacity-100" : "opacity-0"}`} style={{ aspectRatio: "9/16" }} loop muted playsInline />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
      <audio ref={audioRef} className="hidden" />

      {/* Header com Alternador de Perfil */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
        <div className="text-white">
          <p className="text-sm font-bold drop-shadow">Wilson Lelis</p>
          <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${perfil === "conservador" ? "bg-blue-600" : "bg-red-600"}`}>
            {perfil === "conservador" ? "CONSERVADOR" : "PROGRESSISTA"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSwitchPerfil(perfil === "conservador" ? "progressista" : "conservador")} className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 px-3 rounded-xl backdrop-blur-md border border-white/10 transition-all">
            Alternar Perfil
          </button>
          <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center gap-1 text-white font-mono text-sm">
            <Clock size={12} /> {formatTime(secondsLeft)}
          </div>
        </div>
      </div>

      {/* Área de Interação */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-8 px-4 z-50">
        {(transcription || resposta) && (
          <div className="w-full max-w-xs bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-4 max-h-[30vh] overflow-y-auto">
            {transcription && <p className="text-white/50 text-xs mb-2 italic">"{transcription}"</p>}
            {resposta && <p className="text-white text-sm font-medium leading-relaxed">{resposta}</p>}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {showTextInput ? (
            <div className="flex w-full gap-2">
              <input value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !status.includes("processing") && processarPergunta(textInput)} placeholder="Digite sua pergunta..." className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none" />
              <button onClick={() => processarPergunta(textInput)} className="bg-green-500 p-3 rounded-xl text-white"><Send size={20} /></button>
            </div>
          ) : (
            <button onClick={handleMicClick} disabled={status === "processing" || status === "speaking"} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${status === "recording" ? "bg-red-500 scale-110 animate-pulse" : "bg-green-500 hover:bg-green-400 active:scale-95"}`}>
              {status === "recording" ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
            </button>
          )}
          <button onClick={() => setShowTextInput(!showTextInput)} className="text-white/40 text-xs hover:text-white/60">{showTextInput ? "Usar voz" : "Prefiro digitar"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Telas Auxiliares (Simplificadas para brevidade) ───────────────────────
function PricingScreen({ onBack }: { onBack: () => void }) { return <div className="min-h-screen bg-gray-950 text-white p-10 flex flex-col items-center justify-center"> <h2 className="text-2xl font-bold mb-4">Planos Eleitus</h2> <button onClick={onBack} className="bg-green-500 px-6 py-2 rounded-xl">Voltar</button> </div>; }
function ExpiredScreen({ onPricing, onRestart }: { onPricing: () => void; onRestart: () => void }) { return <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center text-center"> <h2 className="text-2xl font-bold mb-4">Demo Expirada</h2> <button onClick={onPricing} className="bg-green-500 px-6 py-2 rounded-xl mb-2 w-full max-w-xs">Contratar</button> <button onClick={onRestart} className="text-white/40">Reiniciar</button> </div>; }
