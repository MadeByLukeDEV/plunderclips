// src/modules/cron/cron.middleware.ts
// Shared auth guard for all cron routes

import { NextRequest, NextResponse } from 'next/server';

// Accepts both invocation styles:
//   POST  →  Authorization: Bearer <secret>
//   GET   →  ?secret=<secret>  (manual triggers, scheduler GETs)
export function verifyCronRequest(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });

  const authHeader = request.headers.get('authorization');
  const querySecret = new URL(request.url).searchParams.get('secret');

  if (authHeader === `Bearer ${secret}` || querySecret === secret) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
