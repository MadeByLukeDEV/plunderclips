// src/app/api/cron/reset-challenges/route.ts
// Runs weekly (Monday 00:01 UTC) — deactivates last week's challenges and seeds new ones
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/modules/cron/cron.middleware';
import { resetWeeklyChallenges } from '@/modules/challenges/challenges.service';

export async function POST(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  try {
    const result = await resetWeeklyChallenges();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...result });
  } catch (err) {
    console.error('Cron reset-challenges error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
