// src/modules/platform/youtube.service.ts
// YouTube Data API v3 interactions — migrated from src/lib/platforms.ts

import { getYouTubeChannelAvatar } from '@/lib/images';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  categoryId: string;
  tags: string[];
  description: string;
  duration: string; // ISO 8601
  viewCount: number;
}

export interface YouTubeChannelInfo {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

export function extractYouTubeVideoId(url: string): string | null {
  const m1 = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  // /shorts/ID (not /shorts?v=ID)
  const m3 = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

export function parseYouTubeDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) +
         (parseInt(m[2] || '0') * 60) +
          parseInt(m[3] || '0');
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchYouTubeVideo(videoId: string): Promise<YouTubeVideoInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set');

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`,
  );
  const data = await res.json();
  const video = data.items?.[0];
  if (!video) return null;

  return {
    videoId,
    title: video.snippet.title,
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    // Store hqdefault — always available, 480x360, good for cards
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    categoryId: video.snippet.categoryId,
    tags: video.snippet.tags || [],
    description: video.snippet.description || '',
    duration: video.contentDetails.duration,
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
  };
}

export async function fetchYouTubeChannelFromToken(accessToken: string): Promise<YouTubeChannelInfo | null> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) return null;
  return {
    channelId:    channel.id,
    channelName:  channel.snippet.title,
    thumbnailUrl: getYouTubeChannelAvatar(
      channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '',
    ),
  };
}

export async function fetchYouTubeChannel(url: string): Promise<YouTubeChannelInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set');

  const handle = extractChannelHandle(url);
  if (!handle) return null;

  if (handle.startsWith('@')) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle.slice(1))}&key=${apiKey}`,
    );
    const data = await res.json();
    const channel = data.items?.[0];
    if (channel) return {
      channelId: channel.id,
      channelName: channel.snippet.title,
      thumbnailUrl: getYouTubeChannelAvatar(
        channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '',
      ),
    };
  }

  if (handle.startsWith('UC')) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${handle}&key=${apiKey}`,
    );
    const data = await res.json();
    const channel = data.items?.[0];
    if (channel) return {
      channelId: channel.id,
      channelName: channel.snippet.title,
      thumbnailUrl: getYouTubeChannelAvatar(
        channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '',
      ),
    };
  }

  return null;
}

// ── Channel video feed (for clip picker) ─────────────────────────────────────

export type YouTubePickerSort = 'NEWEST' | 'POPULAR';

export interface YouTubePickerItem {
  id:           string;
  title:        string;
  thumbnailUrl: string;
  duration:     number;
  url:          string;
  embedUrl:     string;
  channelName:  string;
  isShort:      boolean;
  viewCount:    number;
}

export interface YouTubePickerResult {
  videos:        YouTubePickerItem[];
  nextPageToken: string | null;
}

export async function fetchChannelVideosFeed(
  channelId: string,
  options: { limit?: number; sort?: YouTubePickerSort; pageToken?: string } = {},
): Promise<YouTubePickerResult> {
  const { limit = 24, sort = 'NEWEST', pageToken } = options;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { videos: [], nextPageToken: null };

  try {
    // Resolve uploads playlist ID (cached implicitly by Next.js fetch)
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=contentDetails&key=${apiKey}`,
    );
    if (!channelRes.ok) return { videos: [], nextPageToken: null };
    const channelData = await channelRes.json();
    const uploadsId: string | undefined =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return { videos: [], nextPageToken: null };

    // Fetch playlist page (2× to absorb livestream filtering losses)
    const plParams = new URLSearchParams({
      playlistId: uploadsId,
      part:       'contentDetails',
      maxResults: String(Math.min(limit * 2, 50)),
      key:        apiKey,
    });
    if (pageToken) plParams.set('pageToken', pageToken);

    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${plParams}`);
    if (!playlistRes.ok) return { videos: [], nextPageToken: null };
    const playlistData = await playlistRes.json();

    const videoIds: string[] = (playlistData.items ?? []).map(
      (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId,
    );
    if (videoIds.length === 0) return { videos: [], nextPageToken: null };

    const nextToken: string | null = playlistData.nextPageToken ?? null;

    // Batch-fetch details + statistics (viewCount for POPULAR sort)
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(',')}&part=snippet,contentDetails,statistics&key=${apiKey}`,
    );
    if (!videosRes.ok) return { videos: [], nextPageToken: null };
    const videosData = await videosRes.json();

    type RawVideo = {
      id: string;
      snippet: {
        title:                string;
        channelTitle:         string;
        liveBroadcastContent: string;
        thumbnails:           { medium?: { url: string }; default?: { url: string } };
      };
      contentDetails: { duration: string };
      statistics?:    { viewCount?: string };
    };

    let videos: YouTubePickerItem[] = (videosData.items ?? [])
      .filter((v: RawVideo) => v.snippet.liveBroadcastContent === 'none')
      .slice(0, limit)
      .map((v: RawVideo) => {
        const durationSec = parseYouTubeDuration(v.contentDetails.duration);
        return {
          id:           v.id,
          title:        v.snippet.title,
          thumbnailUrl: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? '',
          duration:     durationSec,
          url:          `https://www.youtube.com/watch?v=${v.id}`,
          embedUrl:     `https://www.youtube.com/embed/${v.id}?autoplay=1`,
          channelName:  v.snippet.channelTitle,
          isShort:      durationSec > 0 && durationSec <= 120,
          viewCount:    parseInt(v.statistics?.viewCount ?? '0', 10),
        };
      });

    // Playlist order is already newest-first. POPULAR sorts by viewCount.
    if (sort === 'POPULAR') {
      videos = videos.sort((a, b) => b.viewCount - a.viewCount);
    }

    return { videos, nextPageToken: nextToken };
  } catch {
    return { videos: [], nextPageToken: null };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

export function isSeaOfThievesYouTube(video: YouTubeVideoInfo): boolean {
  const SOT_KEYWORDS = ['sea of thieves', 'seaofthieves', 'sot'];
  const haystack = [video.title, video.description, ...video.tags].join(' ').toLowerCase();
  return SOT_KEYWORDS.some((kw) => haystack.includes(kw));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function extractChannelHandle(url: string): string | null {
  const m1 = url.match(/youtube\.com\/@([A-Za-z0-9_.-]+)/);
  if (m1) return `@${m1[1]}`;
  const m2 = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  const m3 = url.match(/youtube\.com\/([A-Za-z0-9_-]+)$/);
  if (m3) return m3[1];
  return null;
}
