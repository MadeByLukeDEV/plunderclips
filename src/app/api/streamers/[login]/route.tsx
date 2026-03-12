import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  const { login: rawLogin } = await params;
  const login = rawLogin.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { twitchLogin: login },
    select: {
      id: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });

  const [clips, totalViews] = await Promise.all([
    prisma.clip.findMany({
      where: { broadcasterName: login, status: 'APPROVED' },
      include: { tags: true },
      orderBy: { viewCount: 'desc' },
    }),
    prisma.clip.aggregate({
      where: { broadcasterName: login, status: 'APPROVED' },
      _sum: { viewCount: true },
    }),
  ]);

  const tagCounts: Record<string, number> = {};
  for (const clip of clips) {
    for (const t of clip.tags) {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return NextResponse.json({
    user,
    clips,
    stats: {
      totalClips: clips.length,
      totalViews: totalViews._sum.viewCount || 0,
      topTags,
    },
  });
}