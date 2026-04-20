// src/lib/platforms.ts

// ─── Platform Detection ───────────────────────────────────────────────────────

export type Platform = 'TWITCH' | 'YOUTUBE' | 'MEDAL';

export function detectPlatform(url: string): Platform | null {
  if (/clips\.twitch\.tv|twitch\.tv\/.+\/clip\//i.test(url)) return 'TWITCH';
  if (/youtube\.com\/(watch|shorts\/)|youtu\.be\//i.test(url)) return 'YOUTUBE';
  if (/medal\.tv/i.test(url)) return 'MEDAL';
  return null;
}

// ─── Medal.tv ─────────────────────────────────────────────────────────────────
// No API available for clip/user lookup.
// Medal clips are accepted by URL only and always sent to manual moderation.

export function extractMedalClipId(url: string): string | null {
  // Fix: match /clips/ anywhere in the path, not just after one segment.
  // medal.tv/games/sea-of-thieves/clips/ID  ← two segments before /clips/
  const m = url.match(/\/clips\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

export function extractYouTubeVideoId(url: string): string | null {
  // Standard watch URL
  const m1 = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  // Short URL
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  // Shorts URL — /shorts/ID (not /shorts?v=ID)
  const m3 = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

export function extractYouTubeChannelHandle(url: string): string | null {
  const m1 = url.match(/youtube\.com\/@([A-Za-z0-9_.-]+)/);
  if (m1) return `@${m1[1]}`;
  const m2 = url.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  const m3 = url.match(/youtube\.com\/([A-Za-z0-9_-]+)$/);
  if (m3) return m3[1];
  return null;
}

export interface YouTubeChannelInfo {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string;
}

export async function fetchYouTubeChannel(url: string): Promise<YouTubeChannelInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set');

  const handle = extractYouTubeChannelHandle(url);
  if (!handle) return null;

  if (handle.startsWith('@')) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle.slice(1))}&key=${apiKey}`
    );
    const data = await res.json();
    const channel = data.items?.[0];
    if (channel) return {
      channelId: channel.id,
      channelName: channel.snippet.title,
      thumbnailUrl: channel.snippet.thumbnails?.default?.url,
    };
  }

  if (handle.startsWith('UC')) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${handle}&key=${apiKey}`
    );
    const data = await res.json();
    const channel = data.items?.[0];
    if (channel) return {
      channelId: channel.id,
      channelName: channel.snippet.title,
      thumbnailUrl: channel.snippet.thumbnails?.default?.url,
    };
  }

  return null;
}

export interface YouTubeVideoInfo {
  viewCount: number;
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  categoryId: string;
  tags: string[];
  description: string;
  duration: string; // ISO 8601
}

export async function fetchYouTubeVideo(videoId: string): Promise<YouTubeVideoInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set');

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
  );
  const data = await res.json();
  const video = data.items?.[0];
  if (!video) return null;

  return {
    videoId,
    title: video.snippet.title,
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    thumbnailUrl:
      video.snippet.thumbnails?.maxres?.url ||
      video.snippet.thumbnails?.high?.url ||
      video.snippet.thumbnails?.default?.url || '',
    categoryId: video.snippet.categoryId,
    tags: video.snippet.tags || [],
    description: video.snippet.description || '',
    duration: video.contentDetails.duration,
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
  };
}

export function isSeaOfThievesYouTube(video: YouTubeVideoInfo): boolean {
  const SOT_KEYWORDS = ['sea of thieves', 'seaofthieves', 'sot'];
  const haystack = [video.title, video.description, ...video.tags].join(' ').toLowerCase();
  return SOT_KEYWORDS.some(kw => haystack.includes(kw));
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