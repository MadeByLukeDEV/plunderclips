// src/app/api/settings/link-medal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { prisma } from '@/lib/prisma';
import { fetchMedalUser } from '@/lib/platforms';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { profileUrl } = await request.json();
  if (!profileUrl) return NextResponse.json({ error: 'profileUrl required' }, { status: 400 });

  const medalUser = await fetchMedalUser(profileUrl);
  if (!medalUser) return NextResponse.json({ error: 'Could not find Medal.tv profile. Make sure the URL contains your user ID (e.g. medal.tv/users/12345).' }, { status: 404 });

  const existing = await prisma.user.findFirst({
    where: { medalUserId: medalUser.userId, id: { not: user.id } },
  });
  if (existing) return NextResponse.json({ error: 'This Medal.tv account is already linked to another account.' }, { status: 409 });

  await prisma.user.update({
    where: { id: user.id },
    data: { medalUserId: medalUser.userId, medalUsername: medalUser.username },
  });

  return NextResponse.json({ userId: medalUser.userId, username: medalUser.username, thumbnailUrl: medalUser.thumbnailUrl });
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { medalUserId: null, medalUsername: null },
  });

  return NextResponse.json({ success: true });
}
