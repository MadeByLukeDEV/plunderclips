// src/app/api/cron/update-stats/route.ts
// Runs every 6 hours — refreshes YouTube view counts + Twitch profile images
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTwitchProfileImage } from '@/lib/images';

const CRON_SECRET = process.env.CRON_SECRET;

async function getTwitchAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

// ── YouTube view counts ───────────────────────────────────────────────────────
async function updateYouTubeViewCounts() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { updated: 0, reason: 'No YOUTUBE_API_KEY' };

  const clips = await prisma.clip.findMany({
    where: { platform: 'YOUTUBE', status: 'APPROVED' },
    select: { id: true, twitchClipId: true, viewCount: true },
  });

  if (clips.length === 0) return { updated: 0, total: 0 };

  const videoMap = new Map<string, string>();
  for (const clip of clips) {
    videoMap.set(clip.twitchClipId.replace(/^yt_/, ''), clip.id);
  }

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
    if (!res.ok) continue;

    const data = await res.json();
    for (const item of data.items || []) {
      const clipId = videoMap.get(item.id);
      if (!clipId) continue;

      const newCount = parseInt(item.statistics?.viewCount || '0', 10);
      const existing = clips.find(c => c.id === clipId);
      if (existing && newCount !== existing.viewCount) {
        await prisma.clip.update({ where: { id: clipId }, data: { viewCount: newCount } });
        updated++;
      }
    }
  }

  return { updated, total: clips.length };
}

// ── Twitch profile images ─────────────────────────────────────────────────────
async function refreshProfileImages(token: string) {
  const users = await prisma.user.findMany({
    select: { id: true, twitchId: true, profileImage: true },
  });

  if (users.length === 0) return { updated: 0, total: 0 };

  const chunks: typeof users[] = [];
  for (let i = 0; i < users.length; i += 100) {
    chunks.push(users.slice(i, i + 100));
  }

  let updated = 0;
  for (const chunk of chunks) {
    const ids = chunk.map(u => `id=${u.twitchId}`).join('&');
    const res = await fetch(
      `https://api.twitch.tv/helix/users?${ids}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': process.env.TWITCH_CLIENT_ID! } }
    );
    if (!res.ok) continue;

    const data = await res.json();
    for (const tu of data.data || []) {
      const dbUser = chunk.find(u => u.twitchId === tu.id);
      if (!dbUser) continue;

      const freshImage = getTwitchProfileImage(tu.profile_image_url, 150);
      if (freshImage !== dbUser.profileImage) {
        await prisma.user.update({ where: { id: dbUser.id }, data: { profileImage: freshImage } });
        updated++;
      }
    }
  }

  return { updated, total: users.length };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = await getTwitchAppToken();
    const [youtubeResult, profileResult] = await Promise.all([
      updateYouTubeViewCounts(),
      refreshProfileImages(token),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      youtube: youtubeResult,
      profiles: profileResult,
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
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  }));
}