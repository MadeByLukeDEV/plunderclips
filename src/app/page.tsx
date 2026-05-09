// src/app/page.tsx  ← SERVER COMPONENT (no 'use client')
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HomeHero } from '@/components/home/HomeHero';
import { LiveSection } from '@/components/home/LiveSection';
import { TrendingSection } from '@/components/home/TrendingSection';
import { RisingCreatorsSection } from '@/components/home/RisingCreatorsSection';
import dynamic from 'next/dynamic';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://plunderclips.com';

export const metadata: Metadata = {
  title: {
    absolute: 'PlunderClips — Best Sea of Thieves Clips & Community Highlights',
  },
  description: 'PlunderClips is the #1 community for Sea of Thieves clips. Watch the best Twitch and YouTube moments — PvP battles, kraken encounters, treasure heists, and epic fails. Submit your own Sea of Thieves highlights.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'PlunderClips — Best Sea of Thieves Clips & Community Highlights',
    description: 'Discover the best Sea of Thieves clips from top streamers. Watch PvP battles, kraken fights, treasure heists, and hilarious moments from the SoT community.',
    url: BASE_URL,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlunderClips — Best Sea of Thieves Clips',
    description: 'Discover the best Sea of Thieves clips from top streamers. Watch PvP battles, kraken fights, treasure heists, and hilarious moments.',
  },
};

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

// FAQ structured data for GEO — answers common questions AI engines will surface
const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is PlunderClips?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PlunderClips is a community-driven clip showcase platform for Sea of Thieves. Players and streamers submit their best Twitch, YouTube, and Medal.tv clips, which are reviewed by moderators before going live on the site.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I submit a Sea of Thieves clip to PlunderClips?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign in with your Twitch account, go to the Submit page, browse your recent clips from Twitch or YouTube, select one, add relevant tags, and submit. Your clip will be reviewed by the crew before it goes live.',
      },
    },
    {
      '@type': 'Question',
      name: 'What platforms are supported for clip submission?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PlunderClips supports clips from Twitch (clips.twitch.tv), YouTube (videos and Shorts), and Medal.tv. All clips must be from Sea of Thieves gameplay.',
      },
    },
    {
      '@type': 'Question',
      name: 'What kind of Sea of Thieves clips are featured on PlunderClips?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PlunderClips features all types of Sea of Thieves moments including PvP battles, ship combat, kraken and megalodon encounters, treasure heists, tuck clips, funny moments, epic fails, clutch plays, and sailing highlights.',
      },
    },
  ],
};

const homeWebPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PlunderClips — Best Sea of Thieves Clips',
  url: BASE_URL,
  description: 'Community clip platform for Sea of Thieves. Discover trending clips, live streamers, and rising creators.',
  about: {
    '@type': 'VideoGame',
    name: 'Sea of Thieves',
    genre: 'Action-Adventure',
    gamePlatform: ['Xbox', 'PC', 'PlayStation'],
    developer: { '@type': 'Organization', name: 'Rare' },
    publisher: { '@type': 'Organization', name: 'Xbox Game Studios' },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL }],
  },
};

export default async function HomePage() {
  // All three fetched in parallel on the server — zero client waterfalls
  const [featuredClip, trendingClips, risingData] = await Promise.all([
    getFeaturedClip(),
    getTrendingClips(),
    getRisingCreators(),
  ]);

  return (
    <div>
      {/* Homepage structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeWebPageJsonLd) }} />

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