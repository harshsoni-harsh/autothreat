import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/ratelimiter";
import { verifyToken } from "@/lib/auth";
import { verifyAuth0Token, auth0 } from "@/lib/auth0";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const publicRoutes = [
    "/api/token",          
    "/api/docs",
    "/api/sbom/sync",
    "/",
    "/logo.png"
  ];

  if (publicRoutes.some(route => url.startsWith(route))) {
    return NextResponse.next();
  }

  if (!url.startsWith("/api")) {
    const session = await auth0.getSession(req);
    if (!session) {
      return NextResponse.redirect(new URL("/api/auth/login", req.url));
    }
    return NextResponse.next();
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? 
             req.headers.get("x-real-ip") ?? 
             "unknown";
             
  if (!rateLimiter(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  let decoded = verifyToken(token);
  
  if (!decoded) {
    decoded = verifyAuth0Token(token);
  }

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};