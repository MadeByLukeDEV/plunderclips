// src/modules/clips/clips.service.ts
// Business logic only — no HTTP concerns

import { prisma } from '@/lib/prisma';
import {
  extractClipId as extractTwitchClipId,
  fetchTwitchClip,
  isSeaOfThievesClip,
  buildEmbedUrl as buildTwitchEmbedUrl,
} from '@/modules/platform/twitch.service';
import { detectPlatform, extractMedalClipId } from '@/lib/platforms';
import {
  extractYouTubeVideoId,
  fetchYouTubeVideo,
  isSeaOfThievesYouTube,
  buildYouTubeEmbedUrl,
  parseYouTubeDuration,
} from '@/modules/platform/youtube.service';
import { getTwitchClipThumbnail } from '@/lib/images';
import type { ClipStatus, Prisma, Tag } from '@prisma/client';
import type {
  ClipSubmissionInput,
  ClipFilters,
  PaginationInput,
  ClipReviewInput,
  ClipDTO,
  PaginatedResult,
} from './clips.types';
import { clipSelect, toClipDTO } from './clips.helpers';

// ── Error ─────────────────────────────────────────────────────────────────────

export class ClipServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'ClipServiceError';
  }
}

// ── Rate limit ────────────────────────────────────────────────────────────────

const HOURLY_LIMIT = 10;

export async function checkSubmissionRateLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.clip.count({
    where: { submittedBy: userId, createdAt: { gte: oneHourAgo } },
  });
  return count < HOURLY_LIMIT;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getClipById(id: string): Promise<ClipDTO | null> {
  const clip = await prisma.clip.findUnique({ where: { id }, select: clipSelect });
  return clip ? toClipDTO(clip) : null;
}

