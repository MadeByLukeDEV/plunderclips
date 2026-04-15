// src/components/streamers/StreamerClipFilter.tsx
// Client component — handles sort/filter for clips beyond the initial 4
'use client';
import { useState } from 'react';
import { ClipCard } from '@/components/clips/ClipCard';
import { TAG_LABELS } from '@/components/ui/TagBadge';
import { TrendingUp, Clock } from 'lucide-react';

const TAGS = Object.keys(TAG_LABELS);

interface Props {
  clips: any[];
  displayName: string;
  shownIds: Set<string>; // IDs already rendered server-side — avoid duplicates
}

export function StreamerClipFilter({ clips, displayName, shownIds }: Props) {
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<'popular' | 'newest'>('popular');
  const [showAll, setShowAll] = useState(false);

  // Exclude already-rendered top clips unless a filter is active
  const pool = (tag || showAll) ? clips : clips.filter(c => !shownIds.has(c.id));

  const filtered = pool
    .filter(c => !tag || c.tags.some((t: any) => t.tag === tag))
    .sort((a, b) =>
      sort === 'popular'
        ? b.viewCount - a.viewCount
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Only show tags that exist on this streamer's clips
  const availableTags = TAGS.filter(t => clips.some(c => c.tags.some((ct: any) => ct.tag === t)));

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        {/* Tag filters */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setTag('')}
            className={`px-2.5 py-1 rounded-sm text-xs font-display font-700 border tracking-wider transition-all ${
              tag === '' ? 'bg-teal text-sot-bg border-teal' : 'border-white/10 text-white/30 hover:border-teal/40 hover:text-white/60'
            }`}>All</button>
          {availableTags.map(t => (
            <button key={t} onClick={() => setTag(t === tag ? '' : t)}
              className={`px-2 py-1 rounded-sm text-xs font-mono border transition-all tag-${t} ${
                tag === t ? 'opacity-100' : 'opacity-40 hover:opacity-80'
              }`}>
              {TAG_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 bg-sot-card border border-white/10 rounded p-1 flex-shrink-0">
          <button onClick={() => setSort('popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
              sort === 'popular' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
            }`}>
            <TrendingUp className="w-3 h-3" />Most Viewed
          </button>
          <button onClick={() => setSort('newest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider transition-all ${
              sort === 'newest' ? 'bg-teal/20 text-teal border border-teal/30' : 'text-white/30 hover:text-white/60'
            }`}>
            <Clock className="w-3 h-3" />Newest
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 sot-card rounded">
          <p className="font-display text-xl text-white/20 mb-3">CALM SEAS</p>
          <button onClick={() => setTag('')} className="btn-teal px-5 py-2 rounded text-sm">
            Clear Filter
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(clip => <ClipCard key={clip.id} clip={clip} />)}
          </div>
          {!showAll && !tag && clips.length > shownIds.size + filtered.length && (
            <div className="text-center mt-6">
              <button onClick={() => setShowAll(true)}
                className="btn-teal px-6 py-2.5 rounded text-sm">
                Show all {clips.length} clips from {displayName}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}