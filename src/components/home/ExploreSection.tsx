// src/components/home/ExploreSection.tsx
'use client';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipCard } from '@/components/clips/ClipCard';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import { TAG_LABELS } from '@/components/ui/TagBadge';
import { Search, RefreshCw, TrendingUp, Clock, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { SectionHeader } from './SectionHeader';

const TAGS = Object.keys(TAG_LABELS);

async function fetchClips(page: number, tag: string, search: string, sort: string) {
  const params = new URLSearchParams({ page: String(page), limit: '12', sort });
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);
  const res = await fetch(`/api/clips?${params}`);
  if (!res.ok) throw new Error('Failed to load clips');
  return res.json();
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const getPages = (): (number | '...')[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', pages];
    if (page >= pages - 3) return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [1, '...', page - 1, page, page + 1, '...', pages];
  };
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all disabled:opacity-20">
        <ChevronLeft className="w-3.5 h-3.5" />Previous
      </button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="px-1 text-white/20 font-mono text-sm select-none">···</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)}
            className={`w-9 h-9 rounded font-display text-sm tracking-wider transition-all ${
              page === p
                ? 'bg-teal text-sot-bg border border-teal font-900'
                : 'border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal'
            }`}>{p}</button>
        )
      )}
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
        className="flex items-center gap-1 px-3 py-2 border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all disabled:opacity-20">
        Next<ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ExploreSection() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');
  const sectionRef = useRef<HTMLElement>(null);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['clips', page, tag, search, sort],
    queryFn: () => fetchClips(page, tag, search, sort),
    retry: 1,
    staleTime: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <section ref={sectionRef}>
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
              className="w-full bg-sot-card border border-white/10 text-white placeholder-white/25 rounded pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:border-teal/50 transition-colors" />
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
              }`}>{TAG_LABELS[t]}</button>
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
            <Pagination page={page} pages={data.pagination.pages} onPage={handlePageChange} />
          )}
        </>
      )}
    </section>
  );
}