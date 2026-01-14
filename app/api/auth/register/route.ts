const BASE = process.env.NEXT_PUBLIC_TERRALINK_BASE_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  
  // Use fields sent by frontend directly
  const platformBody = {
    email: body.email,
    password: body.password
  };
  
  const r = await fetch(`${BASE}/v1/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(platformBody),
    cache: "no-store",
  });
  
  const raw = await r.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { detail: raw || r.statusText };
  }

  const headers = new Headers({ "content-type": "application/json" });
  const retryAfter = r.headers.get("retry-after");
  if (retryAfter) headers.set("retry-after", retryAfter);

  return new Response(JSON.stringify(data), {
    status: r.status,
    headers,
  });
}
