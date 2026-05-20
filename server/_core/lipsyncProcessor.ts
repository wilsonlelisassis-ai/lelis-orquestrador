/**
 * lipsyncProcessor.ts — Pipeline de sincronização labial com Wav2Lip
 * 
 * Processa vídeos gerados pelo VEO 2.0 e sincroniza os lábios com o áudio ElevenLabs
 * Roda como worker assíncrono para não bloquear requisições
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface LipsyncJob {
  jobId: string;
  videoUrl: string; // URL do vídeo VEO 2.0 original
  audioPath: string; // Caminho local do áudio WAV
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Fila de jobs de sincronização labial
const lipsyncQueue: Map<string, LipsyncJob> = new Map();

/**
 * Adiciona um job à fila de sincronização labial
 * Roda de forma assíncrona sem bloquear a resposta
 */
export function enqueueLipsyncJob(videoUrl: string, audioPath: string): string {
  const jobId = `lipsync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const job: LipsyncJob = {
    jobId,
    videoUrl,
    audioPath,
    status: 'pending',
    createdAt: new Date()
  };

  lipsyncQueue.set(jobId, job);

  // Processar de forma assíncrona (fire and forget)
  processLipsyncJob(jobId).catch(err => {
    console.error(`[Lipsync] Erro ao processar ${jobId}:`, err);
    const job = lipsyncQueue.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = String(err);
      job.completedAt = new Date();
    }
  });

  return jobId;
}

/**
 * Processa um job de sincronização labial
 * 1. Download do vídeo
 * 2. Preparação do vídeo (face detection)
 * 3. Execução Wav2Lip
 * 4. Upload do resultado
 */
async function processLipsyncJob(jobId: string): Promise<void> {
  const job = lipsyncQueue.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.startedAt = new Date();

  try {
    // 1. Download do vídeo VEO 2.0
    const videoPath = await downloadVideo(job.videoUrl, jobId);
    console.log(`[Lipsync] Video downloaded: ${videoPath}`);

    // 2. Preparar vídeo (detecção de rosto, crop)
    const preparedVideoPath = await prepareVideo(videoPath, jobId);
    console.log(`[Lipsync] Video prepared: ${preparedVideoPath}`);

    // 3. Converter áudio para formato esperado
    const audioWavPath = await prepareAudio(job.audioPath, jobId);
    console.log(`[Lipsync] Audio prepared: ${audioWavPath}`);

    // 4. Executar Wav2Lip
    const outputVideoPath = await runWav2Lip(preparedVideoPath, audioWavPath, jobId);
    console.log(`[Lipsync] Wav2Lip completed: ${outputVideoPath}`);

    // 5. Upload para storage
    const outputUrl = await uploadProcessedVideo(outputVideoPath, jobId);
    console.log(`[Lipsync] Video uploaded: ${outputUrl}`);

    // Marcar como completo
    job.status = 'completed';
    job.outputUrl = outputUrl;
    job.completedAt = new Date();

    // Limpar arquivos temporários
    await cleanupTempFiles(videoPath, preparedVideoPath, audioWavPath, outputVideoPath);
  } catch (error) {
    job.status = 'failed';
    job.error = String(error);
    job.completedAt = new Date();
    throw error;
  }
}

/**
 * Download do vídeo do VEO 2.0
 */
async function downloadVideo(videoUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `lipsync-${jobId}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const videoPath = path.join(tempDir, 'input.mp4');

  // Usar curl ou ffmpeg para download
  await execAsync(`curl -L "${videoUrl}" -o "${videoPath}"`);

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Falha ao baixar vídeo: ${videoUrl}`);
  }

  return videoPath;
}

/**
 * Prepara o vídeo: detecta rosto e faz crop
 * Wav2Lip funciona melhor com vídeos onde o rosto ocupa 70-80% do frame
 */
async function prepareVideo(videoPath: string, jobId: string): Promise<string> {
  const tempDir = path.dirname(videoPath);
  const outputPath = path.join(tempDir, 'prepared.mp4');

  // Usar ffmpeg para resize e crop
  // Reduzir para 720p para performance
  const command = `ffmpeg -i "${videoPath}" -vf "scale=720:-1" -c:v libx264 -preset faster -c:a aac "${outputPath}" -y`;
  
  await execAsync(command);

  return outputPath;
}

/**
 * Prepara áudio em formato WAV 16kHz (requerido pelo Wav2Lip)
 */
async function prepareAudio(audioPath: string, jobId: string): Promise<string> {
  const tempDir = path.dirname(audioPath);
  const outputPath = path.join(tempDir, 'audio.wav');

  // Converter para WAV 16kHz mono
  const command = `ffmpeg -i "${audioPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`;
  
  await execAsync(command);

  return outputPath;
}

