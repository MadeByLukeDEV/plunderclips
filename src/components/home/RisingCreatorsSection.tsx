// src/components/home/RisingCreatorsSection.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Flame } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { useState, useEffect } from 'react';

type RisingCreator = {
  twitchLogin:     string;
  displayName:     string;
  profileImage:    string | null;
  latestThumbnail: string | null;
  isLive:          boolean;
  last7Views:      number;
  growthLabel:     string | null;
  badge:           { cls: string; emoji: string; label: string };
};

const RANK_STYLE: Record<number, string> = {
  1: 'text-teal font-900',
  2: 'text-white/50',
  3: 'text-yellow-600/70',
};

function CreatorCard({ creator, rank }: { creator: RisingCreator; rank: number }) {
  const isTop = rank === 1;

  return (
    <Link
      href={`/streamers/${creator.twitchLogin}`}
      className={`sot-card rounded-xl overflow-hidden hover:border-teal/20 transition-all duration-300 group relative ${
        isTop ? 'border-teal/20 shadow-[0_0_40px_rgba(0,229,192,0.06)]' : ''
      }`}
    >
      {/* Background thumbnail */}
      {creator.latestThumbnail && (
        <div className="absolute inset-0">
          <Image
            src={creator.latestThumbnail}
            alt=""
            fill
            className="object-cover opacity-[0.08] group-hover:opacity-[0.13] transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sot-card via-sot-card/90 to-sot-card/50" />
        </div>
      )}

      <div className="relative p-[clamp(0.875rem,2vw,1.25rem)]">
        {/* Top row: rank + badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`font-display text-xs tracking-wider ${RANK_STYLE[rank] ?? 'text-white/20'}`}>
            #{rank}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-display tracking-wide px-2 py-0.5 rounded border ${creator.badge.cls}`}>
            {creator.badge.emoji} {creator.badge.label}
          </span>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.875rem)] mb-3">
          <div className={`relative flex-shrink-0 rounded-full overflow-hidden border-2 transition-all ${
            isTop ? 'w-[clamp(2.5rem,5vw,3.5rem)] h-[clamp(2.5rem,5vw,3.5rem)] border-teal/35' :
                    'w-[clamp(2rem,4vw,2.5rem)] h-[clamp(2rem,4vw,2.5rem)] border-white/10'
          }`}>
            {creator.profileImage ? (
              <Image src={creator.profileImage} alt={creator.displayName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-sot-dark flex items-center justify-center text-lg">🏴‍☠️</div>
            )}
            {creator.isLive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-display font-700 text-white group-hover:text-teal transition-colors truncate ${
              isTop ? 'text-fluid-base' : 'text-fluid-sm'
            }`}>
              {creator.displayName}
            </p>
            <p className="text-white/30 text-[10px] font-mono">@{creator.twitchLogin}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          {creator.growthLabel && (
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-body">
              <Flame className="w-3 h-3 text-orange-400/60 flex-shrink-0" />
              <span className="truncate">{creator.growthLabel}</span>
            </div>
          )}
          {creator.last7Views > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-white/20 font-mono">
              <Eye className="w-3 h-3" />
              {creator.last7Views.toLocaleString('en-US')} views this week
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RisingCreatorsSection({ creators, cachedAt }: {
  creators: RisingCreator[];
  cachedAt: string;
}) {
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);

  useEffect(() => {
    setMinutesAgo(Math.floor((Date.now() - new Date(cachedAt).getTime()) / 60000));
  }, [cachedAt]);

  if (creators.length === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={<Flame className="w-4 h-4" />}
        label="Rising Creators"
        sub="Momentum-based — who's climbing the ranks right now"
      />

      {/* Top 3 — larger cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(0.75rem,2vw,1rem)] mb-[clamp(0.75rem,2vw,1rem)]">
        {creators.slice(0, 3).map((c, i) => (
          <CreatorCard key={c.id} creator={c} rank={i + 1} />
        ))}
      </div>

      {/* Remaining — compact row */}
      {creators.length > 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[clamp(0.5rem,1.5vw,0.75rem)]">
          {creators.slice(3).map((c, i) => (
            <CreatorCard key={c.id} creator={c} rank={i + 4} />
          ))}
        </div>
      )}

      <p className="text-white/15 text-[10px] font-mono mt-3 text-right tracking-wide">
        Updated {minutesAgo === null ? '…' : minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`} · refreshes every 6h
      </p>
    </section>
  );
}
