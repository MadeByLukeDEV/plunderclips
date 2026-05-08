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
    <div className="relative border-b border-white/5 overflow-hidden">
      {/* Background — blurred thumbnail on desktop */}
      {featuredClip?.thumbnailUrl && (
        <>
          <div className="absolute inset-0 hidden md:block">
            <Image
              src={featuredClip.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-15 scale-105"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-sot-bg via-sot-bg/85 to-sot-bg/40" />
          <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-sot-bg via-transparent to-sot-bg/50" />
        </>
      )}

      {/* Teal radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_50%,rgba(0,229,192,0.06),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-fluid py-[clamp(2.5rem,7vw,5rem)]">
        <div className="grid lg:grid-cols-2 gap-[clamp(2rem,5vw,4rem)] items-center">

          {/* ── Left — Branding + CTA ─────────────────────────────────────── */}
          <div className="w-full">
            <p className="font-display text-[clamp(0.65rem,1.5vw,0.75rem)] tracking-[0.4em] text-teal mb-3 opacity-80">
              SEA OF THIEVES COMMUNITY
            </p>

            <h1 className="text-hero font-900 text-white leading-none mb-[clamp(0.75rem,2vw,1.25rem)]">
              PLUNDER<span className="teal-heading">CLIPS</span>
            </h1>

            <div className="teal-divider max-w-[200px] my-[clamp(0.75rem,2vw,1.25rem)]" />

            <p className="font-body text-white/45 text-[clamp(0.875rem,2vw,1.05rem)] max-w-sm mb-[clamp(1.5rem,4vw,2.5rem)] leading-relaxed">
              The finest Sea of Thieves moments — battles, blunders, and brilliance from the seven seas.
            </p>

            <div className="flex gap-3 flex-wrap items-center" suppressHydrationWarning>
              {!user ? (
                <a
                  href="/api/auth/login"
                  className="btn-teal-solid px-[clamp(1.25rem,3vw,1.75rem)] py-[clamp(0.6rem,1.5vw,0.85rem)] rounded text-[clamp(0.8rem,1.5vw,0.9rem)]"
                >
                  Join the Crew
                </a>
              ) : (
                <Link
                  href="/submit"
                  className="btn-teal px-[clamp(1.25rem,3vw,1.75rem)] py-[clamp(0.6rem,1.5vw,0.85rem)] rounded text-[clamp(0.8rem,1.5vw,0.9rem)]"
                >
                  Submit a Clip
                </Link>
              )}
              <Link
                href="/streamers"
                className="font-display text-[clamp(0.75rem,1.5vw,0.8rem)] tracking-wider text-white/30 hover:text-teal transition-colors"
              >
                Browse Streamers →
              </Link>
            </div>
          </div>

          {/* ── Right — Featured clip ──────────────────────────────────────── */}
          {featuredClip && (
            <div className="w-full">
              <div className="relative rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,229,192,0.08)] border border-white/5">
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  {playing ? (
                    <iframe
                      src={featuredClip.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      title={featuredClip.title}
                      allow="autoplay; fullscreen"
                    />
                  ) : (
                    <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
                      {featuredClip.thumbnailUrl ? (
                        <Image
                          src={featuredClip.thumbnailUrl}
                          alt={featuredClip.title}
                          fill
                          className="object-cover will-change-transform group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 1023px) calc(100vw - 2rem), 50vw"
                          priority
                          fetchPriority="high"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-sot-dark flex items-center justify-center text-5xl">🏴‍☠️</div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[clamp(2.5rem,6vw,4rem)] h-[clamp(2.5rem,6vw,4rem)] rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,192,0.55)] group-hover:scale-110 group-hover:bg-teal transition-all duration-200">
                          <Play className="w-[clamp(1rem,2.5vw,1.6rem)] h-[clamp(1rem,2.5vw,1.6rem)] text-sot-bg ml-0.5" />
                        </div>
                      </div>

                      {/* Clip info */}
                      <div className="absolute bottom-0 left-0 right-0 p-[clamp(0.75rem,2vw,1rem)]">
                        <div className="flex gap-1.5 mb-1.5 flex-wrap">
                          {featuredClip.tags?.slice(0, 3).map((t: any) => (
                            <TagBadge key={t.tag} tag={t.tag} small />
                          ))}
                        </div>
                        <p className="font-display text-[clamp(0.8rem,2vw,1rem)] font-700 text-white line-clamp-1 leading-snug mb-1">
                          {featuredClip.title}
                        </p>
                        <div className="flex items-center gap-3 text-white/40 text-xs font-mono">
                          <span>{featuredClip.broadcasterName}</span>
                          {featuredClip.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {featuredClip.viewCount.toLocaleString('en-US')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Weekly highlight badge */}
                      <div className="absolute top-[clamp(0.5rem,1.5vw,0.75rem)] left-[clamp(0.5rem,1.5vw,0.75rem)]">
                        <span className="flex items-center gap-1 bg-teal/90 text-sot-bg text-[clamp(0.6rem,1.2vw,0.7rem)] font-display tracking-widest px-2 py-0.5 rounded-sm font-700">
                          ⭐ WEEKLY HIGHLIGHT
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
