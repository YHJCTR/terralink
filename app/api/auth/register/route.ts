const BASE = process.env.NEXT_PUBLIC_TERRALINK_BASE_URL!;

export async function POST(req: Request) {
  const body = await req.json();
  
  // 直接使用前端发送的字段
  const platformBody = {
    email: body.email,
    password: body.password
  };
  
  const r = await fetch(`${BASE}/v1/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(platformBody),
  });
  
  const data = await r.json();
  return new Response(JSON.stringify(data), { 
    status: r.status, 
    headers: { "content-type": "application/json" }
  });
}
