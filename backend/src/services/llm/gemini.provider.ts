import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMService } from './llm.interface.js';
import { extractJsonFromText } from './promptSanitizer.js';

export class GeminiProvider implements LLMService {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    if (!apiKey) {
      throw new Error('LLM_API_KEY is required for Gemini provider');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  public async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt
    });

    return this.executeWithRetry(async () => {
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text() || '';
    });
  }

  public async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaDescription: string,
    validateFn?: (parsed: any) => { isValid: boolean; error?: string }
  ): Promise<T> {
    const fullSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a single valid JSON object or array conforming strictly to:\n${schemaDescription}\nDo not include any prose, explanation, or conversational markdown outside the JSON.`;

    let currentPrompt = userPrompt;
    let lastError = '';
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const rawResponse = await this.generateText(fullSystemPrompt, currentPrompt);
      const jsonCandidate = extractJsonFromText(rawResponse);

      try {
        const parsed = JSON.parse(jsonCandidate);

        if (validateFn) {
          const validation = validateFn(parsed);
          if (!validation.isValid) {
            throw new Error(`Schema validation error: ${validation.error}`);
          }
        }

        return parsed as T;
      } catch (err: any) {
        lastError = err.message || 'Malformed JSON';
        // Add correction feedback for the retry prompt
        currentPrompt = `${userPrompt}\n\nATTEMPT ${attempt} FAILED with error: ${lastError}.\nPlease correct the JSON output and output ONLY the valid JSON structure.`;
        
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }
    }

    const failureErr: any = new Error(`LLM failed to produce valid JSON after ${maxRetries} attempts: ${lastError}`);
    failureErr.code = 'LLM_INVALID_JSON';
    throw failureErr;
  }

  private async executeWithRetry<R>(fn: () => Promise<R>, maxRetries: number = 3): Promise<R> {
    let lastErr: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const msg = (err.message || '').toLowerCase();
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('rate limit');
        const isTransient = isRateLimit || msg.includes('503') || msg.includes('timeout') || msg.includes('overloaded');

        if (isTransient && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }
}
