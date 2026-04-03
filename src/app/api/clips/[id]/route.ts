// src/app/api/clips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const clip = await prisma.clip.findUnique({
    where: { id },
    select: { id: true, submittedBy: true, broadcasterName: true, title: true },
  });

  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  const isAdmin = user.role === 'ADMIN' || user.role === 'MODERATOR';
  const isSubmitter = clip.submittedBy === user.id;
  const isBroadcaster = clip.broadcasterName.toLowerCase() === user.twitchLogin?.toLowerCase();

  if (!isAdmin && !isSubmitter && !isBroadcaster) {
    return NextResponse.json({ error: 'Not authorized to delete this clip' }, { status: 403 });
  }

  await prisma.clipTag.deleteMany({ where: { clipId: id } });
  await prisma.clip.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
