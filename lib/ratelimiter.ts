const requests = new Map<string, { count: number; lastRequest: number }>();
const WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS = 100;
export function rateLimiter(ip: string): boolean {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.lastRequest > WINDOW_MS) {
    requests.set(ip, { count: 1, lastRequest: now });
    return true;
  }
  entry.count += 1;
  entry.lastRequest = now;
  if (entry.count > MAX_REQUESTS) return false;
  return true;
}

