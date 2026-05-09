// src/modules/live/live.types.ts

import type { Role } from '@prisma/client';

// ── DTOs ──────────────────────────────────────────────────────────────────────

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

// ── Input types ───────────────────────────────────────────────────────────────

export interface LiveStatusInput {
  streamTitle?: string | null;
  streamGame?: string | null;
  viewerCount?: number | null;
}
