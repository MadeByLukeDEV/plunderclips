import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clips = await prisma.clip.findMany({
    where: { submittedBy: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, twitchClipId: true, twitchUrl: true, embedUrl: true,
      title: true, thumbnailUrl: true, viewCount: true, duration: true,
      submittedByName: true, broadcasterName: true, status: true,
      reviewNotes: true, reviewedAt: true, createdAt: true,
      tags: true,
    },
  });

  return NextResponse.json({ clips });
}
