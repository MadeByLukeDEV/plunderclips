// src/components/home/TrendingSection.tsx
'use client';
import { useRef } from 'react';
import { ClipCard } from '@/components/clips/ClipCard';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export function TrendingSection({ clips }: { clips: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[data-card]')?.clientWidth ?? 300;
    el.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  };

  return (
    <section>
      <SectionHeader
        icon={<TrendingUp className="w-4 h-4" />}
        label="Trending Now"
        sub="Most watched clips from the last 30 days"
      />

      <div className="relative group/scroll">
        {/* Scroll arrows — hidden until hover on desktop */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-sot-card border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal items-center justify-center transition-all opacity-0 group-hover/scroll:opacity-100 shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-sot-card border border-white/10 text-white/40 hover:border-teal/40 hover:text-teal items-center justify-center transition-all opacity-0 group-hover/scroll:opacity-100 shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-sot-bg to-transparent z-[1] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-sot-bg to-transparent z-[1] pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-[clamp(0.75rem,2vw,1rem)] overflow-x-auto scrollbar-hide pb-2 px-1"
        >
          {clips.map(clip => (
            <div
              key={clip.id}
              data-card
              className="flex-shrink-0 w-[clamp(240px,30vw,300px)]"
            >
              <ClipCard clip={clip} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
