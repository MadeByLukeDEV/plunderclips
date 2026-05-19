// src/modules/streamers/streamers.helpers.ts

import type { Prisma, Role } from '@prisma/client';
import { roleWeight } from '@/modules/auth/auth.roles';
import type { StreamerProfileDTO, StreamerListItemDTO } from './streamers.types';

// ── Select constants ──────────────────────────────────────────────────────────

// Full live-status fields for profile pages
export const streamerProfileSelect = {
  id: true,
  twitchLogin: true,
  displayName: true,
  profileImage: true,
  role: true,
  createdAt: true,
  liveStatus: {
    select: {
      isLive: true,
      streamTitle: true,
      streamGame: true,
      viewerCount: true,
      liveUpdatedAt: true,
    },
  },
  linkedAccount: {
    select: { youtubeChannelId: true, youtubeChannelName: true },
  },
} satisfies Prisma.UserSelect;

// Slim select for list pages — omits createdAt and liveUpdatedAt
export const streamerListSelect = {
  id: true,
  twitchLogin: true,
  displayName: true,
  profileImage: true,
  role: true,
  liveStatus: {
    select: { isLive: true, viewerCount: true, streamTitle: true },
  },
} satisfies Prisma.UserSelect;

export type UserWithFullLiveStatus = Prisma.UserGetPayload<{ select: typeof streamerProfileSelect }>;
export type UserWithListLiveStatus = Prisma.UserGetPayload<{ select: typeof streamerListSelect }>;

// ── Mappers ───────────────────────────────────────────────────────────────────

export function toStreamerProfileDTO(user: UserWithFullLiveStatus): StreamerProfileDTO {
  return {
    id: user.id,
    twitchLogin: user.twitchLogin,
    displayName: user.displayName,
    profileImage: user.profileImage ?? null,
    role: user.role,
    isLive: user.liveStatus?.isLive ?? false,
    streamTitle: user.liveStatus?.streamTitle ?? null,
    streamGame: user.liveStatus?.streamGame ?? null,
    viewerCount: user.liveStatus?.viewerCount ?? null,
    liveUpdatedAt: user.liveStatus?.liveUpdatedAt ?? null,
    createdAt: user.createdAt,
    youtubeChannelId: user.linkedAccount?.youtubeChannelId ?? null,
    youtubeChannelName: user.linkedAccount?.youtubeChannelName ?? null,
  };
}

export function toStreamerListItemDTO(
  user: UserWithListLiveStatus,
  approvedClips: number,
): StreamerListItemDTO {
  return {
    id: user.id,
    twitchLogin: user.twitchLogin,
    displayName: user.displayName,
    profileImage: user.profileImage ?? null,
    role: user.role,
    isLive: user.liveStatus?.isLive ?? false,
    viewerCount: user.liveStatus?.viewerCount ?? null,
    approvedClips,
  };
}

// ── Sorting ───────────────────────────────────────────────────────────────────

export function sortStreamers<T extends { isLive: boolean; role: Role; approvedClips: number }>(
  a: T,
  b: T,
): number {
  if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
  const diff = roleWeight(a.role) - roleWeight(b.role);
  if (diff !== 0) return diff;
  return b.approvedClips - a.approvedClips;
}

