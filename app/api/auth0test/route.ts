import { NextRequest, NextResponse } from "next/server";
import { verifyAuth0Token } from "@/lib/auth0";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const decoded = verifyAuth0Token(token);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 403 });
  }

  return NextResponse.json({ message: "Auth0 token verified", user: decoded });
}
