import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.NEXTAUTH_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// --- RATE LIMIT CONFIG ---
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // max requests per window per IP

type RateLimitEntry = {
  count: number;
  lastReset: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - entry.lastReset > RATE_LIMIT_WINDOW) {
    // reset window
    entry.count = 1;
    entry.lastReset = now;
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// --- CORS ---
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
  const ip = getClientIP(request);

  // --- RATE LIMIT CHECK ---
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          ...corsHeaders(origin),
          'Retry-After': '60',
        },
      }
    );
  }

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