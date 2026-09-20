import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * NOTE: This rate limiter uses an in-memory Map and is per-instance only.
 * When running across multiple container instances or serverless workers,
 * state is not shared between instances. For single-container deployments
 * like Render Web Services, this provides lightweight and effective DoS protection.
 */
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Extracts client IP address from NextRequest, reading the first address
 * from x-forwarded-for when deployed behind reverse proxies (like Render / Cloudflare).
 */
export function getClientIp(req: Request | NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // The first IP in the comma-separated list is the original client IP
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and updates rate limit for an identifier (e.g., prefix + IP).
 *
 * @param key Unique key for the rate limit bucket (e.g. "reg:192.168.1.1")
 * @param maxRequests Maximum allowed requests within the window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (existing.count >= maxRequests) {
    const resetInSeconds = Math.ceil((existing.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.ceil((existing.resetTime - now) / 1000);
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInSeconds: Math.max(1, resetInSeconds),
  };
}
