import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';
import { handleCors, withCors } from '@/lib/cors';
import { extractClipId, fetchTwitchClip, isSeaOfThievesClip, buildEmbedUrl } from '@/lib/twitch';
import { z } from 'zod';
import { Tag } from '@prisma/client';



const submitSchema = z.object({
  twitchUrl: z.string().url(),
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
  const orderBy = sort === 'popular' ? { viewCount: 'desc' as const } : { createdAt: 'desc' as const };

  const where: Record<string, unknown> = {
    status: 'APPROVED',
  };

  if (tag) {
    where.tags = { some: { tag } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { broadcasterName: { contains: search } },
      { submittedByName: { contains: search } },
    ];
  }

  const [clips, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      include: { tags: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clip.count({ where }),
  ]);

  const response = NextResponse.json({
    clips,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });

  return withCors(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const corsCheck = handleCors(request);
  if (corsCheck) return corsCheck;

  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return withCors(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      request.headers.get('origin')
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 }),
      request.headers.get('origin')
    );
  }

  const { twitchUrl, tags } = parsed.data;

  // Extract clip ID
  const clipId = extractClipId(twitchUrl);
  if (!clipId) {
    return withCors(
      NextResponse.json({ error: 'Invalid Twitch clip URL' }, { status: 400 }),
      request.headers.get('origin')
    );
  }

  // Check for duplicate
  const existing = await prisma.clip.findUnique({ where: { twitchClipId: clipId } });
  if (existing) {
    return withCors(
      NextResponse.json({ error: 'This clip has already been submitted' }, { status: 409 }),
      request.headers.get('origin')
    );
  }

  // Fetch clip data from Twitch
  const clipData = await fetchTwitchClip(clipId);
  if (!clipData) {
    return withCors(
      NextResponse.json({ error: 'Could not fetch clip from Twitch. Make sure the URL is correct.' }, { status: 404 }),
      request.headers.get('origin')
    );
  }

  // Verify it's Sea of Thieves
  if (!isSeaOfThievesClip(clipData)) {
    return withCors(
      NextResponse.json({ error: 'This clip is not from Sea of Thieves. Only SoT clips are allowed.' }, { status: 422 }),
      request.headers.get('origin')
    );
  }

  // Verify the broadcaster (streamer) is registered on the platform
  const broadcaster = await prisma.user.findFirst({
    where: {
      OR: [
        { twitchLogin: clipData.broadcaster_name.toLowerCase() },
        { twitchId: clipData.broadcaster_id },
      ],
    },
  });

  if (!broadcaster) {
    return withCors(
      NextResponse.json({
        error: `The streamer "${clipData.broadcaster_name}" is not registered on this platform. Only clips from registered streamers can be submitted.`,
      }, { status: 403 }),
      request.headers.get('origin')
    );
  }

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const parentDomain = new URL(appUrl).hostname;

  const clip = await prisma.clip.create({
    data: {
      twitchClipId: clipId,
      twitchUrl: clipData.url,
      embedUrl: buildEmbedUrl(clipId, parentDomain),
      title: clipData.title,
      thumbnailUrl: clipData.thumbnail_url,
      viewCount: clipData.view_count,
      duration: clipData.duration,
      submittedBy: user.id,
      submittedByName: user.displayName,
      broadcasterId: clipData.broadcaster_id,
      broadcasterName: clipData.broadcaster_name,
      status: 'PENDING',
      tags: {
        create: tags.map(tag => ({ tag })),
      },
    },
    include: { tags: true },
  });

  return withCors(
    NextResponse.json({ clip, message: 'Clip submitted successfully! It will be reviewed shortly.' }, { status: 201 }),
    request.headers.get('origin')
  );
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}
