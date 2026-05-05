// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch full user with linked accounts from new schema
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id:           true,
      twitchId:     true,
      twitchLogin:  true,
      displayName:  true,
      profileImage: true,
      role:         true,
      // New schema — linked accounts in separate table
      linkedAccount: {
        select: {
          youtubeChannelId:   true,
          youtubeChannelName: true,
          medalUserId:        true,
          medalUsername:      true,
        },
      },
      // Live status in separate table
      liveStatus: {
        select: {
          isLive:      true,
          streamTitle: true,
          streamGame:  true,
          viewerCount: true,
        },
      },
    },
  });

  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Flatten for backwards compatibility with client components
  // that still read user.youtubeChannelId etc
  const response = {
    ...fullUser,
    youtubeChannelId:   fullUser.linkedAccount?.youtubeChannelId   ?? null,
    youtubeChannelName: fullUser.linkedAccount?.youtubeChannelName ?? null,
    medalUserId:        fullUser.linkedAccount?.medalUserId        ?? null,
    medalUsername:      fullUser.linkedAccount?.medalUsername      ?? null,
    isLive:             fullUser.liveStatus?.isLive                ?? false,
    streamTitle:        fullUser.liveStatus?.streamTitle           ?? null,
    streamGame:         fullUser.liveStatus?.streamGame            ?? null,
    viewerCount:        fullUser.liveStatus?.viewerCount           ?? null,
    // Remove nested objects — clients get a flat shape
    linkedAccount:      undefined,
    liveStatus:         undefined,
  };

  return NextResponse.json({ user: response });
}