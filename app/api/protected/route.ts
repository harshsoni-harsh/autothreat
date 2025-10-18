import { NextRequest, NextResponse } from "next/server";
import { verifyAuth0Token } from "@/lib/auth0";
import { rateLimiter } from "@/lib/ratelimiter";

export async function GET(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? 
             req.headers.get("x-real-ip") ?? 
             "unknown";

  if (!rateLimiter(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Get and verify Auth0 token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  try {
    const decoded = await verifyAuth0Token(token);
    return NextResponse.json({ 
      message: "Access granted",
      user: {
        sub: decoded.sub,
        email: decoded.email,
        permissions: decoded.permissions || []
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
