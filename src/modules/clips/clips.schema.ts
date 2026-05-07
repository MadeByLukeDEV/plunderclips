// src/modules/clips/clips.schema.ts

import { z } from 'zod';
import { Tag, ClipStatus } from '@prisma/client';

export const submitClipSchema = z.object({
  clipUrl: z.string().url(),
  tags: z.array(z.nativeEnum(Tag)).min(1).max(5),
});

export const reviewClipSchema = z.object({
  status: z.nativeEnum(ClipStatus),
  reviewNotes: z.string().optional(),
});
