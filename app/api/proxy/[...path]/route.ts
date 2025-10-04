import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_TERRALINK_BASE_URL!;
const JWT_COOKIE = process.env.JWT_COOKIE_NAME || "ef_session";

export async function GET(req: NextRequest, { params }: { params: { path: string[] }}) { return forward(req, params.path); }
export async function POST(req: NextRequest, ctx: any) { return forward(req, ctx.params.path); }
export async function DELETE(req: NextRequest, ctx: any) { return forward(req, ctx.params.path); }
export async function PUT(req: NextRequest, ctx: any) { return forward(req, ctx.params.path); }
export async function PATCH(req: NextRequest, ctx: any) { return forward(req, ctx.params.path); }

async function forward(req: NextRequest, path: string[]) {
  const token = cookies().get(JWT_COOKIE)?.value;
  const url = `${BASE}/${path.join("/")}${req.nextUrl.search || ""}`;
  const r = await fetch(url, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
      // Add X-API-Key header for backend authentication
      ...(token ? { 
        "authorization": `Bearer ${token}`,
        "X-API-Key": token  // Backend expects this header
      } : {}),
    },
    body: ["GET","HEAD"].includes(req.method) ? undefined : await req.text(),
    cache: "no-store",
  });
  
  // Special handling for 204 status code (No Content)
  if (r.status === 204) {
    return new NextResponse(null, { 
      status: 204,
      headers: { "content-type": r.headers.get("content-type") || "application/json" }
    });
  }
  
  const body = await r.text();
  return new NextResponse(body, { 
    status: r.status, 
    headers: { "content-type": r.headers.get("content-type") || "application/json" }
  });
}
