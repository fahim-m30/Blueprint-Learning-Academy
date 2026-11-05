import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate limiter
const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    ipRequestMap.forEach((record, ip) => {
      if (now > record.resetTime) {
        ipRequestMap.delete(ip);
      }
    });
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  // Extract client IP address from standard headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const now = Date.now();
  const record = ipRequestMap.get(clientIp);

  if (!record || now > record.resetTime) {
    ipRequestMap.set(clientIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  record.count += 1;

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSec: Math.ceil((record.resetTime - now) / 1000),
  };
}
