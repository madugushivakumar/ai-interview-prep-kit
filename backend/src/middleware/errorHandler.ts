import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred';

  // Structured Error response (Section 36)
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: config.NODE_ENV === 'development' ? err.details : undefined
    }
  });
}
