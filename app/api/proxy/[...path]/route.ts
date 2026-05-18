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


  const hasBody = !["GET", "HEAD"].includes(req.method);
  const contentType = req.headers.get("content-type") || undefined;
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const r = await fetch(url, {
    method: req.method,
    headers: {
      ...(contentType ? { "content-type": contentType } : {}),
      ...(token ? { 
        "authorization": `Bearer ${token}`
      } : {}),
    },
    body: body as any,
    cache: "no-store",
  });

  if (r.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: { "content-type": r.headers.get("content-type") || "application/json" }
    });
  }

  // Pass SSE streams straight through without buffering
  if (r.headers.get("content-type")?.includes("text/event-stream")) {
    return new NextResponse(r.body, {
      status: r.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "x-accel-buffering": "no",
      },
    });
  }

  const responseHeaders: Record<string, string> = {
    "content-type": r.headers.get("content-type") || "application/json",
  };
  const contentDisposition = r.headers.get("content-disposition");
  if (contentDisposition) {
    responseHeaders["content-disposition"] = contentDisposition;
  }

  const respBody = await r.arrayBuffer();
  return new NextResponse(respBody, {
    status: r.status,
    headers: responseHeaders
  });
}
