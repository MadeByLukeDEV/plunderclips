// src/lib/og-helpers.ts
// Shared utilities for Next.js ImageResponse OG image generation.
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Font loading ───────────────────────────────────────────────────────────────

export type OGFont = { name: string; data: ArrayBuffer; weight: 700 | 900; style: 'normal' };

// Cached per cold start — avoids re-fetching on every OG image request
let _fonts: OGFont[] | null = null;

async function fetchWithTimeout(url: string, options: RequestInit, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  // Firefox 38 UA → Google returns woff (not woff2). Satori supports woff + ttf, NOT woff2.
  const ua = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:38.0) Gecko/20100101 Firefox/38.0';

  const css = await (
    await fetchWithTimeout(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=block`,
      { headers: { 'User-Agent': ua } },
    )
  ).text();

  const match = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!match?.[1]) throw new Error(`Google Fonts URL not found: ${family} ${weight}`);

  return (await fetchWithTimeout(match[1], { headers: { 'User-Agent': ua } })).arrayBuffer();
}

export async function getOGFonts(): Promise<OGFont[]> {
  if (_fonts) return _fonts;
  try {
    const [bold, black] = await Promise.all([
      fetchGoogleFont('Barlow Condensed', 700),
      fetchGoogleFont('Barlow Condensed', 900),
    ]);
    _fonts = [
      { name: 'Barlow', data: bold,  weight: 700, style: 'normal' },
      { name: 'Barlow', data: black, weight: 900, style: 'normal' },
    ];
  } catch {
    _fonts = [];
  }
  return _fonts;
}

// ── Static asset loading ───────────────────────────────────────────────────────

// Read a file from public/ as a base64 data URI. Returns null if not present.
export function getLocalAsset(filename: string): string | null {
  try {
    const filePath = join(process.cwd(), 'public', filename);
    if (!existsSync(filePath)) return null;
    const buf = readFileSync(filePath);
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'png';
    const mime =
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

// ── Formatting ─────────────────────────────────────────────────────────────────

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.0', '')}K`;
  return n.toLocaleString();
}

// ── Role badge styles ──────────────────────────────────────────────────────────

export type OGBadgeStyle = { label: string; color: string; border: string; bg: string };

export const ROLE_OG: Record<string, OGBadgeStyle> = {
  ADMIN:       { label: 'Captain',       color: '#fca5a5', border: 'rgba(239,68,68,0.50)',   bg: 'rgba(239,68,68,0.15)'   },
  FEATURED:    { label: 'Pirate Legend', color: '#fef08a', border: 'rgba(250,204,21,0.55)',  bg: 'rgba(250,204,21,0.15)'  },
  MODERATOR:   { label: 'First Mate',    color: '#6ee7b7', border: 'rgba(16,185,129,0.50)',  bg: 'rgba(16,185,129,0.12)'  },
  PARTNER:     { label: 'Navigator',     color: '#c4b5fd', border: 'rgba(139,92,246,0.50)',  bg: 'rgba(139,92,246,0.15)'  },
  VERIFIED:    { label: 'Sea Dog',       color: '#67e8f9', border: 'rgba(34,211,238,0.50)',  bg: 'rgba(6,182,212,0.12)'   },
  VIP:         { label: 'Privateer',     color: '#fdba74', border: 'rgba(249,115,22,0.50)',  bg: 'rgba(249,115,22,0.15)'  },
  SUPPORTER:   { label: 'Gold Hoarder',  color: '#f9a8d4', border: 'rgba(236,72,153,0.50)',  bg: 'rgba(236,72,153,0.12)'  },
  CONTRIBUTOR: { label: 'Plunderer',     color: '#bef264', border: 'rgba(132,204,22,0.50)',  bg: 'rgba(132,204,22,0.12)'  },
  USER:        { label: 'Deckhand',      color: '#94a3b8', border: 'rgba(100,116,139,0.40)', bg: 'rgba(100,116,139,0.10)' },
};

// ── Platform badge styles ──────────────────────────────────────────────────────

export const PLATFORM_OG: Record<string, OGBadgeStyle> = {
  TWITCH:  { label: 'TWITCH',   color: '#c084fc', border: 'rgba(168,85,247,0.40)',  bg: 'rgba(168,85,247,0.12)' },
  YOUTUBE: { label: 'YOUTUBE',  color: '#f87171', border: 'rgba(239,68,68,0.40)',   bg: 'rgba(239,68,68,0.10)'  },
  MEDAL:   { label: 'MEDAL.TV', color: '#94a3b8', border: 'rgba(148,163,184,0.40)', bg: 'rgba(148,163,184,0.10)'},
};

// ── Tag labels (mirrors TagBadge.tsx — no client component import needed) ──────

export const TAG_OG_LABELS: Record<string, string> = {
  FUNNY: 'Funny', MEME: 'Meme', CHAOS: 'Chaos', EPIC_FAIL: 'Epic Fail',
  HIGHLIGHT: 'Highlight', CLUTCH: 'Clutch', INSANE: 'Insane', SKILLFUL: 'Skillful',
  PVP: 'PvP', PVE: 'PvE', HOURGLASS: 'Hourglass',
  SHIP_BATTLE: 'Ship Battle', BOARDING: 'Boarding', KILL: 'Kill', SINK: 'Sink',
  TUCK: 'Tuck', STEAL: 'Steal', HEIST: 'Heist', SNEAKY: 'Sneaky',
  TEAM_PLAY: 'Team Play', SOLO: 'Solo', DUO: 'Duo', CREW: 'Crew',
  KRAKEN: 'Kraken', MEGALODON: 'Megalodon', SIREN: 'Siren', FORT: 'Fort',
  FLEET: 'Fleet', BOSS_FIGHT: 'Boss Fight',
  SAILING: 'Sailing', TREASURE: 'Treasure', ADVENTURE: 'Adventure',
  VOICE_CHAT: 'Voice Chat', WHOLESOME: 'Wholesome', UNEXPECTED: 'Unexpected',
};
