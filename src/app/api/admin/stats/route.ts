import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
  }

  const [
    totalClips,
    pendingClips,
    approvedClips,
    declinedClips,
    totalUsers,
    recentClips,
  ] = await Promise.all([
    prisma.clip.count(),
    prisma.clip.count({ where: { status: 'PENDING' } }),
    prisma.clip.count({ where: { status: 'APPROVED' } }),
    prisma.clip.count({ where: { status: 'DECLINED' } }),
    prisma.user.count(),
    prisma.clip.findMany({
      where: { status: 'PENDING' },
      include: { tags: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    stats: { totalClips, pendingClips, approvedClips, declinedClips, totalUsers },
    recentPending: recentClips,
  });
}
