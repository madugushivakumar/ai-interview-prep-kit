export interface LLMService {
  /**
   * Generates a raw text completion with clear system / user boundaries.
   */
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;

  /**
   * Generates and parses a strictly validated JSON structure.
   * Includes bounded retries with error feedback if the model produces malformed JSON.
   */
  generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaDescription: string,
    validateFn?: (parsed: any) => { isValid: boolean; error?: string }
  ): Promise<T>;
}
