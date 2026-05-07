// src/modules/clips/clips.types.ts

import type { Platform, Tag, ClipStatus } from '@prisma/client';

// ── Input types ───────────────────────────────────────────────────────────────

export interface ClipSubmissionInput {
  clipUrl: string;
  tags: Tag[];
  submittedById: string;
  submittedByName: string;
  appUrl: string;
}

export interface ClipFilters {
  tag?: Tag | null;
  platform?: Platform | null;
  search?: string;
  sort?: 'newest' | 'popular';
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface ClipReviewInput {
  status: ClipStatus;
  reviewNotes?: string;
  reviewedById: string;
}

// ── DTO types (serialized — never raw Prisma models) ──────────────────────────

export interface ClipTagDTO {
  clipId: string;
  tag: Tag;
}

export interface ClipModerationDTO {
  status: ClipStatus;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
}

export interface ClipDTO {
  id: string;
  platformClipId: string;
  sourceUrl: string;
  embedUrl: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
  platform: Platform;
  platformVerified: boolean;
  game: string;
  submittedBy: string;
  submittedByName: string;
  broadcasterId: string;
  broadcasterName: string;
  createdAt: Date;
  updatedAt: Date;
  tags: ClipTagDTO[];
  viewCount: number;
  moderation: ClipModerationDTO | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
