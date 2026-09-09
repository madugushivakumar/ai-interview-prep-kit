import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env from backend directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8000').transform(val => parseInt(val, 10)),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ai-interview-prep-kit'),
  JWT_SECRET: z.string().default('development_jwt_secret_key_32_characters_minimum_security'),
  COOKIE_SECRET: z.string().default('development_cookie_secret_key'),
  SESSION_MAX_AGE_DAYS: z.string().default('7').transform(val => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  LLM_PROVIDER: z.enum(['gemini', 'groq', 'openai', 'mock']).default('gemini'),
  LLM_MODEL: z.string().default('gemini-2.0-flash'),
  LLM_API_KEY: z.string().default(''),
  ALLOW_LOCAL_CRAWL: z.string().default('true').transform(val => val === 'true'),
  MAX_CRAWL_PAGES: z.string().default('5').transform(val => parseInt(val, 10)),
  CRAWL_TIMEOUT_MS: z.string().default('8000').transform(val => parseInt(val, 10)),
  MAX_PAGE_BYTES: z.string().default('1048576').transform(val => parseInt(val, 10)), // 1 MB
  MAX_COVERAGE_PASSES: z.string().default('3').transform(val => parseInt(val, 10))
});

export const config = EnvSchema.parse(process.env);
