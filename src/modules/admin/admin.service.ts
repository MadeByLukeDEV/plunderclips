// src/modules/admin/admin.service.ts
// Business logic only — no HTTP concerns

import { prisma } from '@/lib/prisma';
import { getTwitchClipThumbnail } from '@/lib/images';
import { clipSelect, toClipDTO } from '@/modules/clips/clips.helpers';
import type { AdminDashboardDTO, FixThumbnailsResult } from './admin.types';

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

