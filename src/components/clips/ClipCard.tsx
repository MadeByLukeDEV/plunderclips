'use client';
import Image from 'next/image';
import { useState } from 'react';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink } from 'lucide-react';

interface ClipTag { id: string; tag: string; }
interface Clip {
  id: string; twitchClipId: string; twitchUrl: string; embedUrl: string;
  title: string; thumbnailUrl: string | null; viewCount: number; duration: number | null;
  submittedByName: string; broadcasterName: string; status: string;
  tags: ClipTag[]; createdAt: string;
}

export function ClipCard({ clip }: { clip: Clip }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="clip-card sot-card rounded overflow-hidden group">
      {/* Thumbnail / Embed */}
      <div className="relative aspect-video bg-sot-dark cursor-pointer overflow-hidden" onClick={() => setOpen(!open)}>
        {open ? (
          <iframe src={clip.embedUrl} className="w-full h-full" allowFullScreen title={clip.title} />
        ) : (
          <>
            {clip.thumbnailUrl ? (
              <Image src={clip.thumbnailUrl} alt={clip.title} fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sot-dark text-4xl">🏴‍☠️</div>
            )}
            {/* Dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_24px_rgba(0,229,192,0.6)]">
                <span className="text-sot-bg text-lg ml-0.5">▶</span>
              </div>
            </div>
            {/* Duration */}
            {clip.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white/70 text-xs px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />{Math.floor(clip.duration)}s
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-display text-sm font-700 text-white line-clamp-2 mb-1 leading-snug tracking-wide">
          {clip.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-white/40 mb-2 font-mono">
          <span>{clip.broadcasterName}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{clip.viewCount.toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {clip.tags.slice(0, 3).map(t => <TagBadge key={t.id} tag={t.tag} small />)}
        </div>
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>by {clip.submittedByName}</span>
          <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 hover:text-teal transition-colors">
            <ExternalLink className="w-3 h-3" />Twitch
          </a>
        </div>
      </div>
    </div>
  );
}