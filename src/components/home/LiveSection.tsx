// src/components/home/LiveSection.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function LiveSection() {
  const { data } = useQuery({
    queryKey: ['live-streamers'],
    queryFn: () => fetch('/api/live').then(r => r.json()),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const liveUsers = data?.liveUsers || [];
  if (liveUsers.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Radio className="w-4 h-4 text-red-400 animate-pulse" />
        <span className="font-display text-sm text-red-400 tracking-widest">LIVE NOW</span>
        <div className="flex-1 h-px bg-red-500/10" />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {liveUsers.map((u: any) => (
          <Link key={u.id} href={`/streamers/${u.twitchLogin}`}
            className="flex-shrink-0 sot-card rounded p-3 flex items-center gap-3 hover:border-red-500/30 transition-colors min-w-[200px] border border-red-500/10">
            <div className="relative flex-shrink-0">
              {u.profileImage ? (
                <Image src={u.profileImage} alt={u.displayName} sizes="(max-width: 639px) calc(100vw - 32px),
       (max-width: 1023px) calc(50vw - 24px),
       (max-width: 1279px) calc(33vw - 24px),
       calc(25vw - 24px)" width={40} height={40}
                  className="w-10 h-10 rounded border border-red-500/30" />
              ) : (
                <div className="w-10 h-10 rounded bg-sot-dark border border-red-500/30 flex items-center justify-center">🏴‍☠️</div>
              )}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-700 text-white truncate">{u.displayName}</p>
              {u.viewerCount != null && (
                <p className="text-white/30 text-xs font-mono">{u.viewerCount.toLocaleString()} viewers</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}