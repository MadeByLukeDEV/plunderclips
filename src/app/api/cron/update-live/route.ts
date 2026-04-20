// src/app/api/cron/update-live/route.ts
// Runs every 5 minutes — keeps live streamer status and viewer counts fresh
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CRON_SECRET = process.env.CRON_SECRET;

async function getTwitchAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

async function updateTwitchLiveStatus(token: string) {
  const liveUsers = await prisma.user.findMany({
    where: { isLive: true, role: { in: ['PARTNER', 'ADMIN'] } },
    select: { id: true, twitchId: true, twitchLogin: true },
  });

  if (liveUsers.length === 0) return { updated: 0, fixed: 0 };

  const userIds = liveUsers.map(u => `user_id=${u.twitchId}`).join('&');
  const res = await fetch(
    `https://api.twitch.tv/helix/streams?${userIds}`,
    { headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! } }
  );

  if (!res.ok) throw new Error('Twitch API error');

  const data = await res.json();
  const streams: any[] = data.data || [];

  let updated = 0, fixed = 0;
  for (const user of liveUsers) {
    const stream = streams.find(s => s.user_id === user.twitchId);
    if (stream) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          viewerCount: stream.viewer_count ?? 0,
          streamTitle: stream.title || null,
          streamGame: stream.game_name || null,
          liveUpdatedAt: new Date(),
        },
      });
      updated++;
    } else {
      // Still marked live but Twitch says offline — fix stale status
      await prisma.user.update({
        where: { id: user.id },
        data: { isLive: false, viewerCount: null, streamTitle: null, streamGame: null, liveUpdatedAt: new Date() },
      });
      fixed++;
    }
  }
  return { updated, fixed };
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = await getTwitchAppToken();
    const result = await updateTwitchLiveStatus(token);
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), ...result });
  } catch (err) {
    console.error('Cron update-live error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!CRON_SECRET || searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  }));
}