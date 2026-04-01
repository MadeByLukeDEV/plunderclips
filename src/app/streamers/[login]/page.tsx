// src/app/streamers/[login]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ClipCard } from '@/components/clips/ClipCard';
import { TagBadge } from '@/components/ui/TagBadge';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Eye, Film, TrendingUp, ExternalLink, Radio } from 'lucide-react';
import { useState } from 'react';
import { TAG_LABELS } from '@/components/ui/TagBadge';

const TAGS = Object.keys(TAG_LABELS);

const LIVE_ROLES = ['PARTNER', 'ADMIN'];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN:     { label: 'Captain',     cls: 'text-red-400 border-red-400/30 bg-red-400/10' },
  PARTNER:   { label: 'Partner',     cls: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
  MODERATOR: { label: 'First Mate',  cls: 'text-green-400 border-green-400/30 bg-green-400/10' },
  SUPPORTER: { label: 'Bilge Rat',   cls: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  USER:      { label: 'Crew Member', cls: 'text-gray-300 border-gray-400/20 bg-gray-400/10' },
};

export default function StreamerPage() {
  const { login } = useParams<{ login: string }>();
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['streamer', login],
    queryFn: () => fetch(`/api/streamers/${login}`).then(r => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    }),
    // Refetch every 60s to keep live status fresh
    refetchInterval: 60_000,
  });

  const clips: any[] = data?.clips || [];
  const filtered = clips
    .filter(c => !tag || c.tags.some((t: any) => t.tag === tag))
    .sort((a, b) =>
      sort === 'popular'
        ? b.viewCount - a.viewCount
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (isError) return (
    <div className="text-center py-24 max-w-md mx-auto px-6">
      <p className="font-display text-4xl text-white/20 mb-3">UNKNOWN WATERS</p>
      <p className="text-white/30 text-sm mb-6">This streamer hasn't registered on PlunderClips yet.</p>
      <Link href="/" className="btn-teal px-6 py-2 rounded text-sm inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />Back to Explore
      </Link>
    </div>
  );

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
      <div className="skeleton h-6 w-32 rounded mb-8" />
      <div className="flex items-center gap-5 mb-10">
        <div className="skeleton w-20 h-20 rounded" />
        <div className="space-y-2">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </div>
      <ClipGridSkeleton count={6} />
    </div>
  );

  const { user, stats } = data;
  const isLive = user.isLive && LIVE_ROLES.includes(user.role);
  const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.USER;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <Link href="/"
        className="inline-flex items-center gap-2 text-white/30 hover:text-teal font-display text-xs tracking-widest mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />BACK TO EXPLORE
      </Link>

      {/* Live stream embed — shown above profile when live */}
      {isLive && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="font-display text-sm text-red-400 tracking-widest">LIVE NOW</span>
            {user.viewerCount != null && (
              <span className="text-white/30 font-mono text-xs ml-1">
                {user.viewerCount.toLocaleString()} viewers
              </span>
            )}
            {user.streamGame && (
              <span className="text-white/20 font-mono text-xs">· {user.streamGame}</span>
            )}
          </div>
          {user.streamTitle && (
            <p className="text-white/50 text-sm font-body mb-3 truncate">{user.streamTitle}</p>
          )}
          {/* Twitch embed */}
          <div className="relative w-full rounded overflow-hidden bg-sot-dark" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://player.twitch.tv/?channel=${user.twitchLogin}&parent=${window.location.hostname}&autoplay=false`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              title={`${user.displayName} live stream`}
            />
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className={`sot-card rounded p-5 md:p-7 mb-8 ${isLive ? 'border border-red-500/20' : ''}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.profileImage ? (
              <Image src={user.profileImage} alt={user.displayName} width={80} height={80}
                className={`rounded border-2 ${isLive ? 'border-red-500/50' : 'border-teal/40'}`} />
            ) : (
              <div className="w-20 h-20 rounded border-2 border-teal/20 bg-sot-dark flex items-center justify-center text-3xl">🏴‍☠️</div>
            )}
            {/* Live dot */}
            {isLive && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display text-3xl md:text-4xl font-900 text-white leading-none">
                {user.displayName}
              </h1>
              {/* Role badge */}
              <span className={`px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border ${roleBadge.cls}`}>
                {roleBadge.label}
              </span>
              {/* Live badge */}
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border border-red-500/30 bg-red-500/10 text-red-400">
                  <Radio className="w-3 h-3 animate-pulse" />LIVE
                </span>
              )}
            </div>
            <p className="font-mono text-white/30 text-xs mb-3">@{user.twitchLogin}</p>
            {stats.topTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stats.topTags.map((t: string) => <TagBadge key={t} tag={t} small />)}
              </div>
            )}
          </div>

          {/* Twitch link */}
          <a href={`https://twitch.tv/${user.twitchLogin}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/30 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />Twitch
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Clips',      value: stats.totalClips,                   icon: <Film className="w-4 h-4" />,        cls: 'text-teal' },
          { label: 'Total Views',value: stats.totalViews.toLocaleString(),   icon: <Eye className="w-4 h-4" />,         cls: 'text-white/60' },
          { label: 'Top Tag',    value: stats.topTags[0] ?? '—',            icon: <TrendingUp className="w-4 h-4" />,   cls: 'text-white/60', small: true },
        ].map(s => (
          <div key={s.label} className="stat-card rounded p-4 text-center">
            <div className={`flex justify-center mb-1 ${s.cls}`}>{s.icon}</div>
            <div className={`font-display font-900 ${s.small ? 'text-lg' : 'text-3xl'} ${s.cls}`}>{s.value}</div>
            <div className="text-white/25 text-xs font-display tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Clips controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-700 text-white tracking-wide">Clips</h2>
          <div className="teal-divider w-16" />
          {tag && <span className="text-xs text-white/30 font-mono">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>}
        </div>
        <div className="flex gap-1 bg-sot-card border border-white/10 rounded p-1">
          {[{ key: 'popular', label: 'Most Viewed' }, { key: 'newest', label: 'Newest' }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
                sort === s.key ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      {clips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button onClick={() => setTag('')}
            className={`px-2.5 py-1 rounded-sm text-xs font-display font-700 border tracking-wider transition-all ${
              tag === '' ? 'bg-teal text-sot-bg border-teal' : 'border-white/10 text-white/30 hover:border-teal/40'
            }`}>All</button>
          {TAGS.filter(t => clips.some(c => c.tags.some((ct: any) => ct.tag === t))).map(t => (
            <button key={t} onClick={() => setTag(t === tag ? '' : t)}
              className={`px-2 py-1 rounded-sm text-xs font-mono border transition-all tag-${t} ${
                tag === t ? 'opacity-100' : 'opacity-40 hover:opacity-80'
              }`}>{TAG_LABELS[t]}</button>
          ))}
        </div>
      )}

      {/* Grid */}
      {clips.length === 0 ? (
        <div className="text-center py-20 sot-card rounded">
          <p className="font-display text-3xl text-white/20 mb-2">NO CLIPS YET</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 sot-card rounded">
          <p className="font-display text-2xl text-white/20 mb-3">CALM SEAS</p>
          <button onClick={() => setTag('')} className="btn-teal px-5 py-2 rounded text-sm">Clear Filter</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((clip: any) => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
    </div>
  );
}