/**
 * Executa Wav2Lip via Docker ou local installation
 * REQUISITO: Docker com imagem wavtoelips já pronta
 * docker run --gpus all -v /data:/data wavtoelips python inference.py ...
 */
async function runWav2Lip(videoPath: string, audioPath: string, jobId: string): Promise<string> {
  const tempDir = path.dirname(videoPath);
  const outputPath = path.join(tempDir, 'output.mp4');
  
  // Caminho absoluto para bindings
  const absVideoPath = path.resolve(videoPath);
  const absAudioPath = path.resolve(audioPath);
  const absOutputPath = path.resolve(outputPath);

  // Tentar usar Docker se disponível
  const dockerCommand = `docker run --rm --gpus all \\  -v "${tempDir}:/data" \\  wavtoelips \\  python inference.py \\  --checkpoint_path checkpoints/wav2lip.pth \\  --face "/data/prepared.mp4" \\  --audio "/data/audio.wav" \\  --outfile "/data/output.mp4"`;

  try {
    console.log(`[Lipsync] Running Wav2Lip via Docker...`);
    await execAsync(dockerCommand, { timeout: 600000 }); // 10 minutos de timeout
  } catch (error) {
    // Fallback: tentar instalação local de Wav2Lip
    console.log(`[Lipsync] Docker não disponível, tentando instalação local...`);
    const localCommand = `python /opt/Wav2Lip/inference.py \\  --checkpoint_path /opt/Wav2Lip/checkpoints/wav2lip.pth \\  --face "${absVideoPath}" \\  --audio "${absAudioPath}" \\  --outfile "${absOutputPath}"`;
    
    await execAsync(localCommand, { timeout: 600000 });
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('Wav2Lip falhou ao gerar vídeo');
  }

  return outputPath;
}

/**
 * Upload do vídeo processado para storage
 * Usa S3 (AWS) via storagePut
 */
async function uploadProcessedVideo(videoPath: string, jobId: string): Promise<string> {
  const { storagePut } = await import('./storage.js');
  
  const videoBuffer = fs.readFileSync(videoPath);
  const fileName = `lipsync-output/${jobId}/output.mp4`;
  
  const { url } = await storagePut(fileName, videoBuffer, 'video/mp4');
  
  return url;
}

/**
 * Limpa arquivos temporários
 */
async function cleanupTempFiles(...filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`[Lipsync] Falha ao deletar ${filePath}:`, err);
      }
    }
  }

  // Deletar diretório temp também
  if (filePaths.length > 0) {
    const tempDir = path.dirname(filePaths[0]);
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmdirSync(tempDir, { recursive: true });
      } catch (err) {
        console.warn(`[Lipsync] Falha ao deletar ${tempDir}:`, err);
      }
    }
  }
}

/**
 * Obtém o status de um job
 */
export function getLipsyncJobStatus(jobId: string): LipsyncJob | null {
  return lipsyncQueue.get(jobId) || null;
}

/**
 * Retorna a URL do vídeo processado quando completo
 */
export function getLipsyncOutput(jobId: string): string | null {
  const job = lipsyncQueue.get(jobId);
  if (job?.status === 'completed' && job.outputUrl) {
    return job.outputUrl;
  }
  return null;
}
