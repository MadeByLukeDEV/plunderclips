import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete in order: tags → clips → sessions → user
    const userClips = await prisma.clip.findMany({
      where: { submittedById: session.userId },
      select: { id: true },
    });
    const clipIds = userClips.map(c => c.id);

    if (clipIds.length > 0) {
      await prisma.clipTag.deleteMany({ where: { clipId: { in: clipIds } } });
      await prisma.clip.deleteMany({ where: { id: { in: clipIds } } });
    }

    await prisma.session.deleteMany({ where: { userId: session.userId } });
    await prisma.user.delete({ where: { id: session.userId } });

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
