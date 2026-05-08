// src/modules/platform/twitch.service.ts
// Twitch Helix API interactions — migrated from src/lib/twitch.ts + src/lib/eventsub.ts

import { createHmac, timingSafeEqual } from 'node:crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
}

export interface TwitchGameData {
  id: string;
  name: string;
  box_art_url: string;
}

export interface TwitchStreamData {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Confirmed via Twitch Helix API live response
const SEA_OF_THIEVES_GAME_IDS = new Set(['490377', '490905', '515257']);

// ── Internal helpers ──────────────────────────────────────────────────────────

// In-process token cache — avoids a Twitch OAuth round-trip on every request
let _token       = '';
let _tokenExpiry = 0;

async function getAppToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' },
  );
  const data = await res.json();
  _token       = data.access_token as string;
  _tokenExpiry = Date.now() + ((data.expires_in as number) - 300) * 1000; // 5 min buffer
  return _token;
}

function twitchPickerEmbedUrl(clipId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const parent = appUrl.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parent}`;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

export function extractClipId(url: string): string | null {
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

export function buildEmbedUrl(clipId: string, parentDomain: string): string {
  return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parentDomain}`;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchTwitchClip(clipId: string): Promise<TwitchClipData | null> {
  try {
    const token = await getAppToken();
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

// ── Validation ────────────────────────────────────────────────────────────────

export function isSeaOfThievesClip(clip: TwitchClipData): boolean {
  return SEA_OF_THIEVES_GAME_IDS.has(clip.game_id);
}

// ── Streams API ───────────────────────────────────────────────────────────────

// Batch-fetch live stream data for up to 100 user IDs
export async function fetchLiveStreams(twitchIds: string[]): Promise<TwitchStreamData[]> {
  if (twitchIds.length === 0) return [];
  const token = await getAppToken();
  const query = twitchIds.map((id) => `user_id=${id}`).join('&');
  const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
    },
  });
  if (!res.ok) throw new Error(`Twitch streams API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

// ── EventSub subscription management ─────────────────────────────────────────

function getCallbackUrl(): string {
  return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/twitch`;
}

export async function subscribeToLiveEvents(twitchUserId: string): Promise<void> {
  const token = await getAppToken();
  const callbackUrl = getCallbackUrl();
  const secret = process.env.TWITCH_WEBHOOK_SECRET!;

  for (const type of ['stream.online', 'stream.offline'] as const) {
    const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        version: '1',
        condition: { broadcaster_user_id: twitchUserId },
        transport: { method: 'webhook', callback: callbackUrl, secret },
      }),
    });
    const data = await res.json();
    if (!res.ok) console.error(`EventSub subscribe error for ${type}:`, data);
  }
}

export async function unsubscribeFromLiveEvents(twitchUserId: string): Promise<void> {
  const token = await getAppToken();
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
    },
  });
  if (!res.ok) { console.error('Failed to list EventSub subscriptions'); return; }

  const subs: { id: string; type: string; condition: { broadcaster_user_id: string } }[] =
    (await res.json()).data ?? [];

  const matching = subs.filter(
    (s) =>
      s.condition?.broadcaster_user_id === twitchUserId &&
      ['stream.online', 'stream.offline'].includes(s.type),
  );

  for (const sub of matching) {
    await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });
  }
}

// Fetch all subscriptions with cursor pagination (for admin panel)
export async function fetchAllEventSubSubscriptions(token: string): Promise<unknown[]> {
  const subs: unknown[] = [];
  let cursor: string | null = null;

  do {
    const url: string = cursor
      ? `https://api.twitch.tv/helix/eventsub/subscriptions?after=${cursor}`
      : 'https://api.twitch.tv/helix/eventsub/subscriptions';
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });
    const data: { data?: unknown[]; pagination?: { cursor?: string } } = await res.json();
    subs.push(...(data.data ?? []));
    cursor = data.pagination?.cursor ?? null;
  } while (cursor);

  return subs;
}

// ── Clip picker ───────────────────────────────────────────────────────────────

export type TwitchPickerSort = 'NEWEST' | 'POPULAR';

export interface TwitchPickerClip {
  id:           string;
  title:        string;
  thumbnailUrl: string;
  duration:     number;
  url:          string;
  embedUrl:     string;
  channelName:  string;
  viewCount:    number;
  createdAt:    string;
}

export interface TwitchPickerResult {
  clips:      TwitchPickerClip[];
  nextCursor: string | null;
}

export async function fetchUserClips(
  twitchUserId: string,
  options: { cursor?: string } = {},
): Promise<TwitchPickerResult> {
  const { cursor } = options;
  try {
    const token = await getAppToken();
    // Fetch up to 100 clips — the API returns them by view_count desc.
    // We sort all 100 by created_at desc client-side so the newest always appears first.
    const params = new URLSearchParams({ broadcaster_id: twitchUserId, first: '100' });
    if (cursor) params.set('after', cursor);

    const response = await fetch(
      `https://api.twitch.tv/helix/clips?${params}`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) return { clips: [], nextCursor: null };
    const body: { data: TwitchClipData[]; pagination?: { cursor?: string } } = await response.json();

    const clips: TwitchPickerClip[] = (body.data ?? [])
      .map((c) => ({
        id:           c.id,
        title:        c.title,
        thumbnailUrl: c.thumbnail_url,
        duration:     c.duration,
        url:          c.url,
        embedUrl:     twitchPickerEmbedUrl(c.id),
        channelName:  c.broadcaster_name,
        viewCount:    c.view_count,
        createdAt:    c.created_at,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { clips, nextCursor: body.pagination?.cursor ?? null };
  } catch {
    return { clips: [], nextCursor: null };
  }
}

// Re-export getAppToken for routes that need a raw token (admin/eventsub)
export { getAppToken as getTwitchAppToken };

// ── Webhook signature verification ───────────────────────────────────────────

export function verifyTwitchSignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const secret = process.env.TWITCH_WEBHOOK_SECRET!;
  const message = messageId + timestamp + body;
  const expected = 'sha256=' + createHmac('sha256', secret).update(message).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
