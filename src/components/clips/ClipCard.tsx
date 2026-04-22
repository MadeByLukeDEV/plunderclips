// src/components/clips/ClipCard.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink, Youtube, Monitor } from 'lucide-react';

interface ClipTag { id: string; tag: string; }
interface Clip {
  id: string; twitchClipId: string; twitchUrl: string; embedUrl: string;
  title: string; thumbnailUrl: string | null; viewCount: number; duration: number | null;
  submittedByName: string; broadcasterName: string; status: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'MEDAL';
  tags: ClipTag[]; createdAt: string;
}

// Platform badge — top-left of thumbnail
function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'YOUTUBE') return (
    <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-sm font-display tracking-wider">
      <Youtube className="w-3 h-3" />YT
    </span>
  );
  if (platform === 'MEDAL') return (
    <span className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-sm font-display tracking-wider">
      <Monitor className="w-3 h-3" />MEDAL
    </span>
  );
  return null;
}

// Platform label for external link
const PLATFORM_LABELS: Record<string, string> = {
  TWITCH: 'Twitch', YOUTUBE: 'YouTube', MEDAL: 'Medal',
};

export function ClipCard({ clip }: { clip: Clip }) {
  const [open, setOpen] = useState(false);

  // Fix hydration — always use explicit locale
  const viewCountFormatted = clip.viewCount > 0
    ? clip.viewCount.toLocaleString('en-US')
    : null;

  return (
    <div className="clip-card sot-card rounded-lg overflow-hidden group flex flex-col min-h-full">

      {/* ── Thumbnail / Embed ─────────────────────────────────────────────── */}
      <div className="relative bg-sot-dark cursor-pointer flex-shrink-0 "
        style={{ paddingBottom: open ? '0' : '56.25%' }}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe src={clip.embedUrl} className="absolute inset-0 w-full h-full"
              allowFullScreen title={clip.title} allow="autoplay; fullscreen" />
          </div>
        ) : (
          <div className="absolute inset-0 ">
            {clip.thumbnailUrl ? (
              <Image
                src={clip.thumbnailUrl}
                alt={clip.title}
                fill
                className="group-hover:scale-105 transition-transform duration-500 will-change-transform object-cover "
                sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 24px), (max-width: 1279px) calc(33vw - 24px), calc(25vw - 24px)"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-sot-dark text-4xl">🏴‍☠️</div>
            )}

            {/* Bottom gradient — makes duration badge readable */}
            <div className="absolute  group-hover:scale-105 transition-transform duration-500 will-change-transform bg-gradient-to-t from-black/75 via-transparent to-transparent" />

            {/* Platform badge */}
            <PlatformBadge platform={clip.platform} />

            {/* Duration — bottom right */}
            {clip.duration && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white/80 text-xs px-1.5 py-0.5 rounded font-mono">
                <Clock className="w-2.5 h-2.5" />{Math.floor(clip.duration)}s
              </div>
            )}

            {/* Play button — always visible on mobile, hover on desktop */}
            <div className="absolute inset-0 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-12 h-12 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_24px_rgba(0,229,192,0.6)]">
                <span className="text-sot-bg text-lg ml-0.5">▶</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Info ─────────────────────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2 flex-1">
      <div className="min-h-1">
        {/* Title */}
        <Link href={`/clips/${clip.id}`}
          className="font-display text-sm font-700 text-white hover:text-teal transition-colors line-clamp-2 leading-snug tracking-wide block min-h-50">
          {clip.title}
        </Link>
        </div>

        {/* Streamer + views */}
        <div className="flex items-center justify-between text-xs font-mono min-h-5">
          <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
            onClick={e => e.stopPropagation()}
            className="text-white/50 hover:text-teal transition-colors truncate max-w-[60%]">
            {clip.broadcasterName}
          </Link>
          {viewCountFormatted && (
            <span className="flex items-center gap-1 text-white/35 flex-shrink-0">
              <Eye className="w-3 h-3" />{viewCountFormatted}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs font-mono min-h-10">
        {/* Tags */}
        {clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clip.tags.slice(0, 3).map(t => <TagBadge key={t.id} tag={t.tag} small />)}
          </div>
        )}
        </div>

        {/* Footer — submitted by + external link */}
        <div className="flex items-center justify-between text-xs text-white/25 mt-auto pt-1 border-t border-white/5 min-h-10">
          <span className="font-body truncate max-w-[60%]">by {clip.submittedByName}</span>
          <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-teal transition-colors flex-shrink-0 font-display tracking-wider">
            <ExternalLink className="w-3 h-3" />
            {PLATFORM_LABELS[clip.platform] || 'View'}
          </a>
        </div>
      </div>
    </div>
  );
}