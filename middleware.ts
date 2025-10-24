import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/ratelimiter";
import { verifyToken } from "@/lib/auth";
import { verifyAuth0Token, auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  if (pathname.startsWith("/auth")) {
    return auth0.middleware(request);
  }
  const publicRoutes = ["/", "/logo.png", "/favicon.ico"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  const allowedApiRoutes = ["/api/docs/", "/api/sbom/sync/"];
  for (const route of allowedApiRoutes) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!rateLimiter(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  if (!pathname.startsWith("/api")) {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }
    return NextResponse.next();
  }
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const decoded = verifyToken(token) || verifyAuth0Token(token);

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
