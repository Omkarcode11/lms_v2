import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (req: NextRequest, limit: number, token: string): {
      success: boolean;
      limit: number;
      remaining: number;
      reset: number;
    } => {
      const now = Date.now();
      const resetTime = now + config.interval;

      if (!store[token]) {
        store[token] = {
          count: 0,
          resetTime,
        };
      }

      const tokenData = store[token];

      // Reset if interval has passed
      if (now > tokenData.resetTime) {
        tokenData.count = 0;
        tokenData.resetTime = resetTime;
      }

      tokenData.count++;

      const remaining = Math.max(0, limit - tokenData.count);
      const success = tokenData.count <= limit;

      return {
        success,
        limit,
        remaining,
        reset: tokenData.resetTime,
      };
    },
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

