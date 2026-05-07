// src/app/api/cron/update-stats/route.ts
// Runs every 6 hours — refreshes YouTube view counts + Twitch profile images
import { NextRequest, NextResponse } from 'next/server';
import { refreshYouTubeViewCounts, refreshProfileImages } from '@/modules/admin/admin.service';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [youtube, profiles] = await Promise.all([
      refreshYouTubeViewCounts(),
      refreshProfileImages(),
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
  const { searchParams } = new URL(request.url);
  if (!CRON_SECRET || searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    }),
  );
}
