import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  code?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please try again later.',
    code = 'RATE_LIMITED',
    keyGenerator = (req: Request) => {
      // Use authenticated user ID if available, otherwise IP
      return req.user?._id?.toString() || req.ip || req.socket.remoteAddress || 'unknown-client';
    }
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Disable in test environment to avoid flaky integration tests
    if (process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        error: {
          code,
          message,
          details: {
            retryAfterSeconds: retryAfterSec,
            limit: max,
            windowMs
          }
        }
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for specific routes:
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login/register attempts per window
  code: 'AUTH_RATE_LIMITED',
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

export const generationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 kit generations per hour
  code: 'GENERATION_RATE_LIMITED',
  message: 'Kit generation rate limit exceeded. Please wait before generating additional kits.'
});

export const regenerationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  code: 'REGENERATION_RATE_LIMITED',
  message: 'Regeneration rate limit exceeded. Please slow down.'
});
