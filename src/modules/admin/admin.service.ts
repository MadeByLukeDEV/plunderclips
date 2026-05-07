// src/modules/admin/admin.service.ts
// Business logic only — no HTTP concerns

import { prisma } from '@/lib/prisma';
import { getTwitchClipThumbnail, getTwitchProfileImage } from '@/lib/images';
import { getTwitchAppToken } from '@/modules/platform/twitch.service';
import { clipSelect, toClipDTO } from '@/modules/clips/clips.helpers';
import type {
  AdminDashboardDTO,
  FixThumbnailsResult,
  RefreshCountResult,
} from './admin.types';

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminDashboardDTO> {
  const [
    totalClips,
    pendingClips,
    approvedClips,
    declinedClips,
    totalUsers,
    rawRecentPending,
  ] = await Promise.all([
    prisma.clip.count(),
    prisma.clipModeration.count({ where: { status: 'PENDING' } }),
    prisma.clipModeration.count({ where: { status: 'APPROVED' } }),
    prisma.clipModeration.count({ where: { status: 'DECLINED' } }),
    prisma.user.count(),
    prisma.clip.findMany({
      where: { moderation: { status: 'PENDING' } },
      select: clipSelect,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    stats: { totalClips, pendingClips, approvedClips, declinedClips, totalUsers },
    recentPending: rawRecentPending.map(toClipDTO),
  };
}

// ── Maintenance: thumbnail repair ─────────────────────────────────────────────

// Fixes Twitch clip thumbnails that were stored with %{width}x%{height} placeholders
export async function fixTwitchThumbnails(): Promise<FixThumbnailsResult> {
  const broken = await prisma.clip.findMany({
    where: { platform: 'TWITCH', thumbnailUrl: { contains: '%{' } },
    select: { id: true, thumbnailUrl: true },
  });

  let fixed = 0;
  for (const clip of broken) {
    if (!clip.thumbnailUrl) continue;
    await prisma.clip.update({
      where: { id: clip.id },
      data: { thumbnailUrl: getTwitchClipThumbnail(clip.thumbnailUrl, 640, 360) },
    });
    fixed++;
  }

  return {
    found: broken.length,
    fixed,
    message: fixed > 0 ? `Fixed ${fixed} thumbnail URLs` : 'No broken thumbnails found',
  };
}

// ── Cron: YouTube view counts ─────────────────────────────────────────────────

export async function refreshYouTubeViewCounts(): Promise<RefreshCountResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { updated: 0, total: 0 };

  const clips = await prisma.clip.findMany({
    where: { platform: 'YOUTUBE', moderation: { status: 'APPROVED' } },
    select: { id: true, platformClipId: true, stats: { select: { viewCount: true } } },
  });

  if (clips.length === 0) return { updated: 0, total: 0 };

  // Build videoId → clipId map (platformClipId is stored as "yt_<videoId>")
  const videoMap = new Map(
    clips.map((c) => [c.platformClipId.replace(/^yt_/, ''), c.id]),
  );

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

// ── Cron: Twitch profile images ───────────────────────────────────────────────

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
