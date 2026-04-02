// src/app/api/cron/update-live/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CRON_SECRET = process.env.CRON_SECRET;

async function getAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get('authorization');
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find all currently live Partners/Admins
  const liveUsers = await prisma.user.findMany({
    where: {
      isLive: true,
      role: { in: ['PARTNER', 'ADMIN'] },
    },
    select: { id: true, twitchId: true, twitchLogin: true, displayName: true },
  });

  if (liveUsers.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No live users to update' });
  }

  try {
    const token = await getAppToken();

    // Fetch all live users in one API call
    const userIds = liveUsers.map(u => `user_id=${u.twitchId}`).join('&');
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?${userIds}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
      }
    );

    if (!res.ok) {
      console.error('Twitch API error:', await res.text());
      return NextResponse.json({ error: 'Twitch API error' }, { status: 502 });
    }

    const data = await res.json();
    const streams: any[] = data.data || [];

    // Update each live user from stream data
    let updated = 0;
    for (const user of liveUsers) {
      const stream = streams.find(s => s.user_id === user.twitchId);

      if (stream) {
        // Still live — update info
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
        // Was marked live but Twitch says offline — fix it
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isLive: false,
            viewerCount: null,
            streamTitle: null,
            streamGame: null,
            liveUpdatedAt: new Date(),
          },
        });
        console.log(`Fixed stale live status for ${user.twitchLogin}`);
      }
    }

    return NextResponse.json({
      updated,
      total: liveUsers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Cron update-live error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Allow GET for easy testing in browser when secret is in query param
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Reuse POST logic by forwarding
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  }));
}