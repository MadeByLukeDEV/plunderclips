// src/app/api/clips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';
import { handleCors, withCors } from '@/lib/cors';
import { extractClipId, fetchTwitchClip, isSeaOfThievesClip, buildEmbedUrl } from '@/lib/twitch';
import {
  detectPlatform,
  extractYouTubeVideoId, fetchYouTubeVideo, isSeaOfThievesYouTube,
  buildYouTubeEmbedUrl, parseYouTubeDuration,
  extractMedalClipId,
} from '@/lib/platforms';
import { z } from 'zod';
import { getTwitchClipThumbnail } from '@/lib/images';
import { Tag, Platform } from '@prisma/client';

const submitSchema = z.object({
  clipUrl: z.string().url(),
  tags: z.array(z.nativeEnum(Tag)).min(1).max(5),
});

export async function GET(request: NextRequest) {
  const corsCheck = handleCors(request);
  if (corsCheck) return corsCheck;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
  const tag = searchParams.get('tag') as Tag | null;
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const platform = searchParams.get('platform') as Platform | null;
  const orderBy = sort === 'popular' ? { viewCount: 'desc' as const } : { createdAt: 'desc' as const };

  const where: Record<string, unknown> = { status: 'APPROVED' };
  if (tag) where.tags = { some: { tag } };
  if (platform) where.platform = platform;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { broadcasterName: { contains: search } },
      { submittedByName: { contains: search } },
    ];
  }

  const [clips, total] = await Promise.all([
    prisma.clip.findMany({ where, include: { tags: true }, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.clip.count({ where }),
  ]);

  return withCors(
    NextResponse.json({ clips, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }),
    request.headers.get('origin')
  );
}

export async function POST(request: NextRequest) {
  const corsCheck = handleCors(request);
  if (corsCheck) return corsCheck;

  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request.headers.get('origin'));
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Support both old twitchUrl and new clipUrl
  if (body.twitchUrl && !body.clipUrl) body.clipUrl = body.twitchUrl;

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 }), request.headers.get('origin'));
  }

  const { clipUrl, tags } = parsed.data;
  const platform = detectPlatform(clipUrl);
  const origin = request.headers.get('origin');

  // Rate limit — max 10 submissions per user per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.clip.count({
    where: { submittedBy: user.id, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= 10) {
    return withCors(
      NextResponse.json({ error: 'You have submitted too many clips recently. Please wait before submitting again.' }, { status: 429 }),
      origin
    );
  }

  if (!platform) {
    return withCors(
      NextResponse.json({ error: 'Unsupported URL. Please submit a Twitch clip, YouTube video, or Medal.tv clip.' }, { status: 400 }),
      origin
    );
  }

  // ── TWITCH ────────────────────────────────────────────────────────────────
  if (platform === 'TWITCH') {
    const clipId = extractClipId(clipUrl);
    if (!clipId) return withCors(NextResponse.json({ error: 'Invalid Twitch clip URL' }, { status: 400 }), origin);

    const existing = await prisma.clip.findUnique({ where: { twitchClipId: clipId } });
    if (existing) return withCors(NextResponse.json({ error: 'This clip has already been submitted' }, { status: 409 }), origin);

    const clipData = await fetchTwitchClip(clipId);
    if (!clipData) return withCors(NextResponse.json({ error: 'Could not fetch clip from Twitch' }, { status: 404 }), origin);

    if (!isSeaOfThievesClip(clipData)) {
      return withCors(NextResponse.json({ error: 'This clip is not from Sea of Thieves' }, { status: 422 }), origin);
    }

    const broadcaster = await prisma.user.findFirst({
      where: { OR: [{ twitchLogin: clipData.broadcaster_name.toLowerCase() }, { twitchId: clipData.broadcaster_id }] },
    });
    if (!broadcaster) {
      return withCors(
        NextResponse.json({ error: `The streamer "${clipData.broadcaster_name}" is not registered on this platform.` }, { status: 403 }),
        origin
      );
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const clip = await prisma.clip.create({
      data: {
        twitchClipId: clipId,
        twitchUrl: clipData.url,
        embedUrl: buildEmbedUrl(clipId, new URL(appUrl).hostname),
        title: clipData.title,
        thumbnailUrl: getTwitchClipThumbnail(clipData.thumbnail_url, 640, 360),
        viewCount: clipData.view_count,
        duration: clipData.duration,
        submittedBy: user.id,
        submittedByName: user.displayName,
        broadcasterId: clipData.broadcaster_id,
        broadcasterName: clipData.broadcaster_name,
        platform: 'TWITCH',
        platformVerified: true,
        status: 'PENDING',
        tags: { create: tags.map(t => ({ tag: t })) },
      },
      include: { tags: true },
    });
    return withCors(NextResponse.json({ clip, message: 'Clip submitted! It will be reviewed shortly.' }, { status: 201 }), origin);
  }

  // ── YOUTUBE ───────────────────────────────────────────────────────────────
  if (platform === 'YOUTUBE') {
    const videoId = extractYouTubeVideoId(clipUrl);
    if (!videoId) return withCors(NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 }), origin);

    const existing = await prisma.clip.findUnique({ where: { twitchClipId: `yt_${videoId}` } });
    if (existing) return withCors(NextResponse.json({ error: 'This video has already been submitted' }, { status: 409 }), origin);

    const video = await fetchYouTubeVideo(videoId);
    if (!video) return withCors(NextResponse.json({ error: 'Could not fetch video from YouTube' }, { status: 404 }), origin);

    if (!isSeaOfThievesYouTube(video)) {
      return withCors(
        NextResponse.json({ error: 'This video does not appear to be Sea of Thieves content. Make sure "Sea of Thieves" appears in the title, description, or tags.' }, { status: 422 }),
        origin
      );
    }

    // Find the broadcaster by their linked YouTube channel
    const broadcaster = await prisma.user.findFirst({
      where: { youtubeChannelId: video.channelId },
    });
    if (!broadcaster) {
      return withCors(
        NextResponse.json({ error: `The YouTube channel "${video.channelName}" is not registered on this platform. The streamer must register and link their YouTube channel first.` }, { status: 403 }),
        origin
      );
    }

    // platformVerified = the submitter IS the broadcaster (same YouTube channel linked)
    // This correctly handles both: streamer submitting own clip, AND someone else submitting
    const platformVerified = user.youtubeChannelId === video.channelId;

    const reviewNotes = !platformVerified
      ? `⚠️ Submitted by ${user.displayName} — YouTube ownership unverified. Please check manually.`
      : undefined;

    const clip = await prisma.clip.create({
      data: {
        twitchClipId: `yt_${videoId}`,
        twitchUrl: clipUrl,
        embedUrl: buildYouTubeEmbedUrl(videoId),
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        viewCount: 0,
        duration: parseYouTubeDuration(video.duration),
        submittedBy: user.id,
        submittedByName: user.displayName,
        broadcasterId: video.channelId,
        broadcasterName: video.channelName,
        platform: 'YOUTUBE',
        platformVerified,
        status: 'PENDING',
        reviewNotes,
        tags: { create: tags.map(t => ({ tag: t })) },
      },
      include: { tags: true },
    });
    return withCors(NextResponse.json({ clip, message: 'Clip submitted! It will be reviewed shortly.' }, { status: 201 }), origin);
  }

  // ── MEDAL ─────────────────────────────────────────────────────────────────
  if (platform === 'MEDAL') {
    const clipId = extractMedalClipId(clipUrl);
    if (!clipId) return withCors(NextResponse.json({ error: 'Invalid Medal.tv clip URL' }, { status: 400 }), origin);

    const existing = await prisma.clip.findUnique({ where: { twitchClipId: `medal_${clipId}` } });
    if (existing) return withCors(NextResponse.json({ error: 'This clip has already been submitted' }, { status: 409 }), origin);

    // No Medal API ownership check possible — always flag for manual review
    const clip = await prisma.clip.create({
      data: {
        twitchClipId: `medal_${clipId}`,
        twitchUrl: clipUrl,
        embedUrl: `https://medal.tv/clip/${clipId}`,
        title: `Medal.tv clip by ${user.displayName}`,
        thumbnailUrl: null,
        viewCount: 0,
        duration: null,
        submittedBy: user.id,
        submittedByName: user.displayName,
        broadcasterId: '',
        broadcasterName: user.displayName,
        platform: 'MEDAL',
        platformVerified: false,
        status: 'PENDING',
        reviewNotes: `⚠️ Medal.tv clip — ownership and game cannot be auto-verified. Submitted by ${user.displayName}. Manual review required.`,
        tags: { create: tags.map(t => ({ tag: t })) },
      },
      include: { tags: true },
    });
    return withCors(
      NextResponse.json({ clip, message: 'Medal.tv clip submitted! It will be manually reviewed by the crew.' }, { status: 201 }),
      origin
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}