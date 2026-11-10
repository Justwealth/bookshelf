import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A same-origin gateway forwards tRPC traffic to the separate Node backend.
// Authentication endpoints are mounted separately at /api/auth/*.
async function proxy(request: NextRequest) {
  const origin = new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000")
    .origin;
  if (request.method === "POST" && request.headers.get("origin") !== origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const path = request.nextUrl.pathname.slice("/api/trpc/".length);
  const target = `${process.env.API_URL || "http://127.0.0.1:4000"}/trpc/${path}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of ["content-type", "cookie", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 16384)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        error: {
          message: "Book service is unavailable. Please try again.",
          code: -32603,
          data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 503 },
        },
      },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
