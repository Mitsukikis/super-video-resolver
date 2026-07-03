import { NextRequest, NextResponse } from "next/server";
import { cookieName, makeSessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!process.env.ACCESS_CODE || body.accessCode !== process.env.ACCESS_CODE) {
    return NextResponse.json({ ok: false, error: "访问码不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_BASE_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
