// src/app/api/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const liveUsers = await prisma.user.findMany({
    where: {
      isLive: true,
      role: { in: ['PARTNER', 'ADMIN'] },
    },
    select: {
      id: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      streamTitle: true,
      streamGame: true,
      viewerCount: true,
      liveUpdatedAt: true,
    },
    orderBy: { viewerCount: 'desc' },
  });

  return NextResponse.json({ liveUsers });
}
