import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rateLimit.js';

describe('Rate Limiting Middleware', () => {
  it('should enforce maximum requests within the window and set headers', () => {
    // Force TEST_RATE_LIMIT=true so test is not skipped
    process.env.TEST_RATE_LIMIT = 'true';

    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 3,
      message: 'Rate limit hit',
      code: 'TEST_RATE_LIMITED'
    });

    const headers: Record<string, any> = {};
    const res: any = {
      setHeader: (name: string, val: any) => {
        headers[name] = val;
      },
      status: (code: number) => {
        res.statusCode = code;
        return res;
      },
      json: (data: any) => {
        res.body = data;
        return res;
      }
    };

    const req: any = { ip: '127.0.0.1' };
    let nextCount = 0;
    const next = () => { nextCount++; };

    // Requests 1, 2, 3 should pass
    limiter(req, res, next);
    expect(nextCount).toBe(1);
    expect(headers['X-RateLimit-Remaining']).toBe(2);

    limiter(req, res, next);
    expect(nextCount).toBe(2);
    expect(headers['X-RateLimit-Remaining']).toBe(1);

    limiter(req, res, next);
    expect(nextCount).toBe(3);
    expect(headers['X-RateLimit-Remaining']).toBe(0);

    // Request 4 should be blocked with 429
    limiter(req, res, next);
    expect(nextCount).toBe(3); // Next was not called
    expect(res.statusCode).toBe(429);
    expect(res.body.error.code).toBe('TEST_RATE_LIMITED');
    expect(headers['Retry-After']).toBeGreaterThanOrEqual(1);

    delete process.env.TEST_RATE_LIMIT;
  });
});
