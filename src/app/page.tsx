// src/app/page.tsx  ← SERVER COMPONENT (no 'use client')
import { Suspense } from 'react';
import { HomeHero } from '@/components/home/HomeHero';
import { LiveSection } from '@/components/home/LiveSection';
import { TrendingSection } from '@/components/home/TrendingSection';
import { RisingCreatorsSection } from '@/components/home/RisingCreatorsSection';
import { TrendingSkeleton, RisingCreatorsSkeleton } from '@/components/home/HomeSkeleton';
import dynamic from 'next/dynamic';

// Lazy load explore section — it's always below the fold
// Reduces initial JS bundle significantly
const ExploreSection = dynamic(
  () => import('@/components/home/ExploreSection').then(m => ({ default: m.ExploreSection })),
  { ssr: true, loading: () => <div className="skeleton h-96 rounded" /> }
);

// Fetch on the server — runs at request time, result cached by Next.js
async function getFeaturedClip() {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/clips/featured`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.clip ?? null;
  } catch { return null; }
}

async function getTrendingClips() {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/clips/trending`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.clips ?? [];
  } catch { return []; }
}

async function getRisingCreators() {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/creators/rising`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return { creators: [], cachedAt: new Date().toISOString() };
    return await res.json();
  } catch { return { creators: [], cachedAt: new Date().toISOString() }; }
}

export default async function HomePage() {
  // All three fetched in parallel on the server — zero client waterfalls
  const [featuredClip, trendingClips, risingData] = await Promise.all([
    getFeaturedClip(),
    getTrendingClips(),
    getRisingCreators(),
  ]);

  return (
    <div>
      {/* Hero — server rendered with featured clip data already available */}
      <HomeHero featuredClip={featuredClip} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-14 py-10">

        {/* Live — client only (needs real-time polling) */}
        <Suspense fallback={null}>
          <LiveSection />
        </Suspense>

        {/* Trending — server data, instant render */}
        {trendingClips.length > 0 && (
          <TrendingSection clips={trendingClips} />
        )}

        {/* Rising Creators — server data, instant render */}
        {risingData.creators.length > 0 && (
          <RisingCreatorsSection
            creators={risingData.creators}
            cachedAt={risingData.cachedAt}
          />
        )}

        {/* Explore grid — client (interactive: search, filter, paginate) */}
        <Suspense fallback={<div className="skeleton h-96 rounded" />}>
          <ExploreSection />
        </Suspense>

      </div>
    </div>
  );
}