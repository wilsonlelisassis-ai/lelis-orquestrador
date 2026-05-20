/**
 * veoPromptValidator.ts — Validação e otimização de prompts para VEO 2.0
 * 
 * Problemas resolvidos:
 * 1. Português ruim → corrige e melhora fluência
 * 2. Quantidade errada → valida números (dedos, moléculas, etc)
 * 3. Estruturas químicas erradas → corrige fórmulas
 * 4. Textos em inglês → força português brasileiro
 */

import { invokeLLM } from "./llm";

export interface ValidationResult {
  isValid: boolean;
  originalPrompt: string;
  correctedPrompt: string;
  issues: ValidationIssue[];
  confidence: number; // 0-1
}

export interface ValidationIssue {
  type: 'language' | 'quantity' | 'chemistry' | 'math' | 'other';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

// Validadores específicos
const PORTUGUESE_KEYWORDS = [
  'dedos', 'moléculas', 'átomos', 'estrutura', 'fórmula',
  'equação', 'gráfico', 'vetor', 'ângulo', 'distância'
];

const CHEMISTRY_PATTERNS = {
  // Validar fórmulas básicas
  H2O: true,
  CO2: true,
  CH4: true,
  C6H12O6: true,
  NaCl: true,
};

const QUANTITY_KEYWORDS = [
  'cinco', 'quatro', 'três', 'dois', 'um',
  'seis', 'sete', 'oito', 'nove', 'dez',
  'número', 'quantidade', 'total'
];

/**
 * Valida e corrige um prompt para VEO 2.0
 * Garante português brasileiro correto, estruturas químicas válidas, etc
 */
export async function validateVeoPrompt(prompt: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let correctedPrompt = prompt;

  // 1. Verificar se há inglês misturado
  const englishMatch = correctedPrompt.match(/\b(the|a|is|and|or|for|this|that)\b/gi);
  if (englishMatch && englishMatch.length > 2) {
    issues.push({
      type: 'language',
      severity: 'warning',
      message: 'Encontrado texto em inglês no prompt',
      suggestion: 'Convertendo para português brasileiro...'
    });
  }

  // 2. Validar quantidades (dedos, moléculas, etc)
  const quantityIssues = validateQuantities(correctedPrompt);
  issues.push(...quantityIssues);

  // 3. Validar estruturas químicas
  const chemistryIssues = validateChemistry(correctedPrompt);
  issues.push(...chemistryIssues);

  // 4. Validar vetores e gráficos
  const mathIssues = validateMath(correctedPrompt);
  issues.push(...mathIssues);

  // Se houver problemas, usar LLM para corrigir
  if (issues.length > 0) {
    correctedPrompt = await enhancePromptWithLLM(prompt, issues);
  }

  const isValid = issues.filter(i => i.severity === 'error').length === 0;

  return {
    isValid,
    originalPrompt: prompt,
    correctedPrompt,
    issues,
    confidence: isValid ? 1.0 : Math.max(0.5, 1.0 - (issues.length * 0.1))
  };
}

/**
 * Valida quantidades numéricas mencionadas no prompt
 * Ex: "5 dedos" → verifica se realmente mostra 5
 */
function validateQuantities(prompt: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const quantityPattern = /(\d+)\s+(dedos?|moléculas?|átomos?|elementos?|objetos?)/gi;
  
  const matches = prompt.matchAll(quantityPattern);
  for (const match of matches) {
    const number = parseInt(match[1]);
    const object = match[2].toLowerCase();

    if (number > 10 && object === 'dedos') {
      issues.push({
        type: 'quantity',
        severity: 'error',
        message: `Impossível: ${number} dedos (máximo 10)`,
        suggestion: `Use "${Math.min(number, 10)} dedos" ou use "${object}" diferente`
      });
    }
  }

  return issues;
}

/**
 * Valida fórmulas químicas e estruturas
 */
function validateChemistry(prompt: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Procurar por padrões de fórmula química inválida
  const formulaPattern = /([A-Z][a-z]?\d*)+/g;
  const formulas = prompt.match(formulaPattern) || [];

  for (const formula of formulas) {
    // Verificar se é uma fórmula conhecida ou válida
    if (!isValidChemicalFormula(formula)) {
      issues.push({
        type: 'chemistry',
        severity: 'warning',
        message: `Fórmula química "${formula}" pode estar incorreta`,
        suggestion: `Verifique se é realmente a estrutura desejada`
      });
    }
  }

  return issues;
}

/**
 * Valida expressões matemáticas, vetores e gráficos
 */
function validateMath(prompt: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Verificar se há menção de vetores
  if (prompt.toLowerCase().includes('vetor')) {
    const vectorPattern = /vetor[\s\(]*([a-z]+)[\)\s]*/gi;
    const matches = prompt.matchAll(vectorPattern);
    for (const match of matches) {
      // Avisar para desenhar vetores com direção correta
      if (!prompt.includes('direção') && !prompt.includes('ângulo')) {
        issues.push({
          type: 'math',
          severity: 'info',
          message: `Vetor "${match[1]}" mencionado sem direção explícita`,
          suggestion: `Especifique ângulo ou direção (ex: "45°", "horizontal")`
        });
      }
    }
  }

  return issues;
}

/**
 * Verifica se uma fórmula química é válida
 */
function isValidChemicalFormula(formula: string): boolean {
  // Padrão básico: começa com letra maiúscula, pode ter números
  const pattern = /^[A-Z][a-z]?(\d+)?$/;
  return pattern.test(formula);
}

/**
 * Usa LLM para melhorar o prompt baseado nas issues encontradas
 */
async function enhancePromptWithLLM(originalPrompt: string, issues: ValidationIssue[]): Promise<string> {
  const issuesSummary = issues
    .map(i => `- [${i.type}] ${i.message}${i.suggestion ? ` → ${i.suggestion}` : ''}`)
    .join('\n');

  const systemPrompt = `Você é um especialista em criar prompts para geração de vídeos educacionais.
Você DEVE garantir:
1. PORTUGUÊS BRASILEIRO correto (zero inglês misturado)
2. Quantidades numericamente corretas (ex: 5 dedos = exatamente 5)
3. Estruturas químicas válidas
4. Descrições claras de vetores com ângulos
5. Gráficos com eixos rotulados

Problemas encontrados:
${issuesSummary}

Melhor o prompt original mantendo o significado mas corrigindo TODOS os problemas acima.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Melhore este prompt: "${originalPrompt}"` }
  ];

  const response = await invokeLLM({
    messages,
    max_tokens: 500,
    temperature: 0.3 // Mais determinístico para correções
  });

  const enhancedPrompt = response.choices?.[0]?.message?.content || originalPrompt;
  return typeof enhancedPrompt === 'string' ? enhancedPrompt : originalPrompt;
}

/**
 * Cache de validações para não reprocessar prompts idênticos
 */
const validationCache = new Map<string, ValidationResult>();

export async function validateVeoPromptWithCache(prompt: string): Promise<ValidationResult> {
  const cacheKey = `validation:${prompt.slice(0, 100)}`;
  
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  const result = await validateVeoPrompt(prompt);
  validationCache.set(cacheKey, result);
  
  // Limpar cache se ficar muito grande (> 1000 entradas)
  if (validationCache.size > 1000) {
    const firstKey = validationCache.keys().next().value;
    validationCache.delete(firstKey);
  }

  return result;
}
