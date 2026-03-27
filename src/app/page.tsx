'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipCard } from '@/components/clips/ClipCard';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import { TAG_LABELS } from '@/components/ui/TagBadge';
import { Search, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

const TAGS = Object.keys(TAG_LABELS);

async function fetchClips(page: number, tag: string, search: string, sort: string) {
  const params = new URLSearchParams({ page: String(page), limit: '12', sort });
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);
  const res = await fetch(`/api/clips?${params}`);
  if (!res.ok) throw new Error('Failed to load clips');
  return res.json();
}

export default function HomePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['clips', page, tag, search, sort],
    queryFn: () => fetchClips(page, tag, search, sort),
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,192,0.06),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <p className="font-display text-xs tracking-[0.4em] text-teal mb-4 opacity-80">SEA OF THIEVES COMMUNITY</p>
          <h1 className="font-display text-6xl md:text-9xl font-900 text-white leading-none mb-4">
            PLUNDER<span className="teal-heading">CLIPS</span>
          </h1>
          <div className="teal-divider max-w-xs mx-auto my-6" />
          <p className="font-body text-white/50 text-base md:text-lg max-w-md mx-auto mb-10">
            The finest Sea of Thieves moments from the seven seas — battles, blunders, and brilliance.
          </p>
          <div className='flex gap-5 justify-center'>
          {!user ? (
            <a href="/api/auth/login" className="btn-teal-solid px-8 py-3 rounded text-base inline-block">
              Join the Crew
            </a>
          ) : (
            <Link href="/submit" className="btn-teal px-8 py-3 rounded text-base inline-block">
              Submit a Clip
            </Link>
          )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Filters bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search clips, streamers..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-sot-card border border-white/10 text-white placeholder-white/25 rounded pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:border-teal/50 transition-colors"
              />
            </form>

            {/* Sort toggle */}
            <div className="flex gap-1 bg-sot-card border border-white/10 rounded p-1 self-start sm:self-auto">
              <button
                onClick={() => { setSort('newest'); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
                  sort === 'newest' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <Clock className="w-3 h-3" />Newest
              </button>
              <button
                onClick={() => { setSort('popular'); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
                  sort === 'popular' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <TrendingUp className="w-3 h-3" />Most Viewed
              </button>
            </div>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setTag(''); setPage(1); }}
              className={`px-2.5 py-1 rounded-sm text-xs font-display font-700 border tracking-wider transition-all ${
                tag === '' ? 'bg-teal text-sot-bg border-teal' : 'border-white/10 text-white/30 hover:border-teal/40 hover:text-white/60'
              }`}
            >All</button>
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => { setTag(t === tag ? '' : t); setPage(1); }}
                className={`px-2 py-1 rounded-sm text-xs font-mono border transition-all tag-${t} ${
                  tag === t ? 'opacity-100' : 'opacity-40 hover:opacity-80'
                }`}
              >
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / States */}
        {isLoading || isFetching ? (
          <ClipGridSkeleton />
        ) : isError ? (
          <div className="text-center py-24 sot-card rounded">
            <p className="font-display text-3xl text-white/20 mb-3">TROUBLED WATERS</p>
            <p className="text-white/30 text-sm font-body mb-6">Failed to load clips. The seas are rough.</p>
            <button
              onClick={() => refetch()}
              className="btn-teal px-6 py-2 rounded text-sm inline-flex items-center gap-2"
            >
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
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); setTag(''); setPage(1); }}
                  className="btn-teal px-5 py-2 rounded text-sm"
                >Clear Filters</button>
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
              <div className="flex items-center justify-center gap-4 mt-12">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-teal px-5 py-2 rounded text-sm disabled:opacity-20">← Prev</button>
                <span className="text-white/30 font-mono text-sm">{page} / {data.pagination.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page === data.pagination.pages}
                  className="btn-teal px-5 py-2 rounded text-sm disabled:opacity-20">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
