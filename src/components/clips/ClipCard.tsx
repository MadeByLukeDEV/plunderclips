// src/components/clips/ClipCard.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink, Youtube, Swords } from 'lucide-react';

interface ClipTag { id: string; tag: string; }
interface Clip {
  id: string; twitchClipId: string; twitchUrl: string; embedUrl: string;
  title: string; thumbnailUrl: string | null; viewCount: number; duration: number | null;
  submittedByName: string; broadcasterName: string; status: string;
  platform: 'TWITCH' | 'YOUTUBE' | 'MEDAL';
  tags: ClipTag[]; createdAt: string;
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === 'YOUTUBE') return (
    <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 text-white text-xs px-1.5 py-0.5 rounded font-mono">
      <Youtube className="w-3 h-3" />YT
    </span>
  );
  if (platform === 'MEDAL') return (
    <span className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500/90 text-black text-xs px-1.5 py-0.5 rounded font-mono font-bold">
      🏅 Medal
    </span>
  );
  return null; // Twitch has no badge — it's the default
}

function ExternalLinkLabel({ platform, url }: { platform: string; url: string }) {
  const labels: Record<string, string> = { TWITCH: 'Twitch', YOUTUBE: 'YouTube', MEDAL: 'Medal' };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="flex items-center gap-1 hover:text-teal transition-colors">
      <ExternalLink className="w-3 h-3" />{labels[platform] || 'View'}
    </a>
  );
}

export function ClipCard({ clip }: { clip: Clip }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="clip-card sot-card rounded overflow-hidden group">
      {/* Thumbnail / Embed */}
      <div className="relative bg-sot-dark overflow-hidden cursor-pointer"
        style={{ paddingBottom: open ? '0' : '56.25%', height: open ? 'auto' : undefined }}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={clip.embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title={clip.title}
              allow="autoplay; fullscreen"
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            {clip.thumbnailUrl ? (
              <Image src={clip.thumbnailUrl} alt={clip.title} fill loading="lazy" style={{objectFit: "cover"}}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 639px) calc(100vw - 32px),
       (max-width: 1023px) calc(50vw - 24px),
       (max-width: 1279px) calc(33vw - 24px),
       calc(25vw - 24px)" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sot-dark text-4xl">🏴‍☠️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Platform badge */}
            <PlatformBadge platform={clip.platform} />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_28px_rgba(0,229,192,0.7)]">
                <span className="text-sot-bg text-xl ml-1">▶</span>
              </div>
            </div>
            {/* Duration */}
            {clip.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white/70 text-xs px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />{Math.floor(clip.duration)}s
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <Link href={`/clips/${clip.id}`}
          className="font-display text-sm font-700 text-white hover:text-teal transition-colors line-clamp-2 mb-1 leading-snug tracking-wide block">
          {clip.title}
        </Link>
        <div className="flex items-center justify-between text-xs text-white/40 mb-2 font-mono">
          <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
            onClick={e => e.stopPropagation()}
            className="hover:text-teal transition-colors">
            {clip.broadcasterName}
          </Link>
          {clip.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />{clip.viewCount.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {clip.tags.slice(0, 3).map(t => <TagBadge key={t.id} tag={t.tag} small />)}
        </div>
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>by {clip.submittedByName}</span>
          <ExternalLinkLabel platform={clip.platform} url={clip.twitchUrl} />
        </div>
      </div>
    </div>
  );
}
