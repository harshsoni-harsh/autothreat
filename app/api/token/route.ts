import { NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";

export async function GET() {
  const token = generateToken({ user: "dev-user", role: "tester" });
  return NextResponse.json({ token });
}
