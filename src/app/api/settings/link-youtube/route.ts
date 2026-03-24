// src/app/api/settings/link-youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { prisma } from '@/lib/prisma';
import { fetchYouTubeChannel } from '@/lib/platforms';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelUrl } = await request.json();
    if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });

    const channel = await fetchYouTubeChannel(channelUrl);
    if (!channel) return NextResponse.json({ error: 'Could not find YouTube channel. Make sure the URL is correct.' }, { status: 404 });

    // Check not already linked to another account
    const existing = await prisma.user.findFirst({
      where: { youtubeChannelId: channel.channelId, id: { not: user.id } },
    });
    if (existing) return NextResponse.json({ error: 'This YouTube channel is already linked to another account.' }, { status: 409 });

    await prisma.user.update({
      where: { id: user.id },
      data: { youtubeChannelId: channel.channelId, youtubeChannelName: channel.channelName },
    });

    return NextResponse.json({ channelId: channel.channelId, channelName: channel.channelName, thumbnailUrl: channel.thumbnailUrl });
  } catch (err) {
    console.error('YouTube link error:', err);
    if (err instanceof Error && err.message.includes('YOUTUBE_API_KEY')) {
      return NextResponse.json({ error: 'YouTube API not configured on this server' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.user.update({
      where: { id: user.id },
      data: { youtubeChannelId: null, youtubeChannelName: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('YouTube unlink error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
