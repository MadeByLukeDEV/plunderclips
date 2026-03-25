import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { prisma } from '@/lib/prisma';
import { fetchMedalUser } from '@/lib/platforms';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { profileUrl } = body;
  if (!profileUrl) return NextResponse.json({ error: 'profileUrl required' }, { status: 400 });

  let medal;
  try {
    medal = await fetchMedalUser(profileUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch Medal.tv profile' }, { status: 500 });
  }

  if (!medal) {
    return NextResponse.json({
      error: 'Could not find Medal.tv profile. Make sure the URL looks like: https://medal.tv/users/12345',
    }, { status: 404 });
  }

  // Check not already linked to another account
  const existing = await prisma.user.findFirst({
    where: { medalUserId: medal.userId, id: { not: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'This Medal.tv account is already linked to another account.' }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      medalUserId: medal.userId,
      medalUsername: medal.username,
    },
  });

  return NextResponse.json({
    userId: medal.userId,
    username: medal.username,
    thumbnailUrl: medal.thumbnailUrl,
  });
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