import { prisma } from './prisma';
const WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS = 100; 

// Rate limit by IP
export async function rateLimiter(ip: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  try {
    // Find existing rate limit entry within the window
    const rateLimit = await prisma.rateLimit.findFirst({
      where: {
        user: {
          email: `${ip}@ip.local` // IP-based fake email for identification
        },
        endpoint: 'global',
        windowStart: {
          gte: windowStart
        }
      }
    });

    if (!rateLimit) {
      // Create new window - ensure user exists first
      const user = await prisma.user.upsert({
        where: { email: `${ip}@ip.local` },
        update: {},
        create: {
          name: `IP-${ip}`,
          email: `${ip}@ip.local`
        }
      });

      await prisma.rateLimit.create({
        data: {
          userId: user.id,
          endpoint: 'global',
          requestCount: 1,
          windowStart: now
        }
      });
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.requestCount >= MAX_REQUESTS) {
      return false;
    }

    // Increment count
    await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: { requestCount: { increment: 1 } }
    });

    return true;
  } catch (error) {
    console.error('Rate limiter error:', error);
    return true; // Fail open to avoid blocking legitimate traffic
  }
}

// Rate limit by User ID (for authenticated endpoints)
export async function userRateLimiter(
  auth0Id: string,
  email: string,
  endpoint: string,
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  try {
    // Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { email },
      update: { auth0Id },
      create: {
        name: email.split('@')[0],
        email,
        auth0Id
      }
    });

    // Find or create rate limit entry
    const rateLimit = await prisma.rateLimit.findFirst({
      where: {
        userId: user.id,
        endpoint,
        windowStart: {
          gte: windowStart
        }
      }
    });

    if (!rateLimit) {
      // Create new window
      await prisma.rateLimit.create({
        data: {
          userId: user.id,
          endpoint,
          requestCount: 1,
          windowStart: now
        }
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Check if limit exceeded
    if (rateLimit.requestCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Increment count
    await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: { requestCount: { increment: 1 } }
    });

    return {
      allowed: true,
      remaining: maxRequests - rateLimit.requestCount - 1
    };
  } catch (error) {
    console.error('User rate limiter error:', error);
    return { allowed: true, remaining: maxRequests }; 
  }
}

