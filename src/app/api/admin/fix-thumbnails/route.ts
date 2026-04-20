// src/app/api/admin/fix-thumbnails/route.ts
// One-time migration endpoint — fixes existing Twitch clip thumbnails
// that were stored with %{width}x%{height} template placeholders
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware-auth';
import { getTwitchClipThumbnail } from '@/lib/images';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find all Twitch clips with unresolved template URLs
  const broken = await prisma.clip.findMany({
    where: {
      platform: 'TWITCH',
      thumbnailUrl: { contains: '%{' },
    },
    select: { id: true, thumbnailUrl: true },
  });

  let fixed = 0;
  for (const clip of broken) {
    if (!clip.thumbnailUrl) continue;
    const optimised = getTwitchClipThumbnail(clip.thumbnailUrl, 640, 360);
    await prisma.clip.update({
      where: { id: clip.id },
      data: { thumbnailUrl: optimised },
    });
    fixed++;
  }

  return NextResponse.json({
    ok: true,
    found: broken.length,
    fixed,
    message: fixed > 0 ? `Fixed ${fixed} thumbnail URLs` : 'No broken thumbnails found',
  });
}