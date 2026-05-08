// src/app/api/cron/update-stats/route.ts
// Runs every 6 hours — refreshes YouTube view counts + Twitch profile images
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/modules/cron/cron.middleware';
import { refreshYouTubeViewCounts, refreshProfileImages } from '@/modules/cron/cron.service';
import { invalidate, invalidatePattern } from '@/lib/redis';
import { CACHE_KEY_TRENDING, CACHE_KEY_FEATURED } from '@/modules/clips/clips.service';
import { CACHE_KEY_STREAMERS_ALL } from '@/modules/streamers/streamers.service';

export async function POST(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  try {
    const [youtube, profiles] = await Promise.all([
      refreshYouTubeViewCounts(),
      refreshProfileImages(),
    ]);
    await Promise.all([
      invalidate(CACHE_KEY_TRENDING, CACHE_KEY_FEATURED, CACHE_KEY_STREAMERS_ALL),
      invalidatePattern('streamer:*'),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      youtube,
      profiles,
    });
  } catch (err) {
    console.error('Cron update-stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
