// src/app/api/cron/update-live/route.ts
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

// ── Twitch live status update ─────────────────────────────────────────────────
async function updateTwitchLiveStatus() {
  const liveUsers = await prisma.user.findMany({
    where: { isLive: true, role: { in: ['PARTNER', 'ADMIN'] } },
    select: { id: true, twitchId: true, twitchLogin: true },
  });

  if (liveUsers.length === 0) return { updated: 0, fixed: 0 };

  const token = await getTwitchAppToken();
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

// ── YouTube view count refresh ────────────────────────────────────────────────
async function updateYouTubeViewCounts() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { updated: 0, skipped: 0, reason: 'No YOUTUBE_API_KEY' };

  // Fetch all approved YouTube clips
  const clips = await prisma.clip.findMany({
    where: { platform: 'YOUTUBE', status: 'APPROVED' },
    select: { id: true, twitchClipId: true, viewCount: true },
  });

  if (clips.length === 0) return { updated: 0, skipped: 0 };

  // Extract raw video IDs (stored as "yt_VIDEO_ID")
  const videoMap = new Map<string, string>(); // videoId → clipId
  for (const clip of clips) {
    const videoId = clip.twitchClipId.replace(/^yt_/, '');
    videoMap.set(videoId, clip.id);
  }

  // YouTube API supports up to 50 IDs per request
  const videoIds = [...videoMap.keys()];
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  let updated = 0;
  for (const chunk of chunks) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}&key=${apiKey}`
    );

    if (!res.ok) {
      console.error('YouTube API error:', await res.text());
      continue;
    }

    const data = await res.json();
    const items: any[] = data.items || [];

    for (const item of items) {
      const clipId = videoMap.get(item.id);
      if (!clipId) continue;

      const newViewCount = parseInt(item.statistics?.viewCount || '0', 10);
      const existing = clips.find(c => c.id === clipId);

      // Only update if count changed — avoids unnecessary DB writes
      if (existing && newViewCount !== existing.viewCount) {
        await prisma.clip.update({
          where: { id: clipId },
          data: { viewCount: newViewCount },
        });
        updated++;
      }
    }
  }

  return { updated, total: clips.length };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [twitchResult, youtubeResult] = await Promise.all([
      updateTwitchLiveStatus(),
      updateYouTubeViewCounts(),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      twitch: twitchResult,
      youtube: youtubeResult,
    });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Allow GET for easy testing with secret in query param
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