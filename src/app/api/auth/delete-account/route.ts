import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userClips = await prisma.clip.findMany({
      where: { submittedBy: user.id },
      select: { id: true },
    });
    const clipIds = userClips.map(c => c.id);

    if (clipIds.length > 0) {
      await prisma.clipTag.deleteMany({ where: { clipId: { in: clipIds } } });
      await prisma.clip.deleteMany({ where: { id: { in: clipIds } } });
    }

    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}