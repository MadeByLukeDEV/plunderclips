// src/lib/platforms.ts
// Platform detection + API helpers for YouTube and Medal.tv

// ─── Platform Detection ───────────────────────────────────────────────────────

export type Platform = 'TWITCH' | 'YOUTUBE' | 'MEDAL';

export function detectPlatform(url: string): Platform | null {
  if (/clips\.twitch\.tv|twitch\.tv\/.+\/clip\//i.test(url)) return 'TWITCH';
  if (/youtube\.com\/watch|youtu\.be\//i.test(url)) return 'YOUTUBE';
  if (/medal\.tv/i.test(url)) return 'MEDAL';
  return null;
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

export function extractYouTubeVideoId(url: string): string | null {
  const m1 = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

export function extractYouTubeChannelHandle(url: string): string | null {
  // https://www.youtube.com/@AboutSelphy  or  /channel/UCxxxx
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

  // Try by handle (@name)
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

  // Try by channel ID directly
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
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );
  const data = await res.json();
  const video = data.items?.[0];
  if (!video) return null;

  return {
    videoId,
    title: video.snippet.title,
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || '',
    categoryId: video.snippet.categoryId,
    tags: video.snippet.tags || [],
    description: video.snippet.description || '',
    duration: video.contentDetails.duration,
  };
}

// Sea of Thieves verification for YouTube (title/tags/description based)
export function isSeaOfThievesYouTube(video: YouTubeVideoInfo): boolean {
  const SOT_KEYWORDS = ['sea of thieves', 'seaofthieves', 'sot'];
  const haystack = [
    video.title,
    video.description,
    ...video.tags,
  ].join(' ').toLowerCase();
  return SOT_KEYWORDS.some(kw => haystack.includes(kw));
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

// Approximate duration in seconds from ISO 8601 (PT1M30S → 90)
export function parseYouTubeDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

// ─── Medal.tv ─────────────────────────────────────────────────────────────────

export function extractMedalClipId(url: string): string | null {
  // https://medal.tv/games/sea-of-thieves/clips/miY3uWSfogOLWXRUU
  const m = url.match(/medal\.tv\/[^/]+\/clips\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  // fallback: /clips/ID
  const m2 = url.match(/medal\.tv\/clips\/([A-Za-z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

export function extractMedalUserId(url: string): string | null {
  // https://medal.tv/users/12597  or  medal.tv/u/username
  const m1 = url.match(/medal\.tv\/users\/(\d+)/);
  if (m1) return m1[1];
  return null;
}

export function extractMedalUsername(url: string): string | null {
  const m = url.match(/medal\.tv\/(?:users\/\d+|u\/([A-Za-z0-9_-]+))/);
  if (m?.[1]) return m[1];
  return null;
}

export interface MedalUserInfo {
  userId: string;
  username: string;
  thumbnailUrl?: string;
}

export async function fetchMedalUser(profileUrl: string): Promise<MedalUserInfo | null> {
  const apiKey = process.env.MEDAL_API_KEY;
  if (!apiKey) throw new Error('MEDAL_API_KEY not set');

  const userId = extractMedalUserId(profileUrl);
  if (!userId) return null;

  const res = await fetch(
    `https://developers.medal.tv/v1/users?userId=${userId}`,
    { headers: { Authorization: apiKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const u = data.users?.[0] ?? data;
  if (!u) return null;

  return {
    userId: String(userId),
    username: u.userName || u.displayName || u.name || `User ${userId}`,
    thumbnailUrl: u.thumbnail || u.avatar,
  };
}

export interface MedalClipInfo {
  clipId: string;
  contentId: string;
  title: string;
  userId: string;
  embedUrl: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds
  categoryName: string;
}

const SOT_MEDAL_KEYWORDS = ['sea of thieves', 'seaofthieves'];

export async function fetchMedalClip(clipUrl: string): Promise<MedalClipInfo | null> {
  const apiKey = process.env.MEDAL_API_KEY;
  if (!apiKey) throw new Error('MEDAL_API_KEY not set');

  // Medal API: search clips by URL via /v1/clips?url=
  const encoded = encodeURIComponent(clipUrl.split('?')[0]); // strip invite params
  const res = await fetch(
    `https://developers.medal.tv/v1/clips?url=${encoded}&limit=1`,
    { headers: { Authorization: apiKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const clip = data.contentObjects?.[0] ?? data.clips?.[0];
  if (!clip) return null;

  return {
    clipId: clip.contentId || clip.clipId,
    contentId: clip.contentId,
    title: clip.contentTitle || clip.title,
    userId: String(clip.userId || clip.publisherId),
    embedUrl: clip.embedIframeUrl || clip.embedUrl || `https://medal.tv/clip/${clip.contentId}`,
    thumbnailUrl: clip.thumbnail || clip.thumbnailUrl || '',
    videoUrl: clip.contentUrl || clipUrl,
    duration: Math.round(clip.videoLengthSeconds || clip.duration || 0),
    categoryName: clip.categoryName || '',
  };
}

export function isSeaOfThievesMedal(clip: MedalClipInfo): boolean {
  const haystack = [clip.title, clip.categoryName].join(' ').toLowerCase();
  return SOT_MEDAL_KEYWORDS.some(kw => haystack.includes(kw)) ||
    clip.categoryName.toLowerCase().includes('sea of thieves');
}

export function buildMedalEmbedUrl(clip: MedalClipInfo): string {
  return clip.embedUrl;
}
