// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      youtubeChannelName: true,
      medalUsername: true,
      createdAt: true,
      _count: { select: { clips: true } },
    },
  });

  // For each user also count clips where they are the broadcaster (submitted by others)
  const usersWithChannelClips = await Promise.all(
    users.map(async (u) => {
      const channelClipCount = await prisma.clip.count({
        where: {
          broadcasterName: u.twitchLogin,
          submittedBy: { not: u.id },
          status: 'APPROVED',
        },
      });
      return { ...u, channelClipCount };
    })
  );

  return NextResponse.json({ users: usersWithChannelClips });
}