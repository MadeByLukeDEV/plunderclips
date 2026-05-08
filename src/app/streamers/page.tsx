// src/app/streamers/page.tsx — SERVER COMPONENT
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Radio } from 'lucide-react';
import { getAllStreamers } from '@/modules/streamers/streamers.service';
import type { StreamerListItemDTO } from '@/modules/streamers/streamers.types';
import { ROLE_META } from '@/modules/auth/auth.roles';
import { RoleBadge } from '@/components/ui/RoleBadge';

export const metadata: Metadata = {
  title: 'Sea of Thieves Streamers | PlunderClips',
  description: 'Browse all Sea of Thieves streamers registered on PlunderClips. Discover their best clips, highlights, and moments from the seven seas.',
  alternates: { canonical: `${process.env.NEXTAUTH_URL || 'https://plunderclips.gg'}/streamers` },
};

export default async function StreamersPage() {
  // Pre-sorted: live first → role → approved clip count
  const streamers = await getAllStreamers();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
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
        {streamers.map((s: StreamerListItemDTO) => (
            <Link key={s.id} href={`/streamers/${s.twitchLogin}`}
              className="sot-card rounded-lg p-4 text-center hover:border-teal/30 transition-colors group">
              <div className="relative w-14 h-14 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-teal/30 transition-colors">
                {s.profileImage ? (
                  <Image src={s.profileImage} alt={`${s.displayName} profile picture`}
                    fill style={{ objectFit: 'cover' }} sizes="56px" />
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
                <RoleBadge role={s.role} size="xs" />
                {s.isLive && (
                  <span className="flex items-center gap-0.5 text-xs text-red-400 font-mono">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    {s.viewerCount != null ? s.viewerCount.toLocaleString('en-US') : 'LIVE'}
                  </span>
                )}
              </div>
              {s.approvedClips > 0 && (
                <p className="text-white/20 text-xs font-mono mt-1.5">
                  {s.approvedClips} clip{s.approvedClips !== 1 ? 's' : ''}
                </p>
              )}
            </Link>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-white/5">
        <p className="text-white/20 text-xs font-body leading-relaxed max-w-2xl">
          PlunderClips is a community platform for Sea of Thieves streamers to share and showcase their
          best clips. All streamers listed here have registered on PlunderClips and consented to
          their clips being featured. Discover {streamers.length} registered Sea of Thieves content creators.
        </p>
      </div>
    </div>
  );
}
