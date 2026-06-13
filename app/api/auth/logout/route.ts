import { NextResponse } from "next/server";

const SESSION_COOKIE = "session";

/** Clears session cookie on Next.js (works even when FastAPI is down). */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
