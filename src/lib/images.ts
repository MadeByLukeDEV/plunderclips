// src/lib/images.ts
// Centralised image URL optimisation for all platforms

// ─── Twitch ───────────────────────────────────────────────────────────────────

/**
 * Twitch clip thumbnails come as a template:
 * https://static-cdn.jtvnw.net/.../thumbnail-%{width}x%{height}.jpg
 * Replace the placeholders with the actual size we want.
 */
export function getTwitchClipThumbnail(
  rawUrl: string,
  width = 640,
  height = 360
): string {
  if (!rawUrl) return '';
  return rawUrl
    .replace('%{width}', String(width))
    .replace('%{height}', String(height));
}

/**
 * Twitch profile images come as 300x300 PNG:
 * https://static-cdn.jtvnw.net/jtv_user_pictures/xxx-profile_image-300x300.png
 *
 * Supported sizes: 28x28, 50x50, 70x70, 150x150, 300x300, 600x600
 * We request 150x150 for avatars — good enough, half the bytes.
 */
export function getTwitchProfileImage(rawUrl: string, size: 70 | 150 | 300 | 600 = 150): string {
  if (!rawUrl) return '';
  return rawUrl.replace('300x300', `${size}x${size}`);
}

// ─── YouTube ─────────────────────────────────────────────────────────────────

/**
 * YouTube video thumbnails — pick the right size for the context.
 *
 * Available sizes:
 *  default   → 120x90  (mqdefault fallback)
 *  mqdefault → 320x180
 *  hqdefault → 480x360
 *  sddefault → 640x480
 *  maxresdefault → 1280x720 (not always available)
 *
 * Strategy: use hqdefault for cards, maxresdefault for hero/featured.
 * Always fall back gracefully.
 */
export type YouTubeThumbnailSize = 'card' | 'hero';

export function getYouTubeThumbnail(
  videoId: string,
  size: YouTubeThumbnailSize = 'card'
): string {
  if (!videoId) return '';
  // We construct the URL directly — more reliable than API-provided URLs
  // which sometimes return 404 for maxres
  if (size === 'hero') {
    // Try maxres first — caller should handle 404 with onError fallback
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  }
  // hqdefault is always available, 480x360 is plenty for a card
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * YouTube channel avatars — request high quality (800x800)
 * instead of default (88x88).
 */
export function getYouTubeChannelAvatar(thumbnailUrl: string): string {
  if (!thumbnailUrl) return '';
  // Replace =s88 or similar sizing params if present
  return thumbnailUrl.replace(/=s\d+(-c)?/, '=s300-c');
}

// ─── Generic helper ───────────────────────────────────────────────────────────

/**
 * Given a stored clip thumbnailUrl, return an optimised version
 * based on the platform and intended display size.
 */
export function getClipThumbnail(
  thumbnailUrl: string | null,
  platform: 'TWITCH' | 'YOUTUBE' | 'MEDAL',
  size: 'card' | 'hero' = 'card'
): string {
  if (!thumbnailUrl) return '';

  if (platform === 'TWITCH') {
    const dimensions = size === 'hero' ? { w: 1280, h: 720 } : { w: 640, h: 360 };
    return getTwitchClipThumbnail(thumbnailUrl, dimensions.w, dimensions.h);
  }

  if (platform === 'YOUTUBE') {
    // Extract video ID from stored URL or construct from i.ytimg.com format
    const ytMatch = thumbnailUrl.match(/\/vi\/([A-Za-z0-9_-]+)\//);
    if (ytMatch) return getYouTubeThumbnail(ytMatch[1], size);
    return thumbnailUrl;
  }

  // Medal — no resizing API, return as-is
  return thumbnailUrl;
}