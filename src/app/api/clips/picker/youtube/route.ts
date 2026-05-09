// src/app/api/clips/picker/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { fetchChannelVideosFeed } from '@/modules/platform/youtube.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const linked = await prisma.userLinkedAccount.findUnique({
    where: { userId: user.id },
    select: { youtubeChannelId: true },
  });

  if (!linked?.youtubeChannelId) {
    return NextResponse.json({ notLinked: true, videos: [], nextPageToken: null });
  }

  const pageToken = new URL(request.url).searchParams.get('pageToken') ?? undefined;
  const result = await fetchChannelVideosFeed(linked.youtubeChannelId, { pageToken });
  return NextResponse.json(result);
}
