// src/app/api/clips/trending/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 1800; // 30 min ISR

export async function GET() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const clips = await prisma.clip.findMany({
    where: { status: 'APPROVED', createdAt: { gte: thirtyDaysAgo } },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
    take: 8,
  });

  return NextResponse.json(
    { clips },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300' } }
  );
}