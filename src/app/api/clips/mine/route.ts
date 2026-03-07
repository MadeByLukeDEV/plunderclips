import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clips = await prisma.clip.findMany({
    where: { submittedBy: user.id },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ clips });
}
