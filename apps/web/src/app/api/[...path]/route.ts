import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

async function handler(req: NextRequest) {
  const url = `${BACKEND}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (k !== 'host') headers.set(k, v);
  });

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-expect-error duplex is required for streaming body in Node fetch
    duplex: 'half',
  });

  const resHeaders = new Headers();
  res.headers.forEach((v, k) => {
    if (k !== 'content-encoding' && k !== 'transfer-encoding') resHeaders.set(k, v);
  });

  return new NextResponse(res.body, { status: res.status, headers: resHeaders });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
