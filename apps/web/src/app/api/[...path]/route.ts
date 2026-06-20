import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

async function handler(req: NextRequest) {
  const url = `${BACKEND}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (k !== 'host' && k !== 'connection') headers.set(k, v);
  });

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
    redirect: 'manual', // pass 3xx through to the browser instead of following them
  });

  const resHeaders = new Headers();
  res.headers.forEach((v, k) => {
    if (k !== 'content-encoding' && k !== 'transfer-encoding') resHeaders.set(k, v);
  });

  if (res.status >= 300 && res.status < 400) {
    return new NextResponse(null, { status: res.status, headers: resHeaders });
  }

  const data = await res.arrayBuffer();
  return new NextResponse(data, { status: res.status, headers: resHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
