/**
 * slideSyncController.ts — Controlador de sincronia slide/fala
 * 
 * Sincroniza a transição de slides com a narração do professor avatar
 * Garante que cada slide apareça no momento certo durante a explicação
 */

export interface SlideTransition {
  slideIndex: number;
  startTime: number; // em ms
  duration: number; // em ms
  content: string;
  animationType: 'fade' | 'slide' | 'zoom' | 'appear';
}

export interface SlideSyncConfig {
  totalSlides: number;
  audioLength: number; // duração total do áudio em ms
  averageTimePerSlide: number; // ms
  slides: SlideTransition[];
}

/**
 * Calcula os tempos de transição dos slides baseado no áudio
 * Distribui os slides ao longo da duração total do áudio
 */
export function calculateSlideTimings(
  totalSlides: number,
  audioLengthMs: number,
  slideContents: string[]
): SlideTransition[] {
  const slides: SlideTransition[] = [];
  const timePerSlide = audioLengthMs / totalSlides;
  
  for (let i = 0; i < totalSlides; i++) {
    slides.push({
      slideIndex: i,
      startTime: i * timePerSlide,
      duration: timePerSlide,
      content: slideContents[i] || `Slide ${i + 1}`,
      animationType: selectAnimationType(i, totalSlides)
    });
  }

  return slides;
}

/**
 * Seleciona animação baseado em posição e tipo de conteúdo
 */
function selectAnimationType(
  slideIndex: number,
  totalSlides: number
): 'fade' | 'slide' | 'zoom' | 'appear' {
  if (slideIndex === 0) return 'appear'; // Primeiro slide aparece
  if (slideIndex === totalSlides - 1) return 'fade'; // Último slide desvanece
  
  // Alternar entre fade e zoom para variedade
  return slideIndex % 2 === 0 ? 'fade' : 'zoom';
}

/**
 * Ajusta tempos de slide baseado em palavras-chave no áudio
 * Ex: se há pausa naturais, coloca novos slides nesses momentos
 */
export function adjustTimingsByPauses(
  slides: SlideTransition[],
  audioText: string,
  audioDuration: number
): SlideTransition[] {
  const sentences = audioText.split(/[.!?]+/).filter(s => s.trim());
  
  if (sentences.length === 0) return slides;

  // Distribuir slides por sentença ao invés de uniformemente
  const avgWordsPerSentence = audioText.split(/\s+/).length / sentences.length;
  const avgMsPerWord = audioDuration / audioText.split(/\s+/).length;

  const adjustedSlides: SlideTransition[] = [];
  let currentTime = 0;

  for (let i = 0; i < slides.length; i++) {
    const wordCount = slides[i].content.split(/\s+/).length;
    const estimatedDuration = Math.max(
      wordCount * avgMsPerWord,
      1000 // Mínimo 1 segundo por slide
    );

    adjustedSlides.push({
      ...slides[i],
      startTime: currentTime,
      duration: estimatedDuration
    });

    currentTime += estimatedDuration;
  }

  return adjustedSlides;
}

/**
 * Gera CSS/JS para animar transição de slides no frontend
 * Retorna código que pode ser injetado no player
 */
export function generateSlideAnimationCode(slides: SlideTransition[]): string {
  const keyframes = slides
    .map((slide, idx) => {
      const startPercent = (slide.startTime / (slides[slides.length - 1]?.startTime + slides[slides.length - 1]?.duration || 1)) * 100;
      const endPercent = ((slide.startTime + slide.duration) / (slides[slides.length - 1]?.startTime + slides[slides.length - 1]?.duration || 1)) * 100;
      
      return `
        /* Slide ${idx} */
        @keyframes slide-${idx} {
          0% { opacity: 0; transform: ${getTransformForAnimation(slide.animationType, 'in')}; }
          ${startPercent}% { opacity: 1; transform: translateZ(0); }
          ${endPercent}% { opacity: 1; transform: translateZ(0); }
          100% { opacity: 0; transform: ${getTransformForAnimation(slide.animationType, 'out')}; }
        }
        
        .slide-${idx} {
          animation: slide-${idx} linear 1ms;
        }
      `;
    })
    .join('\n');

  return `<style>${keyframes}</style>`;
}

/**
 * Retorna transform CSS baseado no tipo de animação
 */
function getTransformForAnimation(type: string, direction: 'in' | 'out'): string {
  switch (type) {
    case 'fade':
      return 'opacity: 0';
    case 'slide':
      return direction === 'in' ? 'translateX(-100%)' : 'translateX(100%)';
    case 'zoom':
      return direction === 'in' ? 'scale(0.8)' : 'scale(1.2)';
    case 'appear':
      return 'opacity: 0';
    default:
      return 'opacity: 0';
  }
}

/**
 * Cria timeline JSON para controle granular no frontend
 * Formato: { "slides": [ { "index": 0, "startMs": 0, "durationMs": 2000, "animation": "fade" } ] }
 */
export function exportSlideTimeline(slides: SlideTransition[]): string {
  return JSON.stringify(
    {
      slides: slides.map(s => ({
        index: s.slideIndex,
        startMs: Math.round(s.startTime),
        durationMs: Math.round(s.duration),
        animation: s.animationType,
        content: s.content
      }))
    },
    null,
    2
  );
}

/**
 * Obtém o slide atual baseado no tempo de reprodução
 */
export function getCurrentSlide(slides: SlideTransition[], currentTimeMs: number): SlideTransition | null {
  return slides.find(
    slide => currentTimeMs >= slide.startTime && currentTimeMs < slide.startTime + slide.duration
  ) || null;
}

/**
 * Prediz qual slide será exibido em um tempo futuro
 */
export function predictNextSlide(slides: SlideTransition[], currentTimeMs: number): SlideTransition | null {
  return slides.find(slide => slide.startTime > currentTimeMs) || null;
}
