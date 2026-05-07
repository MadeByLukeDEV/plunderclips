// src/modules/live/live.service.ts
// Owns all UserLiveStatus DB operations and EventSub-driven live state

import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import type { LiveStreamerDTO, LiveStatusInput } from './live.types';

// Only PARTNER and ADMIN are tracked for live status via EventSub
export const LIVE_ROLES: Role[] = ['PARTNER', 'ADMIN'];

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getLiveStreamers(): Promise<LiveStreamerDTO[]> {
  const liveStatuses = await prisma.userLiveStatus.findMany({
    where: {
      isLive: true,
      user: { role: { in: LIVE_ROLES } },
    },
    select: {
      viewerCount: true,
      streamTitle: true,
      streamGame: true,
      liveUpdatedAt: true,
      user: {
        select: {
          id: true,
          twitchLogin: true,
          displayName: true,
          profileImage: true,
          role: true,
        },
      },
    },
    orderBy: { viewerCount: 'desc' },
  });

  return liveStatuses.map((ls) => ({
    id: ls.user.id,
    twitchLogin: ls.user.twitchLogin,
    displayName: ls.user.displayName,
    profileImage: ls.user.profileImage ?? null,
    role: ls.user.role,
    streamTitle: ls.streamTitle ?? null,
    streamGame: ls.streamGame ?? null,
    viewerCount: ls.viewerCount ?? null,
    liveUpdatedAt: ls.liveUpdatedAt ?? null,
  }));
}

// ── Mutations (webhook-driven) ────────────────────────────────────────────────

export async function setLiveStatus(twitchId: string, input: LiveStatusInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { twitchId },
    select: { id: true, role: true },
  });
  if (!user || !LIVE_ROLES.includes(user.role)) return;

  await prisma.userLiveStatus.upsert({
    where: { userId: user.id },
    update: {
      isLive: true,
      streamTitle: input.streamTitle ?? null,
      streamGame: input.streamGame ?? null,
      viewerCount: input.viewerCount ?? null,
      liveUpdatedAt: new Date(),
    },
    create: {
      userId: user.id,
      isLive: true,
      streamTitle: input.streamTitle ?? null,
      streamGame: input.streamGame ?? null,
      viewerCount: input.viewerCount ?? null,
      liveUpdatedAt: new Date(),
    },
  });
}

export async function clearLiveStatus(twitchId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { twitchId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.userLiveStatus.update({
    where: { userId: user.id },
    data: {
      isLive: false,
      streamTitle: null,
      streamGame: null,
      viewerCount: null,
      liveUpdatedAt: new Date(),
    },
  });
}

