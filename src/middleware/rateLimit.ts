/**
 * Rate Limiting Middleware
 */

const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Rate limit check
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Create new rate limit window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return true;
  }

  // Check if within limit
  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  return false;
}

/**
 * Get rate limit info
 */
export function getRateLimitInfo(
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): { remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    return {
      remaining: maxRequests,
      resetTime: now + windowSeconds * 1000,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Clean up expired entries
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 300000);
