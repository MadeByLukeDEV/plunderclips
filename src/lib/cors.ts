import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.NEXTAUTH_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

export function corsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin === allowed || allowed === '*');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    });
  }

  const isAllowed = !origin || ALLOWED_ORIGINS.some(allowed => origin === allowed);
  if (!isAllowed) {
    return NextResponse.json({ error: 'CORS: Origin not allowed' }, { status: 403 });
  }

  return null;
}

export function withCors(response: NextResponse, origin: string | null): NextResponse {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
