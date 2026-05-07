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
  viewerCount: number | null;
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

// Aggregated stats shown on a streamer's profile page
export interface StreamerStatsDTO {
  totalClips: number;
  totalViews: number;
  topTags: string[];
}

