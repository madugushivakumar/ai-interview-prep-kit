import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Security and CORS configuration
  app.use(
    cors({
      origin: [config.FRONTEND_URL, 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  app.use(cookieParser(config.COOKIE_SECRET));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API route was not found.'
      }
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
