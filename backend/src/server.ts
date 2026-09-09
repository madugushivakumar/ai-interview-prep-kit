import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function bootstrap() {
  const app = createApp();

  try {
    await connectDatabase();
  } catch (err: any) {
    console.warn(`[Server] Starting HTTP server despite database warning: ${err.message}`);
  }

  app.listen(config.PORT, () => {
    console.log(`====================================================`);
    console.log(`AI Interview Prep Kit Backend running on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`LLM Provider: ${config.LLM_PROVIDER} (${config.LLM_MODEL})`);
    console.log(`====================================================`);
  });
}

bootstrap().catch(err => {
  console.error('[Fatal Bootstrap Error]:', err);
  process.exit(1);
});
