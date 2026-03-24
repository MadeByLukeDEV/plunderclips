// src/app/api/clips/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware-auth';
import { fetchTwitchClip, extractClipId } from '@/lib/twitch';
import {
  detectPlatform, extractYouTubeVideoId, fetchYouTubeVideo,
  extractMedalClipId, fetchMedalClip,
} from '@/lib/platforms';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url).searchParams.get('url') || '';
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const platform = detectPlatform(url);
  if (!platform) return NextResponse.json({ error: 'Unsupported platform. Use Twitch, YouTube, or Medal.tv URLs.' }, { status: 400 });

  try {
    if (platform === 'TWITCH') {
      const clipId = extractClipId(url);
      if (!clipId) return NextResponse.json({ error: 'Invalid Twitch clip URL' }, { status: 400 });
      const clip = await fetchTwitchClip(clipId);
      if (!clip) return NextResponse.json({ error: 'Clip not found on Twitch' }, { status: 404 });
      return NextResponse.json({
        platform: 'TWITCH',
        title: clip.title,
        channelName: clip.broadcaster_name,
        thumbnailUrl: clip.thumbnail_url,
        viewCount: clip.view_count,
        duration: clip.duration,
        gameId: clip.game_id,
      });
    }

    if (platform === 'YOUTUBE') {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      const video = await fetchYouTubeVideo(videoId);
      if (!video) return NextResponse.json({ error: 'Video not found on YouTube' }, { status: 404 });
      return NextResponse.json({
        platform: 'YOUTUBE',
        title: video.title,
        channelName: video.channelName,
        channelId: video.channelId,
        thumbnailUrl: video.thumbnailUrl,
        duration: null, // parsed on submit
        categoryId: video.categoryId,
      });
    }

    if (platform === 'MEDAL') {
      const clipId = extractMedalClipId(url);
      if (!clipId) return NextResponse.json({ error: 'Invalid Medal.tv clip URL' }, { status: 400 });
      const clip = await fetchMedalClip(url);
      if (!clip) return NextResponse.json({ error: 'Clip not found on Medal.tv' }, { status: 404 });
      return NextResponse.json({
        platform: 'MEDAL',
        title: clip.title,
        channelName: `Medal user ${clip.userId}`,
        thumbnailUrl: clip.thumbnailUrl,
        duration: clip.duration,
        categoryName: clip.categoryName,
        userId: clip.userId,
      });
    }
  } catch (err) {
    console.error('Preview error:', err);
    return NextResponse.json({ error: 'Failed to fetch clip info' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
}
