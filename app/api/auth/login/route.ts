import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_TERRALINK_BASE_URL!;
const JWT_COOKIE = process.env.JWT_COOKIE_NAME || "ef_session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${BASE}/v1/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) return NextResponse.json(data, { status: r.status });
  // data.access_token is a JWT issued by the platform; frontend doesn't hold plaintext
  cookies().set(JWT_COOKIE, data.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return NextResponse.json({ ok: true });
}
