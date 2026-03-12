import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { fetchTwitchClip } from '@/lib/twitch';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clipId = new URL(request.url).searchParams.get('clipId');
  if (!clipId) return NextResponse.json({ error: 'clipId required' }, { status: 400 });

  const clip = await fetchTwitchClip(clipId);
  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  return NextResponse.json({
    id: clip.id,
    title: clip.title,
    broadcaster_name: clip.broadcaster_name,
    thumbnail_url: clip.thumbnail_url,
    view_count: clip.view_count,
    duration: clip.duration,
    game_id: clip.game_id,
  });
}
