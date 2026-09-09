import { LLMService } from './llm.interface.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAICompatibleProvider } from './openai.provider.js';
import { MockLLMProvider } from './mock.provider.js';
import { config } from '../../config/env.js';

export class LLMFactory {
  private static instance: LLMService;

  public static getProvider(overrideProvider?: string): LLMService {
    if (this.instance && !overrideProvider) {
      return this.instance;
    }

    const providerType = overrideProvider || config.LLM_PROVIDER;

    // In automated testing or when no API key is configured, safely use Mock provider
    if (config.NODE_ENV === 'test' || !config.LLM_API_KEY || providerType === 'mock') {
      const mock = new MockLLMProvider();
      if (!overrideProvider) this.instance = mock;
      return mock;
    }

    switch (providerType) {
      case 'gemini':
        this.instance = new GeminiProvider(config.LLM_API_KEY, config.LLM_MODEL || 'gemini-2.0-flash');
        break;

      case 'groq':
        this.instance = new OpenAICompatibleProvider(
          config.LLM_API_KEY,
          config.LLM_MODEL || 'llama-3.3-70b-versatile',
          'https://api.groq.com/openai/v1'
        );
        break;

      case 'openai':
        this.instance = new OpenAICompatibleProvider(
          config.LLM_API_KEY,
          config.LLM_MODEL || 'gpt-4o-mini',
          'https://api.openai.com/v1'
        );
        break;

      default:
        this.instance = new MockLLMProvider();
        break;
    }

    return this.instance;
  }
}
