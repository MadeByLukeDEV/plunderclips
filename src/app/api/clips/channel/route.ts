// src/app/api/clips/channel/route.ts
// Returns approved clips from the logged-in user's channel, submitted by others
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find clips where this user is the broadcaster but didn't submit them
  const clips = await prisma.clip.findMany({
    where: {
      status: 'APPROVED',
      submittedBy: { not: user.id },
      OR: [
        // Twitch: match by twitchLogin
        { broadcasterName: user.twitchLogin.toLowerCase() },
        // YouTube: match by linked channel ID
        ...(user.youtubeChannelId ? [{ broadcasterId: user.youtubeChannelId }] : []),
      ],
    },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ clips });
}
