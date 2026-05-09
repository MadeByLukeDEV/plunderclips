// src/modules/cron/cron.service.ts
// All scheduled job logic — no HTTP concerns

import { prisma } from '@/lib/prisma';
import { getTwitchProfileImage } from '@/lib/images';
import { fetchLiveStreams, getTwitchAppToken } from '@/modules/platform/twitch.service';
import { LIVE_ROLES } from '@/modules/live/live.service';
import type { RefreshLiveResult, RefreshCountResult } from './cron.types';

// ── Job: refresh live viewer counts + fix stale statuses ─────────────────────
// Called every 5 minutes by /api/cron/update-live

export async function refreshLiveStatuses(): Promise<RefreshLiveResult> {
  const liveUsers = await prisma.user.findMany({
    where: {
      role: { in: LIVE_ROLES },
      liveStatus: { isLive: true },
    },
    select: { id: true, twitchId: true },
  });

  if (liveUsers.length === 0) return { updated: 0, fixed: 0 };

  const streams = await fetchLiveStreams(liveUsers.map((u) => u.twitchId));
  const streamMap = new Map(streams.map((s) => [s.user_id, s]));

  let updated = 0;
  let fixed = 0;

  for (const user of liveUsers) {
    const stream = streamMap.get(user.twitchId);

    if (stream) {
      await prisma.userLiveStatus.update({
        where: { userId: user.id },
        data: {
          viewerCount: stream.viewer_count ?? 0,
          streamTitle: stream.title || null,
          streamGame: stream.game_name || null,
          liveUpdatedAt: new Date(),
        },
      });
      updated++;
    } else {
      // Still marked live but absent from Twitch stream list — fix stale status
      await prisma.userLiveStatus.update({
        where: { userId: user.id },
        data: {
          isLive: false,
          viewerCount: null,
          streamTitle: null,
          streamGame: null,
          liveUpdatedAt: new Date(),
        },
      });
      fixed++;
    }
  }

  return { updated, fixed };
}

// ── Job: refresh YouTube view counts ─────────────────────────────────────────
// Called every 6 hours by /api/cron/update-stats

export async function refreshYouTubeViewCounts(): Promise<RefreshCountResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { updated: 0, total: 0 };

  const clips = await prisma.clip.findMany({
    where: { platform: 'YOUTUBE', moderation: { status: 'APPROVED' } },
    select: { id: true, platformClipId: true, stats: { select: { viewCount: true } } },
  });

  if (clips.length === 0) return { updated: 0, total: 0 };

  // platformClipId is stored as "yt_<videoId>"
  const videoMap = new Map(clips.map((c) => [c.platformClipId.replace(/^yt_/, ''), c.id]));
  const videoIds = [...videoMap.keys()];
  let updated = 0;

  // YouTube allows up to 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}&key=${apiKey}`,
    );
    if (!res.ok) continue;

    const data = await res.json();
    for (const item of data.items ?? []) {
      const clipId = videoMap.get(item.id);
      if (!clipId) continue;

      const newCount = parseInt(item.statistics?.viewCount || '0', 10);
      const existing = clips.find((c) => c.id === clipId);
      if (existing?.stats?.viewCount === newCount) continue;

      await prisma.clipStats.upsert({
        where: { clipId },
        update: { viewCount: newCount },
        create: { clipId, viewCount: newCount },
      });
      updated++;
    }
  }

  return { updated, total: clips.length };
}

// ── Job: refresh Twitch profile images ────────────────────────────────────────
// Called every 6 hours by /api/cron/update-stats

export async function refreshProfileImages(): Promise<RefreshCountResult> {
  const token = await getTwitchAppToken();
  const users = await prisma.user.findMany({
    select: { id: true, twitchId: true, profileImage: true },
  });

  if (users.length === 0) return { updated: 0, total: 0 };

  let updated = 0;

  // Twitch allows up to 100 IDs per request
  for (let i = 0; i < users.length; i += 100) {
    const chunk = users.slice(i, i + 100);
    const ids = chunk.map((u) => `id=${u.twitchId}`).join('&');
    const res = await fetch(`https://api.twitch.tv/helix/users?${ids}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });
    if (!res.ok) continue;

    const data = await res.json();
    for (const tu of data.data ?? []) {
      const dbUser = chunk.find((u) => u.twitchId === tu.id);
      if (!dbUser) continue;

      const freshImage = getTwitchProfileImage(tu.profile_image_url, 150);
      if (freshImage === dbUser.profileImage) continue;

      await prisma.user.update({ where: { id: dbUser.id }, data: { profileImage: freshImage } });
      updated++;
    }
  }

  return { updated, total: users.length };
}
