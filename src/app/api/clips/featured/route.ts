// src/app/api/clips/featured/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // 1 hour ISR

export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const clip = await prisma.clip.findFirst({
    where: { status: 'APPROVED', createdAt: { gte: sevenDaysAgo } },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
  }) ?? await prisma.clip.findFirst({
    where: { status: 'APPROVED' },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
  });

  return NextResponse.json(
    { clip },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  );
}