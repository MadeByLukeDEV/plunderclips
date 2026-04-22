'use client';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipCard } from '@/components/clips/ClipCard';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import { TAG_LABELS, TagBadge } from '@/components/ui/TagBadge';
import {
  Search, RefreshCw, TrendingUp, Clock, Radio,
  ChevronLeft, ChevronRight, Eye, Users, Shuffle, Play, Flame,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect } from 'react';

const TAGS = Object.keys(TAG_LABELS);

async function fetchClips(page: number, tag: string, search: string, sort: string) {
  const params = new URLSearchParams({ page: String(page), limit: '12', sort });
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);
  const res = await fetch(`/api/clips?${params}`);
  if (!res.ok) throw new Error('Failed to load clips');
  return res.json();
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, onPage }: {
  page: number; pages: number; onPage: (p: number) => void;
}) {
  const getPages = (): (number | '...')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', pages];
    if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, '...', page - 1, page, page + 1, '...', pages];
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all disabled:opacity-20"
      >
        <ChevronLeft className="w-3.5 h-3.5" />Previous
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-white/20 font-mono text-sm select-none">···</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)}
            className={`w-9 h-9 rounded font-display text-sm tracking-wider transition-all ${
              page === p
                ? 'bg-teal text-sot-bg border border-teal font-900'
                : 'border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal'
            }`}
          >{p}</button>
        )
      )}

      <button
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="flex items-center gap-1 px-3 py-2 border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all disabled:opacity-20"
      >
        Next<ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="text-teal">{icon}</div>
      <div>
        <h2 className="font-display text-xl md:text-2xl font-900 text-white tracking-wide">{label}</h2>
        {sub && <p className="text-white/30 text-xs font-body mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 teal-divider" />
    </div>
  );
}

