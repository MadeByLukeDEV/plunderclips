// src/app/api/clips/trending/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const clips = await prisma.clip.findMany({
    where: {
      status: 'APPROVED',
      createdAt: { gte: thirtyDaysAgo },
    },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
    take: 8,
  });

  return NextResponse.json({ clips });
}