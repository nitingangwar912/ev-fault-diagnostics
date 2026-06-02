import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Global rate limiter — 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Per-session token bucket for chat endpoint — 20 messages per minute per session
const sessionBuckets = new Map<string, { count: number; resetAt: number }>();

export function sessionRateLimiter(req: Request, res: Response, next: Function): void {
  const sessionId = (req.headers['x-session-id'] as string) || req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxPerWindow = 20;

  const bucket = sessionBuckets.get(sessionId);

  if (!bucket || now > bucket.resetAt) {
    sessionBuckets.set(sessionId, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= maxPerWindow) {
    res.status(429).json({
      error: 'Rate limit exceeded. Maximum 20 messages per minute per session.'
    });
    return;
  }

  bucket.count++;
  next();
}

// Clean up expired buckets every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of sessionBuckets.entries()) {
    if (now > bucket.resetAt) sessionBuckets.delete(key);
  }
}, 5 * 60 * 1000);