// ─── Hero with Featured Clip ──────────────────────────────────────────────────
function HeroSection({ clip, user }: { clip: any | null; user: any }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative border-b border-white/5 overflow-hidden min-h-[480px] md:min-h-[600px] flex items-center">
      {/* Background — featured clip thumbnail */}
      {clip?.thumbnailUrl && (
        <>
          <div className="absolute inset-0">
            <Image src={clip.thumbnailUrl} alt={clip.title} fill
              className="object-cover opacity-20" priority sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-sot-bg via-sot-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-sot-bg via-transparent to-sot-bg/60" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,229,192,0.07),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 w-full py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* Left — branding + CTA */}
          <div>
            <p className="font-display text-xs tracking-[0.4em] text-teal mb-4 opacity-80">SEA OF THIEVES COMMUNITY</p>
            <h1 className="font-display text-5xl md:text-8xl font-900 text-white leading-none mb-4">
              PLUNDER<span className="teal-heading">CLIPS</span>
            </h1>
            <div className="teal-divider max-w-xs my-5" />
            <p className="font-body text-white/50 text-base md:text-lg max-w-sm mb-8">
              The finest Sea of Thieves moments — battles, blunders, and brilliance.
            </p>
            <div className="flex gap-3 flex-wrap">
              {!user ? (
                <a href="/api/auth/login" className="btn-teal-solid px-7 py-3 rounded text-base inline-block">
                  Join the Crew
                </a>
              ) : (
                <Link href="/submit" className="btn-teal px-7 py-3 rounded text-base inline-block">
                  Submit a Clip
                </Link>
              )}
            </div>
          </div>

          {/* Right — featured clip */}
          {clip && (
            <div className="relative rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,229,192,0.1)]">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {playing ? (
                  /* Embed plays inline — no page change */
                  <iframe
                    src={clip.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title={clip.title}
                    allow="autoplay; fullscreen"
                  />
                ) : (
                  /* Thumbnail + play button overlay */
                  <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
                    {clip.thumbnailUrl ? (
                      <Image src={clip.thumbnailUrl} alt={clip.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw" />
                    ) : (
                      <div className="absolute inset-0 bg-sot-dark flex items-center justify-center text-5xl">🏴‍☠️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,192,0.6)] group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-sot-bg ml-1" />
                      </div>
                    </div>

                    {/* Clip info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        {clip.tags?.slice(0, 3).map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                      </div>
                      <p className="font-display text-sm md:text-base font-700 text-white line-clamp-2 leading-snug mb-1">
                        {clip.title}
                      </p>
                      <div className="flex items-center gap-3 text-white/40 text-xs font-mono">
                        <span>{clip.broadcasterName}</span>
                        {clip.viewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{clip.viewCount.toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1.5 bg-teal/90 text-sot-bg text-xs font-display tracking-widest px-2.5 py-1 rounded-sm font-700">
                        ⭐ WEEKLY HIGHLIGHT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trending Row ─────────────────────────────────────────────────────────────
function TrendingRow({ clips }: { clips: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-sot-card border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal flex items-center justify-center transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-sot-card border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal flex items-center justify-center transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
        {clips.map(clip => (
          <div key={clip.id} className="flex-shrink-0 w-72">
            <ClipCard clip={clip} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rising Creators ──────────────────────────────────────────────────────────
function RisingCreators({ creators, cachedAt }: { creators: any[]; cachedAt: string }) {
  if (creators.length === 0) return null;

  const [top, ...rest] = creators;
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  useEffect(() => {
    setMinutesAgo(Math.floor((Date.now() - new Date(cachedAt).getTime()) / 60000));
  }, [cachedAt]);

  const CreatorCard = ({ creator, rank }: { creator: any; rank: number }) => {
    const isTop = rank === 1;
    return (
      <Link href={`/streamers/${creator.twitchLogin}`}
        className={`sot-card rounded-lg overflow-hidden hover:border-teal/20 transition-all group relative ${
          isTop ? 'border border-teal/20 shadow-[0_0_40px_rgba(0,229,192,0.08)]' : ''
        }`}>
        {/* Background thumbnail */}
        {creator.latestThumbnail && (
          <div className="absolute inset-0">
            <Image src={creator.latestThumbnail} alt="" fill className="object-cover opacity-10 group-hover:opacity-15 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-sot-card via-sot-card/90 to-sot-card/60" />
          </div>
        )}

        <div className="relative p-4">
          {/* Rank + badge row */}
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

          {/* Avatar */}
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
              <p className={`font-display font-700 text-white group-hover:text-teal transition-colors truncate ${
                isTop ? 'text-base' : 'text-sm'
              }`}>{creator.displayName}</p>
              <p className="text-white/30 text-xs font-mono truncate">@{creator.twitchLogin}</p>
            </div>
          </div>

          {/* Growth label */}
          {creator.growthLabel && (
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-body">
              <Flame className="w-3 h-3 text-orange-400/60 flex-shrink-0" />
              <span className="truncate">{creator.growthLabel}</span>
            </div>
          )}

          {/* Views this week */}
          {creator.last7Views > 0 && (
            <div className="flex items-center gap-1 text-xs text-white/20 font-mono mt-1">
              <Eye className="w-3 h-3" />{creator.last7Views.toLocaleString('en-US')} views this week
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {/* Top 3 — larger */}
        {creators.slice(0, 3).map((c, i) => (
          <CreatorCard key={c.id} creator={c} rank={i + 1} />
        ))}
      </div>
      {/* 4-6 — smaller row */}
      {creators.slice(3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {creators.slice(3).map((c, i) => (
            <CreatorCard key={c.id} creator={c} rank={i + 4} />
          ))}
        </div>
      )}
      {/* Cache indicator */}
      <p className="text-white/15 text-xs font-mono mt-3 text-right">
        Updated {minutesAgo === null ? '…' : minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`} · refreshes every 6h
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');

  // Ref for scrolling to Explore section on pagination
  const exploreRef = useRef<HTMLElement>(null);

  const { data: liveData } = useQuery({
    queryKey: ['live-streamers'],
    queryFn: () => fetch('/api/live').then(r => r.json()),
    refetchInterval: 60_000,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-clip'],
    queryFn: () => fetch('/api/clips/featured').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending-clips'],
    queryFn: () => fetch('/api/clips/trending').then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: risingData } = useQuery({
    queryKey: ['rising-creators'],
    queryFn: () => fetch('/api/creators/rising').then(r => r.json()),
    staleTime: 6 * 60 * 60 * 1000,
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['clips', page, tag, search, sort],
    queryFn: () => fetchClips(page, tag, search, sort),
    retry: 1,
  });

  const liveUsers = liveData?.liveUsers || [];
  const featuredClip = featuredData?.clip;
  const trendingClips = trendingData?.clips || [];
  const risingCreators = risingData?.creators || [];
  const risingCachedAt = risingData?.cachedAt || new Date().toISOString();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    // Scroll to explore section, not top of page
    setTimeout(() => {
      exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div>
      {/* ── Hero + Weekly Highlight ─────────────────────────────────────────── */}
      <HeroSection clip={featuredClip || null} user={user} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-14 py-10">

        {/* ── Live Now ─────────────────────────────────────────────────────── */}
        {liveUsers.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-display text-sm text-red-400 tracking-widest">LIVE NOW</span>
              <div className="flex-1 h-px bg-red-500/10" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {liveUsers.map((u: any) => (
                <Link key={u.id} href={`/streamers/${u.twitchLogin}`}
                  className="flex-shrink-0 sot-card rounded p-3 flex items-center gap-3 hover:border-red-500/30 transition-colors min-w-[200px] border border-red-500/10">
                  <div className="relative flex-shrink-0">
                    {u.profileImage ? (
                      <Image src={u.profileImage} alt={u.displayName} width={40} height={40}
                        className="w-10 h-10 rounded border border-red-500/30" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-sot-dark border border-red-500/30 flex items-center justify-center">🏴‍☠️</div>
                    )}
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-700 text-white truncate">{u.displayName}</p>
                    {u.viewerCount != null && (
                      <p className="text-white/30 text-xs font-mono">{u.viewerCount.toLocaleString('en-US')} viewers</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Trending Now ──────────────────────────────────────────────────── */}
        {trendingClips.length > 0 && (
          <section>
            <SectionHeader
              icon={<TrendingUp className="w-5 h-5" />}
              label="Trending Now"
              sub="Most watched clips from the last 30 days"
            />
            <TrendingRow clips={trendingClips} />
          </section>
        )}

        {/* ── Rising Creators ───────────────────────────────────────────────── */}
        {risingCreators.length > 0 && (
          <section>
            <SectionHeader
              icon={<Flame className="w-5 h-5" />}
              label="Rising Creators"
              sub="Momentum-based — who's climbing the ranks right now"
            />
            <RisingCreators creators={risingCreators} cachedAt={risingCachedAt} />
          </section>
        )}

        {/* ── Explore ───────────────────────────────────────────────────────── */}
        <section ref={exploreRef}>
          <SectionHeader
            icon={<Shuffle className="w-5 h-5" />}
            label="Explore"
            sub="Search, filter, discover all clips"
          />

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input type="text" placeholder="Search clips, streamers..."
                  value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  className="w-full bg-sot-card border border-white/10 text-white placeholder-white/25 rounded pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:border-teal/50 transition-colors"
                />
              </form>
              <div className="flex gap-1 bg-sot-card border border-white/10 rounded p-1 self-start sm:self-auto">
                <button onClick={() => { setSort('newest'); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
                    sort === 'newest' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
                  }`}>
                  <Clock className="w-3 h-3" />Newest
                </button>
                <button onClick={() => { setSort('popular'); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
                    sort === 'popular' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
                  }`}>
                  <TrendingUp className="w-3 h-3" />Most Viewed
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setTag(''); setPage(1); }}
                className={`px-2.5 py-1 rounded-sm text-xs font-display font-700 border tracking-wider transition-all ${
                  tag === '' ? 'bg-teal text-sot-bg border-teal' : 'border-white/10 text-white/30 hover:border-teal/40 hover:text-white/60'
                }`}>All</button>
              {TAGS.map(t => (
                <button key={t} onClick={() => { setTag(t === tag ? '' : t); setPage(1); }}
                  className={`px-2 py-1 rounded-sm text-xs font-mono border transition-all tag-${t} ${
                    tag === t ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                  }`}>
                  {TAG_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {isLoading || isFetching ? (
            <ClipGridSkeleton />
          ) : isError ? (
            <div className="text-center py-24 sot-card rounded">
              <p className="font-display text-3xl text-white/20 mb-3">TROUBLED WATERS</p>
              <p className="text-white/30 text-sm font-body mb-6">Failed to load clips.</p>
              <button onClick={() => refetch()}
                className="btn-teal px-6 py-2 rounded text-sm inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />Try Again
              </button>
            </div>
          ) : data?.clips?.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-4xl text-white/20 mb-3">CALM SEAS</p>
              <p className="text-white/30 text-sm font-body mb-6">
                {search || tag ? 'No clips match your search.' : 'No clips yet. Be the first to submit one.'}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {(search || tag) && (
                  <button onClick={() => { setSearch(''); setSearchInput(''); setTag(''); setPage(1); }}
                    className="btn-teal px-5 py-2 rounded text-sm">Clear Filters</button>
                )}
                {user && (
                  <Link href="/submit" className="btn-teal-solid px-5 py-2 rounded text-sm inline-block">
                    Submit a Clip
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {data?.clips?.map((clip: any) => <ClipCard key={clip.id} clip={clip} />)}
              </div>
              {data?.pagination?.pages > 1 && (
                <Pagination
                  page={page}
                  pages={data.pagination.pages}
                  onPage={handlePageChange}
                />
              )}
            </>
          )}
        </section>

      </div>
    </div>
  );
}