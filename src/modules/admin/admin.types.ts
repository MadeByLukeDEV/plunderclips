// src/modules/admin/admin.types.ts

import type { ClipDTO } from '@/modules/clips/clips.types';

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface AdminStatsDTO {
  totalClips: number;
  pendingClips: number;
  approvedClips: number;
  declinedClips: number;
  totalUsers: number;
}

export interface AdminDashboardDTO {
  stats: AdminStatsDTO;
  recentPending: ClipDTO[];
}

// ── Maintenance results ───────────────────────────────────────────────────────

export interface FixThumbnailsResult {
  found: number;
  fixed: number;
  message: string;
}

