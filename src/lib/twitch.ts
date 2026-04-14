export interface TwitchClipData {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

export interface TwitchGameData {
  id: string;
  name: string;
  box_art_url: string;
}

// Confirmed via Twitch Helix API live response
const SEA_OF_THIEVES_GAME_IDS = new Set(['490377', '490905', '515257']);

async function getTwitchAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

export function extractClipId(url: string): string | null {
  // Match: https://www.twitch.tv/{user}/clip/{clipId}
  // or: https://clips.twitch.tv/{clipId}
  const patterns = [
    /twitch\.tv\/\w+\/clip\/([\w-]+)/,
    /clips\.twitch\.tv\/([\w-]+)/,
    /twitch\.tv\/clip\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function fetchTwitchClip(clipId: string): Promise<TwitchClipData | null> {
  try {
    const token = await getTwitchAppToken();
    const res = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    return data.data[0];
  } catch (err) {
    console.error('fetchTwitchClip error:', err);
    return null;
  }
}

export function isSeaOfThievesClip(clip: TwitchClipData): boolean {
  return SEA_OF_THIEVES_GAME_IDS.has(clip.game_id);
}

export function buildEmbedUrl(clipId: string, parentDomain: string): string {
  return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parentDomain}`;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
}

export async function getTwitchUser(accessToken: string): Promise<TwitchUser | null> {
  try {
    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    return data.data[0];
  } catch {
    return null;
  }
}