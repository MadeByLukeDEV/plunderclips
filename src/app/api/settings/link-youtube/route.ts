import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { prisma } from '@/lib/prisma';
import { fetchYouTubeChannel } from '@/modules/platform/youtube.service';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { channelUrl } = body;
  if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });

  let channel;
  try {
    channel = await fetchYouTubeChannel(channelUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch YouTube channel' }, { status: 500 });
  }

  if (!channel) {
    return NextResponse.json({
      error: 'Could not find YouTube channel. Make sure the URL looks like: https://www.youtube.com/@YourHandle',
    }, { status: 404 });
  }

  // Check not already linked to another account
  const existing = await prisma.user.findFirst({
    where: { youtubeChannelId: channel.channelId, id: { not: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: 'This YouTube channel is already linked to another account.' }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      youtubeChannelId: channel.channelId,
      youtubeChannelName: channel.channelName,
    },
  });

  return NextResponse.json({
    channelId: channel.channelId,
    channelName: channel.channelName,
    thumbnailUrl: channel.thumbnailUrl,
  });
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { youtubeChannelId: null, youtubeChannelName: null },
  });

  return NextResponse.json({ success: true });
}