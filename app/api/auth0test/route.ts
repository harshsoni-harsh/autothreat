import { NextRequest, NextResponse } from "next/server";
import { verifyAuth0Token } from "@/lib/auth0";
import { rateLimiter } from "@/lib/ratelimiter";

export async function GET(req: NextRequest) {
  // Get IP for rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? 
             req.headers.get("x-real-ip") ?? 
             "unknown";

  // Rate limit by IP
  const allowed = await rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Get Bearer token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  // Verify token (MUST await!)
  try {
    const decoded = await verifyAuth0Token(token); // ← Fixed: Added await
    
    return NextResponse.json({ 
      message: "Auth0 token verified", 
      user: {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 403 });
  }
}
