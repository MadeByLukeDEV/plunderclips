// src/modules/streamers/streamers.service.ts
// Business logic only — no HTTP concerns

import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import {
  subscribeToLiveEvents,
  unsubscribeFromLiveEvents,
  fetchLiveStreams,
} from '@/modules/platform/twitch.service';
import { clipSelect, toClipDTO } from '@/modules/clips/clips.helpers';
import type { ClipDTO } from '@/modules/clips/clips.types';
import type { StreamerListItemDTO, StreamerProfileDTO, LiveStreamerDTO, StreamerStatsDTO, LiveStatusInput } from './streamers.types';
import {
  streamerProfileSelect,
  streamerListSelect,
  toStreamerProfileDTO,
  toStreamerListItemDTO,
  sortStreamers,
  LIVE_ROLES,
} from './streamers.helpers';

// ── Error ─────────────────────────────────────────────────────────────────────

export class StreamerServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'StreamerServiceError';
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAllStreamers(): Promise<StreamerListItemDTO[]> {
  const [users, clipCountRows] = await Promise.all([
    prisma.user.findMany({ select: streamerListSelect }),
    // Single batch query — avoids N+1
    prisma.clip.groupBy({
      by: ['broadcasterName'],
      where: { moderation: { status: 'APPROVED' } },
      _count: { id: true },
    }),
  ]);

  const clipCounts = new Map(clipCountRows.map((r) => [r.broadcasterName, r._count.id]));

  return users
    .map((u) => toStreamerListItemDTO(u, clipCounts.get(u.twitchLogin) ?? 0))
    .sort(sortStreamers);
}

export async function getStreamer(login: string): Promise<{
  streamer: StreamerProfileDTO;
  clips: ClipDTO[];
  stats: StreamerStatsDTO;
} | null> {
  const normalised = login.toLowerCase();

  const [user, clips, viewsAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { twitchLogin: normalised },
      select: streamerProfileSelect,
    }),
    prisma.clip.findMany({
      where: { broadcasterName: normalised, moderation: { status: 'APPROVED' } },
      select: clipSelect,
      orderBy: { stats: { viewCount: 'desc' } },
    }),
    prisma.clipStats.aggregate({
      where: { clip: { broadcasterName: normalised, moderation: { status: 'APPROVED' } } },
      _sum: { viewCount: true },
    }),
  ]);

  if (!user) return null;

  const tagCounts: Record<string, number> = {};
  for (const clip of clips) {
    for (const t of clip.tags) {
      tagCounts[t.tag] = (tagCounts[t.tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    streamer: toStreamerProfileDTO(user),
    clips: clips.map(toClipDTO),
    stats: {
      totalClips: clips.length,
      totalViews: viewsAgg._sum.viewCount ?? 0,
      topTags,
    },
  };
}

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

// ── Live status mutations ─────────────────────────────────────────────────────

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

// ── Cron refresh ──────────────────────────────────────────────────────────────

export async function refreshLiveStatuses(): Promise<{ updated: number; fixed: number }> {
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
      // Still marked live but not in Twitch stream list — fix stale status
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

// ── Admin: role management ────────────────────────────────────────────────────

export async function updateStreamerRole(
  userId: string,
  newRole: Role,
): Promise<{ id: string; displayName: string; role: Role; isLive: boolean }> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, twitchId: true, role: true },
  });
  if (!target) throw new StreamerServiceError('User not found', 404);

  const wasLiveRole = LIVE_ROLES.includes(target.role);
  const willBeLiveRole = LIVE_ROLES.includes(newRole);

  if (!wasLiveRole && willBeLiveRole) {
    try { await subscribeToLiveEvents(target.twitchId); }
    catch (err) { console.error('EventSub subscribe failed:', err); }
  } else if (wasLiveRole && !willBeLiveRole) {
    try { await unsubscribeFromLiveEvents(target.twitchId); }
    catch (err) { console.error('EventSub unsubscribe failed:', err); }
    await prisma.userLiveStatus.update({
      where: { userId },
      data: { isLive: false, streamTitle: null, streamGame: null, viewerCount: null },
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      displayName: true,
      role: true,
      liveStatus: { select: { isLive: true } },
    },
  });

  return {
    id: updated.id,
    displayName: updated.displayName,
    role: updated.role,
    isLive: updated.liveStatus?.isLive ?? false,
  };
}
