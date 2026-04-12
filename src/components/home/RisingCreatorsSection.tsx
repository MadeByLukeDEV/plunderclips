// src/components/home/RisingCreatorsSection.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Flame } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

function CreatorCard({ creator, rank }: { creator: any; rank: number }) {
  const isTop = rank === 1;
  return (
    <Link href={`/streamers/${creator.twitchLogin}`}
      className={`sot-card rounded-lg overflow-hidden hover:border-teal/20 transition-all group relative ${
        isTop ? 'border border-teal/20 shadow-[0_0_40px_rgba(0,229,192,0.08)]' : ''
      }`}>
      {creator.latestThumbnail && (
        <div className="absolute inset-0">
          <Image src={creator.latestThumbnail} alt="" fill
            className="object-cover opacity-10 group-hover:opacity-15 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-sot-card via-sot-card/90 to-sot-card/60" />
        </div>
      )}
      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`font-display text-xs tracking-wider ${
            rank === 1 ? 'text-teal font-900' :
            rank === 2 ? 'text-white/50' :
            rank === 3 ? 'text-yellow-600/70' : 'text-white/20'
          }`}>#{rank}</span>
          <span className={`flex items-center gap-1 text-xs font-display tracking-wider px-2 py-0.5 rounded border ${creator.badge.cls}`}>
            {creator.badge.emoji} {creator.badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className={`relative flex-shrink-0 rounded-full overflow-hidden border-2 ${
            isTop ? 'w-14 h-14 border-teal/40' : 'w-10 h-10 border-white/10'
          }`}>
            {creator.profileImage ? (
              <Image src={creator.profileImage} alt={creator.displayName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-sot-dark flex items-center justify-center text-lg">🏴‍☠️</div>
            )}
            {creator.isLive && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-sot-bg block" />
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-display font-700 text-white group-hover:text-teal transition-colors truncate ${isTop ? 'text-base' : 'text-sm'}`}>
              {creator.displayName}
            </p>
            <p className="text-white/30 text-xs font-mono">@{creator.twitchLogin}</p>
          </div>
        </div>
        {creator.growthLabel && (
          <div className="flex items-center gap-1.5 text-xs text-white/40 font-body">
            <Flame className="w-3 h-3 text-orange-400/60 flex-shrink-0" />
            <span className="truncate">{creator.growthLabel}</span>
          </div>
        )}
        {creator.last7Views > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/20 font-mono mt-1">
            <Eye className="w-3 h-3" />{creator.last7Views.toLocaleString()} views this week
          </div>
        )}
      </div>
    </Link>
  );
}

export function RisingCreatorsSection({ creators, cachedAt }: {
  creators: any[]; cachedAt: string;
}) {
  if (creators.length === 0) return null;
  const minutesAgo = Math.floor((Date.now() - new Date(cachedAt).getTime()) / 60000);

  return (
    <section>
      <SectionHeader
        icon={<Flame className="w-5 h-5" />}
        label="Rising Creators"
        sub="Momentum-based — who's climbing the ranks right now"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {creators.slice(0, 3).map((c, i) => <CreatorCard key={c.id} creator={c} rank={i + 1} />)}
      </div>
      {creators.slice(3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {creators.slice(3).map((c, i) => <CreatorCard key={c.id} creator={c} rank={i + 4} />)}
        </div>
      )}
      <p className="text-white/15 text-xs font-mono mt-3 text-right">
        Updated {minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`} · refreshes every 6h
      </p>
    </section>
  );
}