// src/components/home/TrendingSection.tsx
'use client';
import { useRef } from 'react';
import { ClipCard } from '@/components/clips/ClipCard';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export function TrendingSection({ clips }: { clips: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <section>
      <SectionHeader
        icon={<TrendingUp className="w-5 h-5" />}
        label="Trending Now"
        sub="Most watched clips from the last 30 days"
      />
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
    </section>
  );
}