// src/app/api/cron/update-live/route.ts
// Runs every 5 minutes — keeps live streamer status and viewer counts fresh
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/modules/cron/cron.middleware';
import { refreshLiveStatuses } from '@/modules/cron/cron.service';
import { invalidate, invalidatePattern } from '@/lib/redis';
import { CACHE_KEY_LIVE } from '@/modules/live/live.service';
import { CACHE_KEY_STREAMERS_ALL } from '@/modules/streamers/streamers.service';

export async function POST(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  try {
    const result = await refreshLiveStatuses();
    await Promise.all([
      invalidate(CACHE_KEY_LIVE, CACHE_KEY_STREAMERS_ALL),
      invalidatePattern('streamer:*'),
    ]);
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...result });
  } catch (err) {
    console.error('Cron update-live error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
