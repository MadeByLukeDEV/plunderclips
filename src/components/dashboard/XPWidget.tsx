'use client';
import { useQuery } from '@tanstack/react-query';
import type { UserProgressDTO } from '@/modules/progress/progress.types';
import { MAX_LEVEL } from '@/modules/progress/progress.constants';

export function XPWidget() {
  const { data, isLoading } = useQuery<{ progress: UserProgressDTO }>({
    queryKey: ['user-progress'],
    queryFn:  () => fetch('/api/progress').then(r => r.json()),
    staleTime: 30_000,
  });

  const p = data?.progress;

  if (isLoading || !p) {
    return (
      <div className="mt-3 space-y-1.5">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs tracking-widest text-teal">
            LVL {p.level}
          </span>
          <span className="font-display text-xs text-white/50 tracking-wide">
            {p.rank}
          </span>
        </div>
        <span className="font-mono text-[10px] text-white/25">
          {p.isMaxLevel ? 'MAX LEVEL' : `${p.xp.toLocaleString()} XP`}
        </span>
      </div>

      {/* XP bar */}
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal/70 to-teal transition-all duration-700"
          style={{ width: `${p.percent}%` }}
        />
      </div>

      {!p.isMaxLevel && (
        <p className="font-mono text-[10px] text-white/20 mt-1">
          {p.currentXP.toLocaleString()} / {p.neededXP.toLocaleString()} XP to level {p.level + 1}
        </p>
      )}
    </div>
  );
}
