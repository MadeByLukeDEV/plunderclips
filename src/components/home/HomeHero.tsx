// src/components/home/HomeHero.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function HomeHero({ featuredClip }: { featuredClip: any | null }) {
  const { user } = useAuth();
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative border-b border-white/5 overflow-hidden flex items-center">
      {/* Background thumbnail — desktop only so it doesn't overwhelm mobile */}
      {featuredClip?.thumbnailUrl && (
        <>
          <div className="absolute inset-0 hidden md:block">
            <Image src={featuredClip.thumbnailUrl} alt={featuredClip.title} fill
              className="object-cover opacity-20" priority sizes="100vw" />
          </div>
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-sot-bg via-sot-bg/80 to-transparent" />
          <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-sot-bg via-transparent to-sot-bg/60" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,229,192,0.07),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 w-full py-10 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ── Left — Branding + CTA ─────────────────────────────────────── */}
          <div className="w-full">
            <p className="font-display text-xs tracking-[0.4em] text-teal mb-3 md:mb-4 opacity-80">
              SEA OF THIEVES COMMUNITY
            </p>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-900 text-white leading-none mb-3 md:mb-4">
              PLUNDER<span className="teal-heading">CLIPS</span>
            </h1>
            <div className="teal-divider max-w-xs my-4 md:my-5" />
            <p className="font-body text-white/50 text-sm md:text-lg max-w-sm mb-6 md:mb-8">
              The finest Sea of Thieves moments — battles, blunders, and brilliance.
            </p>
            <div className="flex gap-3 flex-wrap" suppressHydrationWarning>
              {!user ? (
                <a href="/api/auth/login" className="btn-teal-solid px-6 md:px-7 py-2.5 md:py-3 rounded text-sm md:text-base inline-block">
                  Join the Crew
                </a>
              ) : (
                <Link href="/submit" className="btn-teal px-6 md:px-7 py-2.5 md:py-3 rounded text-sm md:text-base inline-block">
                  Submit a Clip
                </Link>
              )}
            </div>
          </div>

          {/* ── Right — Featured clip ──────────────────────────────────────── */}
          {featuredClip && (
            <div className="w-full relative rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,229,192,0.1)]">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {playing ? (
                  <iframe src={featuredClip.embedUrl} className="absolute inset-0 w-full h-full"
                    allowFullScreen title={featuredClip.title} allow="autoplay; fullscreen" />
                ) : (
                  <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
                    {featuredClip.thumbnailUrl ? (
                      <Image src={featuredClip.thumbnailUrl} alt={featuredClip.title} fill
                        className="object-cover will-change-transform group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 767px) calc(100vw - 32px), 50vw"
                        priority
                        fetchPriority="high" />
                    ) : (
                      <div className="absolute inset-0 bg-sot-dark flex items-center justify-center text-5xl">🏴‍☠️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,192,0.6)] group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 md:w-7 md:h-7 text-sot-bg ml-0.5 md:ml-1" />
                      </div>
                    </div>

                    {/* Clip info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <div className="flex gap-1.5 mb-1.5 flex-wrap">
                        {featuredClip.tags?.slice(0, 3).map((t: any) => (
                          <TagBadge key={t.id} tag={t.tag} small />
                        ))}
                      </div>
                      <p className="font-display text-xs md:text-base font-700 text-white line-clamp-1 md:line-clamp-2 leading-snug mb-1">
                        {featuredClip.title}
                      </p>
                      <div className="flex items-center gap-3 text-white/40 text-xs font-mono">
                        <span>{featuredClip.broadcasterName}</span>
                        {featuredClip.viewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{featuredClip.viewCount.toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Weekly highlight badge */}
                    <div className="absolute top-2 left-2 md:top-3 md:left-3">
                      <span className="flex items-center gap-1 md:gap-1.5 bg-teal/90 text-sot-bg text-xs font-display tracking-widest px-2 md:px-2.5 py-0.5 md:py-1 rounded-sm font-700">
                        ⭐ <span className="hidden sm:inline">WEEKLY HIGHLIGHT</span><span className="sm:hidden">HIGHLIGHT</span>
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