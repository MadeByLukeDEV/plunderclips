// src/modules/streamers/streamers.types.ts

import type { Role } from '@prisma/client';

// ── Public-facing DTOs (never raw Prisma models) ──────────────────────────────

// Slim entry for the streamers list page
export interface StreamerListItemDTO {
  id: string;
  twitchLogin: string;
  displayName: string;
  profileImage: string | null;
  role: Role;
  isLive: boolean;
  approvedClips: number;
}

// Full profile for a single streamer page
export interface StreamerProfileDTO {
  id: string;
  twitchLogin: string;
  displayName: string;
  profileImage: string | null;
  role: Role;
  isLive: boolean;
  streamTitle: string | null;
  streamGame: string | null;
  viewerCount: number | null;
  liveUpdatedAt: Date | null;
  createdAt: Date;
}

// Slim entry for the live-streamers section
export interface LiveStreamerDTO {
  id: string;
  twitchLogin: string;
  displayName: string;
  profileImage: string | null;
  role: Role;
  streamTitle: string | null;
  streamGame: string | null;
  viewerCount: number | null;
  liveUpdatedAt: Date | null;
}

// Aggregated stats shown on a streamer's profile page
export interface StreamerStatsDTO {
  totalClips: number;
  totalViews: number;
  topTags: string[];
}

// ── Input types ───────────────────────────────────────────────────────────────

// Payload when marking a streamer as live (webhook + manual override)
export interface LiveStatusInput {
  streamTitle?: string | null;
  streamGame?: string | null;
  viewerCount?: number | null;
}
