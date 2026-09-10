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

  const server = app.listen(config.PORT, () => {
    console.log(`====================================================`);
    console.log(`AI Interview Prep Kit Backend running on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`LLM Provider: ${config.LLM_PROVIDER} (${config.LLM_MODEL})`);
    console.log(`====================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Error] Port ${config.PORT} is already in use.`);
      console.error(`Another backend instance of AI Interview Prep Kit may already be running on port ${config.PORT}.`);
      console.error(`To inspect or terminate the existing process:`);
      console.error(`  netstat -ano | findstr :${config.PORT}`);
      console.error(`  taskkill /PID <PID> /F\n`);
    } else {
      console.error('[Server Error]:', err);
    }
    process.exit(1);
  });

  const gracefulShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

bootstrap().catch(err => {
  console.error('[Fatal Bootstrap Error]:', err);
  process.exit(1);
});
