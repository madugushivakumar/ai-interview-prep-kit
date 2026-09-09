import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JwtPayload } from '../types/auth.js';
import { User, IUser } from '../models/User.js';

// Extend Express Request to attach authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const AUTH_COOKIE_NAME = 'ai_prep_token';

/**
 * Authentication Middleware
 * Validates JWT token from secure HTTP-only cookie.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.'
      }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'User session no longer valid.'
        }
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired or is invalid. Please log in again.'
      }
    });
  }
}
