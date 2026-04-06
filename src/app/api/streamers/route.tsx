// src/app/api/streamers/route.ts
// Returns all registered streamers with profile images for Rising Creators section
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const streamers = await prisma.user.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      isLive: true,
      _count: { select: { clips: true } },
    },
  });

  // Also get approved clip count per broadcaster
  const withClipCounts = await Promise.all(
    streamers.map(async (s) => {
      const approvedClips = await prisma.clip.count({
        where: { broadcasterName: s.twitchLogin, status: 'APPROVED' },
      });
      return { ...s, approvedClips };
    })
  );

  // Sort by approved clip count descending
  withClipCounts.sort((a, b) => b.approvedClips - a.approvedClips);

  return NextResponse.json({ streamers: withClipCounts });
}