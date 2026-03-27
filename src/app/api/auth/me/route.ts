// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch full user including linked accounts
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      twitchId: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      youtubeChannelId: true,
      youtubeChannelName: true,
    },
  });

  if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: fullUser });
}