export async function getClips(
  filters: ClipFilters,
  pagination: PaginationInput,
): Promise<PaginatedResult<ClipDTO>> {
  const { tag, platform, search, sort } = filters;
  const { page, limit } = pagination;

  const where: Prisma.ClipWhereInput = {
    moderation: { status: 'APPROVED' },
  };

  if (tag)      where.tags     = { some: { tag } };
  if (platform) where.platform = platform;
  if (search) {
    where.OR = [
      { title:           { contains: search } },
      { broadcasterName: { contains: search } },
      { submittedByName: { contains: search } },
    ];
  }

  const orderBy =
    sort === 'popular'
      ? { stats: { viewCount: 'desc' as const } }
      : { createdAt: 'desc' as const };

  const [rawClips, total] = await Promise.all([
    prisma.clip.findMany({ where, select: clipSelect, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.clip.count({ where }),
  ]);

  return {
    items: rawClips.map(toClipDTO),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getClipsByUser(userId: string): Promise<ClipDTO[]> {
  const clips = await prisma.clip.findMany({
    where: { submittedBy: userId },
    select: clipSelect,
    orderBy: { createdAt: 'desc' },
  });
  return clips.map(toClipDTO);
}

export async function getChannelClips(userId: string, twitchLogin: string): Promise<ClipDTO[]> {
  const linked = await prisma.userLinkedAccount.findUnique({
    where: { userId },
    select: { youtubeChannelId: true },
  });

  const clips = await prisma.clip.findMany({
    where: {
      moderation: { status: 'APPROVED' },
      submittedBy: { not: userId },
      OR: [
        { broadcasterName: twitchLogin.toLowerCase() },
        ...(linked?.youtubeChannelId ? [{ broadcasterId: linked.youtubeChannelId }] : []),
      ],
    },
    select: clipSelect,
    orderBy: { createdAt: 'desc' },
  });

  return clips.map(toClipDTO);
}

export async function getFeaturedClip(): Promise<ClipDTO | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const clip =
    (await prisma.clip.findFirst({
      where: { moderation: { status: 'APPROVED' }, createdAt: { gte: sevenDaysAgo } },
      select: clipSelect,
      orderBy: { stats: { viewCount: 'desc' } },
    })) ??
    (await prisma.clip.findFirst({
      where: { moderation: { status: 'APPROVED' } },
      select: clipSelect,
      orderBy: { stats: { viewCount: 'desc' } },
    }));

  return clip ? toClipDTO(clip) : null;
}

export async function getTrendingClips(limit = 8): Promise<ClipDTO[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const clips = await prisma.clip.findMany({
    where: { moderation: { status: 'APPROVED' }, createdAt: { gte: thirtyDaysAgo } },
    select: clipSelect,
    orderBy: { stats: { viewCount: 'desc' } },
    take: limit,
  });

  return clips.map(toClipDTO);
}

// ── Submission ────────────────────────────────────────────────────────────────

export async function submitClip(input: ClipSubmissionInput): Promise<ClipDTO> {
  const { clipUrl, tags, submittedById, submittedByName, appUrl } = input;

  const withinLimit = await checkSubmissionRateLimit(submittedById);
  if (!withinLimit) {
    throw new ClipServiceError(
      'You have submitted too many clips recently. Please wait before submitting again.',
      429,
    );
  }

  const platform = detectPlatform(clipUrl);
  if (!platform) {
    throw new ClipServiceError(
      'Unsupported URL. Please submit a Twitch clip, YouTube video, or Medal.tv clip.',
      400,
    );
  }

  if (platform === 'TWITCH') return submitTwitchClip({ clipUrl, tags, submittedById, submittedByName, appUrl });
  if (platform === 'YOUTUBE') return submitYouTubeClip({ clipUrl, tags, submittedById, submittedByName });
  return submitMedalClip({ clipUrl, tags, submittedById, submittedByName });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteClip(clipId: string): Promise<void> {
  const exists = await prisma.clip.findUnique({ where: { id: clipId }, select: { id: true } });
  if (!exists) throw new ClipServiceError('Clip not found', 404);
  await prisma.clip.delete({ where: { id: clipId } });
}

// ── Moderation ────────────────────────────────────────────────────────────────

export async function getClipsForModeration(
  status: ClipStatus | null,
  pagination: PaginationInput,
): Promise<PaginatedResult<ClipDTO>> {
  const { page, limit } = pagination;
  const where = status ? { moderation: { status } } : {};

  const [rawClips, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      select: clipSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clip.count({ where }),
  ]);

  return {
    items: rawClips.map(toClipDTO),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function reviewClip(clipId: string, input: ClipReviewInput): Promise<ClipDTO> {
  const exists = await prisma.clip.findUnique({ where: { id: clipId }, select: { id: true } });
  if (!exists) throw new ClipServiceError('Clip not found', 404);

  await prisma.clipModeration.upsert({
    where: { clipId },
    update: {
      status: input.status,
      reviewNotes: input.reviewNotes ?? null,
      reviewedBy: input.reviewedById,
      reviewedAt: new Date(),
    },
    create: {
      clipId,
      status: input.status,
      reviewNotes: input.reviewNotes ?? null,
      reviewedBy: input.reviewedById,
      reviewedAt: new Date(),
    },
  });

  const updated = await prisma.clip.findUniqueOrThrow({ where: { id: clipId }, select: clipSelect });
  return toClipDTO(updated);
}

// ── Platform submission helpers ───────────────────────────────────────────────

async function submitTwitchClip(input: {
  clipUrl: string;
  tags: Tag[];
  submittedById: string;
  submittedByName: string;
  appUrl: string;
}): Promise<ClipDTO> {
  const { clipUrl, tags, submittedById, submittedByName, appUrl } = input;

  const clipId = extractTwitchClipId(clipUrl);
  if (!clipId) throw new ClipServiceError('Invalid Twitch clip URL', 400);

  const existing = await prisma.clip.findUnique({ where: { platformClipId: clipId }, select: { id: true } });
  if (existing) throw new ClipServiceError('This clip has already been submitted', 409);

  const clipData = await fetchTwitchClip(clipId);
  if (!clipData) throw new ClipServiceError('Could not fetch clip from Twitch', 404);

  if (!isSeaOfThievesClip(clipData)) {
    throw new ClipServiceError('This clip is not from Sea of Thieves', 422);
  }

  const broadcaster = await prisma.user.findFirst({
    where: {
      OR: [
        { twitchLogin: clipData.broadcaster_name.toLowerCase() },
        { twitchId: clipData.broadcaster_id },
      ],
    },
    select: { id: true },
  });
  if (!broadcaster) {
    throw new ClipServiceError(
      `The streamer "${clipData.broadcaster_name}" is not registered on this platform.`,
      403,
    );
  }

  const clip = await prisma.$transaction(async (tx) => {
    const created = await tx.clip.create({
      data: {
        platformClipId: clipId,
        sourceUrl: clipData.url,
        embedUrl: buildTwitchEmbedUrl(clipId, new URL(appUrl).hostname),
        title: clipData.title,
        thumbnailUrl: getTwitchClipThumbnail(clipData.thumbnail_url, 640, 360),
        duration: clipData.duration,
        platform: 'TWITCH',
        platformVerified: true,
        submittedBy: submittedById,
        submittedByName,
        broadcasterId: clipData.broadcaster_id,
        broadcasterName: clipData.broadcaster_name,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      select: { id: true },
    });

    await tx.clipStats.create({ data: { clipId: created.id, viewCount: clipData.view_count } });
    await tx.clipModeration.create({ data: { clipId: created.id, status: 'PENDING' } });

    return tx.clip.findUniqueOrThrow({ where: { id: created.id }, select: clipSelect });
  });

  return toClipDTO(clip);
}

async function submitYouTubeClip(input: {
  clipUrl: string;
  tags: Tag[];
  submittedById: string;
  submittedByName: string;
}): Promise<ClipDTO> {
  const { clipUrl, tags, submittedById, submittedByName } = input;

  const videoId = extractYouTubeVideoId(clipUrl);
  if (!videoId) throw new ClipServiceError('Invalid YouTube URL', 400);

  const platformClipId = `yt_${videoId}`;
  const existing = await prisma.clip.findUnique({ where: { platformClipId }, select: { id: true } });
  if (existing) throw new ClipServiceError('This video has already been submitted', 409);

  const video = await fetchYouTubeVideo(videoId);
  if (!video) throw new ClipServiceError('Could not fetch video from YouTube', 404);

  if (!isSeaOfThievesYouTube(video)) {
    throw new ClipServiceError(
      'This video does not appear to be Sea of Thieves content. Make sure "Sea of Thieves" appears in the title, description, or tags.',
      422,
    );
  }

  const linked = await prisma.userLinkedAccount.findFirst({
    where: { youtubeChannelId: video.channelId },
    select: { userId: true },
  });
  if (!linked) {
    throw new ClipServiceError(
      `The YouTube channel "${video.channelName}" is not registered on this platform. The streamer must register and link their YouTube channel first.`,
      403,
    );
  }

  const submitterLinked = await prisma.userLinkedAccount.findUnique({
    where: { userId: submittedById },
    select: { youtubeChannelId: true },
  });
  const platformVerified = submitterLinked?.youtubeChannelId === video.channelId;
  const reviewNotes = !platformVerified
    ? `⚠️ Submitted by ${submittedByName} — YouTube ownership unverified. Please check manually.`
    : undefined;

  const clip = await prisma.$transaction(async (tx) => {
    const created = await tx.clip.create({
      data: {
        platformClipId,
        sourceUrl: clipUrl,
        embedUrl: buildYouTubeEmbedUrl(videoId),
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        duration: parseYouTubeDuration(video.duration),
        platform: 'YOUTUBE',
        platformVerified,
        submittedBy: submittedById,
        submittedByName,
        broadcasterId: video.channelId,
        broadcasterName: video.channelName,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      select: { id: true },
    });

    await tx.clipStats.create({ data: { clipId: created.id, viewCount: 0 } });
    await tx.clipModeration.create({
      data: { clipId: created.id, status: 'PENDING', reviewNotes: reviewNotes ?? null },
    });

    return tx.clip.findUniqueOrThrow({ where: { id: created.id }, select: clipSelect });
  });

  return toClipDTO(clip);
}

async function submitMedalClip(input: {
  clipUrl: string;
  tags: Tag[];
  submittedById: string;
  submittedByName: string;
}): Promise<ClipDTO> {
  const { clipUrl, tags, submittedById, submittedByName } = input;

  const medalClipId = extractMedalClipId(clipUrl);
  if (!medalClipId) throw new ClipServiceError('Invalid Medal.tv clip URL', 400);

  const platformClipId = `medal_${medalClipId}`;
  const existing = await prisma.clip.findUnique({ where: { platformClipId }, select: { id: true } });
  if (existing) throw new ClipServiceError('This clip has already been submitted', 409);

  const clip = await prisma.$transaction(async (tx) => {
    const created = await tx.clip.create({
      data: {
        platformClipId,
        sourceUrl: clipUrl,
        embedUrl: `https://medal.tv/clip/${medalClipId}`,
        title: `Medal.tv clip by ${submittedByName}`,
        thumbnailUrl: null,
        duration: null,
        platform: 'MEDAL',
        platformVerified: false,
        submittedBy: submittedById,
        submittedByName,
        broadcasterId: '',
        broadcasterName: submittedByName,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      select: { id: true },
    });

    await tx.clipStats.create({ data: { clipId: created.id, viewCount: 0 } });
    await tx.clipModeration.create({
      data: {
        clipId: created.id,
        status: 'PENDING',
        reviewNotes: `⚠️ Medal.tv clip — ownership and game cannot be auto-verified. Submitted by ${submittedByName}. Manual review required.`,
      },
    });

    return tx.clip.findUniqueOrThrow({ where: { id: created.id }, select: clipSelect });
  });

  return toClipDTO(clip);
}
