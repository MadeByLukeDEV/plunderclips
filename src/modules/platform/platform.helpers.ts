// src/modules/platform/platform.helpers.ts
// Shared platform detection and URL parsing utilities.

export type Platform = 'TWITCH' | 'YOUTUBE' | 'MEDAL';

export function detectPlatform(url: string): Platform | null {
  if (/clips\.twitch\.tv|twitch\.tv\/.+\/clip\//i.test(url)) return 'TWITCH';
  if (/youtube\.com\/(watch|shorts\/)|youtu\.be\//i.test(url))  return 'YOUTUBE';
  if (/medal\.tv/i.test(url))                                   return 'MEDAL';
  return null;
}

export function extractMedalClipId(url: string): string | null {
  // medal.tv/games/sea-of-thieves/clips/ID — match /clips/ anywhere in the path
  const m = url.match(/\/clips\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}
