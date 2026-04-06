// src/app/api/clips/featured/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Most viewed clip this week
  const clip = await prisma.clip.findFirst({
    where: {
      status: 'APPROVED',
      createdAt: { gte: sevenDaysAgo },
    },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
  });

  // Fallback to all-time top if no recent clips
  if (!clip) {
    const fallback = await prisma.clip.findFirst({
      where: { status: 'APPROVED' },
      include: { tags: true },
      orderBy: { viewCount: 'desc' },
    });
    return NextResponse.json({ clip: fallback });
  }

  return NextResponse.json({ clip });
}