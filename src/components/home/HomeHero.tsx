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
    <div className="relative border-b border-white/5 overflow-hidden min-h-[480px] md:min-h-[600px] flex items-center">
      {featuredClip?.thumbnailUrl && (
        <>
          <div className="absolute inset-0">
            <Image src={featuredClip.thumbnailUrl} alt={featuredClip.title} fill
              className="object-cover opacity-20" priority sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-sot-bg via-sot-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-sot-bg via-transparent to-sot-bg/60" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,229,192,0.07),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 w-full py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
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

          {featuredClip && (
            <div className="relative rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,229,192,0.1)]">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {playing ? (
                  <iframe src={featuredClip.embedUrl} className="absolute inset-0 w-full h-full"
                    allowFullScreen title={featuredClip.title} allow="autoplay; fullscreen" />
                ) : (
                  <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
                    {featuredClip.thumbnailUrl ? (
                      <Image src={featuredClip.thumbnailUrl} alt={featuredClip.title} fill
                        className="object-cover will-change-transform group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        fetchPriority="high" />
                    ) : (
                      <div className="absolute inset-0 bg-sot-dark flex items-center justify-center text-5xl">🏴‍☠️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-teal/90 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,192,0.6)] group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-sot-bg ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        {featuredClip.tags?.slice(0, 3).map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                      </div>
                      <p className="font-display text-sm md:text-base font-700 text-white line-clamp-2 leading-snug mb-1">
                        {featuredClip.title}
                      </p>
                      <div className="flex items-center gap-3 text-white/40 text-xs font-mono">
                        <span>{featuredClip.broadcasterName}</span>
                        {featuredClip.viewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />{featuredClip.viewCount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
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