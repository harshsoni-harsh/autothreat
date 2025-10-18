import { NextResponse, type NextRequest } from "next/server";
import { checkIpRateLimit } from "@/lib/rateLimiterEdge";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  // 1️⃣ Global IP rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { allowed, remaining, reset } = await checkIpRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests", resetAfter: reset },
      { status: 429 }
    );
  }

  // 2️⃣ Let Auth0 handle /auth paths
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return auth0.middleware(request); // Important!
  }

  // 3️⃣ Allow public/static paths
  const publicRoutes = ["/", "/logo.png", "/favicon.ico"];
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // 4️⃣ Allow specific API routes
  const allowedApiRoutes = ["/api/docs/", "/api/sbom/sync/"];
  for (const route of allowedApiRoutes) {
    if (request.nextUrl.pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }

  // 5️⃣ Auth0 session verification for all other routes
  const session = await auth0.getSession(request);
  if (!session) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/api/auth/login`); // use API route directly
  }

  // 6️⃣ Attach user headers
  const res = NextResponse.next();
  res.headers.set("x-user-id", session.user.sub ?? "");
  res.headers.set("x-user-email", session.user.email ?? "");
  res.headers.set("x-rate-remaining", remaining.toString());
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
