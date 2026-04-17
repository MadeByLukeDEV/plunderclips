// src/app/streamers/page.tsx — SERVER COMPONENT
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Radio } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sea of Thieves Streamers | PlunderClips',
  description: 'Browse all Sea of Thieves streamers registered on PlunderClips. Discover their best clips, highlights, and moments from the seven seas.',
  alternates: { canonical: `${process.env.NEXTAUTH_URL || 'https://plunderclips.gg'}/streamers` },
};

const ROLE_ORDER: Record<string, number> = { ADMIN: 0, PARTNER: 1, MODERATOR: 2, SUPPORTER: 3, USER: 4 };
const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN:     { label: 'Captain',    cls: 'text-red-400 border-red-400/30' },
  PARTNER:   { label: 'Partner',    cls: 'text-purple-400 border-purple-400/30' },
  MODERATOR: { label: 'First Mate', cls: 'text-green-400 border-green-400/30' },
  SUPPORTER: { label: 'Bilge Rat',  cls: 'text-blue-400 border-blue-400/30' },
  USER:      { label: 'Crew',       cls: 'text-white/30 border-white/10' },
};

export default async function StreamersPage() {
  const streamers = await prisma.user.findMany({
    select: {
      id: true, twitchLogin: true, displayName: true,
      profileImage: true, role: true, isLive: true, viewerCount: true,
      _count: { select: { clips: true } },
    },
  });

  // Sort: live first → role → clip count
  streamers.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    const roleA = ROLE_ORDER[a.role] ?? 99;
    const roleB = ROLE_ORDER[b.role] ?? 99;
    if (roleA !== roleB) return roleA - roleB;
    return b._count.clips - a._count.clips;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">COMMUNITY</p>
        <h1 className="font-display text-5xl font-900 text-white">Sea of Thieves Streamers</h1>
        <div className="teal-divider mt-3 mb-4" />
        <p className="text-white/40 text-sm font-body max-w-lg">
          Browse all Sea of Thieves streamers registered on PlunderClips — Partners, crew members
          and everyone sharing their finest SoT moments.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {streamers.map(s => {
          const badge = ROLE_BADGE[s.role] || ROLE_BADGE.USER;
          return (
            <Link key={s.id} href={`/streamers/${s.twitchLogin}`}
              className="sot-card rounded-lg p-4 text-center hover:border-teal/30 transition-colors group">
              <div className="relative w-14 h-14 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-teal/30 transition-colors">
                {s.profileImage ? (
                  <Image src={s.profileImage} alt={`${s.displayName} profile picture`}
                    fill style={{ objectFit: 'cover' }} sizes="56px" priority/>
                ) : (
                  <div className="w-full h-full bg-sot-dark flex items-center justify-center text-xl">🏴‍☠️</div>
                )}
                {s.isLive && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-sot-bg block animate-pulse" />
                )}
              </div>
              <p className="font-display text-sm font-700 text-white group-hover:text-teal transition-colors truncate mb-0.5">
                {s.displayName}
              </p>
              <p className="text-white/25 text-xs font-mono truncate mb-2">@{s.twitchLogin}</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className={`text-xs font-display tracking-wider border px-1.5 py-0.5 rounded-sm ${badge.cls}`}>
                  {badge.label}
                </span>
                {s.isLive && (
                  <span className="flex items-center gap-0.5 text-xs text-red-400 font-mono">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    {s.viewerCount != null ? s.viewerCount.toLocaleString() : 'LIVE'}
                  </span>
                )}
              </div>
              {s._count.clips > 0 && (
                <p className="text-white/20 text-xs font-mono mt-1.5">
                  {s._count.clips} clip{s._count.clips !== 1 ? 's' : ''}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* SEO footer text */}
      <div className="mt-12 pt-8 border-t border-white/5">
        <p className="text-white/20 text-xs font-body leading-relaxed max-w-2xl">
          PlunderClips is a community platform for Sea of Thieves streamers to share and showcase their
          best Twitch clips. All streamers listed here have registered on PlunderClips and consented to
          their clips being featured. Discover {streamers.length} registered Sea of Thieves content creators.
        </p>
      </div>
    </div>
  );
}