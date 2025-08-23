import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const JWT_COOKIE = process.env.JWT_COOKIE_NAME || "ef_session";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/app")) {
    const token = req.cookies.get(JWT_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/app/:path*"] };
