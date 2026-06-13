import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/verify-session";
import { resolveLegacyHscStudyRedirect } from "@/lib/quiz/unified-routes";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/admin"];
const SESSION_COOKIE = "session";
const ADMIN_COOKIE = "isAdmin";

function clearSessionCookies(response: NextResponse) {
  const opts = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set(SESSION_COOKIE, "", opts);
  response.cookies.set(ADMIN_COOKIE, "", opts);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyHscTarget = resolveLegacyHscStudyRedirect(pathname);
  if (legacyHscTarget) {
    return NextResponse.redirect(new URL(legacyHscTarget, request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  const payload = await verifySessionToken(session.value, secret);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    clearSessionCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/hsc/:subject/:paper/:path*",
    "/hsc/:subject/:paper",
  ],
};
