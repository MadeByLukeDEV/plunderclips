// src/app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete in correct FK order to avoid constraint violations
    // 1. Clip relations first
    const userClips = await prisma.clip.findMany({
      where:  { submittedBy: user.id },
      select: { id: true },
    });
    const clipIds = userClips.map(c => c.id);

    if (clipIds.length > 0) {
      await prisma.clipTag.deleteMany({
        where: { clipId: { in: clipIds } },
      });
      await prisma.clipStats.deleteMany({
        where: { clipId: { in: clipIds } },
      });
      await prisma.clipModeration.deleteMany({
        where: { clipId: { in: clipIds } },
      });
      await prisma.clip.deleteMany({
        where: { id: { in: clipIds } },
      });
    }

    // 2. User relations — new schema tables
    await Promise.all([
      prisma.session.deleteMany({        where: { userId: user.id } }),
      prisma.userLiveStatus.deleteMany({ where: { userId: user.id } }),
      prisma.userLinkedAccount.deleteMany({ where: { userId: user.id } }),
      prisma.userProgress.deleteMany({   where: { userId: user.id } }),
      prisma.userChallenge.deleteMany({  where: { userId: user.id } }),
    ]);

    // 3. Core user last
    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}