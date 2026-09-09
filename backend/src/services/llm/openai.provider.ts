import axios from 'axios';
import { LLMService } from './llm.interface.js';
import { extractJsonFromText } from './promptSanitizer.js';

export class OpenAICompatibleProvider implements LLMService {
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;

  constructor(apiKey: string, modelName: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    return this.executeWithRetry(async () => {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data?.choices?.[0]?.message?.content || '';
    });
  }

  public async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaDescription: string,
    validateFn?: (parsed: any) => { isValid: boolean; error?: string }
  ): Promise<T> {
    const fullSystemPrompt = `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON conforming to:\n${schemaDescription}`;

    let currentPrompt = userPrompt;
    let lastError = '';
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const raw = await this.generateText(fullSystemPrompt, currentPrompt);
      const candidate = extractJsonFromText(raw);

      try {
        const parsed = JSON.parse(candidate);

        if (validateFn) {
          const validation = validateFn(parsed);
          if (!validation.isValid) {
            throw new Error(`Schema validation error: ${validation.error}`);
          }
        }

        return parsed as T;
      } catch (err: any) {
        lastError = err.message || 'Malformed JSON';
        currentPrompt = `${userPrompt}\n\nATTEMPT ${attempt} FAILED: ${lastError}. Correct and output ONLY valid JSON.`;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }
    }

    const failureErr: any = new Error(`LLM failed to produce valid JSON: ${lastError}`);
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
        const status = err.response?.status;
        const isRateLimit = status === 429;
        const isServerError = status >= 500 && status < 600;

        if ((isRateLimit || isServerError) && attempt < maxRetries) {
          const retryAfter = err.response?.headers?.['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }
}
