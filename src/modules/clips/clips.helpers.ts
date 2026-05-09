// src/modules/clips/clips.helpers.ts

import type { Prisma } from '@prisma/client';
import type { ClipDTO } from './clips.types';

// Standard select for all clip responses — avoids pulling unnecessary columns
export const clipSelect = {
  id: true,
  platformClipId: true,
  sourceUrl: true,
  embedUrl: true,
  title: true,
  thumbnailUrl: true,
  duration: true,
  platform: true,
  platformVerified: true,
  game: true,
  submittedBy: true,
  submittedByName: true,
  broadcasterId: true,
  broadcasterName: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
  stats: {
    select: { viewCount: true },
  },
  moderation: {
    select: {
      status: true,
      reviewedBy: true,
      reviewNotes: true,
      reviewedAt: true,
    },
  },
} satisfies Prisma.ClipSelect;

export type ClipWithRelations = Prisma.ClipGetPayload<{ select: typeof clipSelect }>;

export function toClipDTO(clip: ClipWithRelations): ClipDTO {
  return {
    id: clip.id,
    platformClipId: clip.platformClipId,
    sourceUrl: clip.sourceUrl,
    embedUrl: clip.embedUrl,
    title: clip.title,
    thumbnailUrl: clip.thumbnailUrl ?? null,
    duration: clip.duration ?? null,
    platform: clip.platform,
    platformVerified: clip.platformVerified,
    game: clip.game,
    submittedBy: clip.submittedBy,
    submittedByName: clip.submittedByName,
    broadcasterId: clip.broadcasterId,
    broadcasterName: clip.broadcasterName,
    createdAt: clip.createdAt,
    updatedAt: clip.updatedAt,
    tags: clip.tags,
    viewCount: clip.stats?.viewCount ?? 0,
    moderation: clip.moderation ?? null,
  };
}
