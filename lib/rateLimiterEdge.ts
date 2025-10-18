// lib/rateLimiterEdge.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis connection (Edge compatible)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a global rate limiter — 100 requests per 60 seconds per IP
export const ipRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "rate-limit:ip",
});

/**
 * Checks if an IP address has exceeded the rate limit.
 * Returns { allowed: boolean, remaining: number, reset: number }
 */
export async function checkIpRateLimit(ip: string) {
  const { success, remaining, reset } = await ipRateLimiter.limit(ip);
  return {
    allowed: success,
    remaining,
    reset,
  };
}
