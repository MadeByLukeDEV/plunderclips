import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware-auth';
import { z } from 'zod';
import { ClipStatus } from '@prisma/client';

const reviewSchema = z.object({
  status: z.nativeEnum(ClipStatus),
  reviewNotes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ClipStatus | null;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where = status ? { status } : {};

  const [clips, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      include: { tags: true, user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.clip.count({ where }),
  ]);

  return NextResponse.json({
    clips,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clipId = searchParams.get('id');

  if (!clipId) {
    return NextResponse.json({ error: 'Clip ID required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const clip = await prisma.clip.update({
    where: { id: clipId },
    data: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
    include: { tags: true },
  });

  return NextResponse.json({ clip });
}
