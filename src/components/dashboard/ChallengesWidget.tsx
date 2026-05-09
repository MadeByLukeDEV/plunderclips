'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Swords, ThumbsUp, Eye, Loader2 } from 'lucide-react';
import type { WeeklyChallengesDTO, ChallengeDTO } from '@/modules/challenges/challenges.types';
import type { ChallengeType } from '@prisma/client';

const TYPE_ICON: Record<ChallengeType, React.ReactNode> = {
  SUBMIT_CLIPS:  <Swords   className="w-3.5 h-3.5" />,
  GET_APPROVED:  <ThumbsUp className="w-3.5 h-3.5" />,
  REACH_VIEWS:   <Eye      className="w-3.5 h-3.5" />,
  UPLOAD_STREAK: <Swords   className="w-3.5 h-3.5" />,
  FIRST_CLIP:    <Swords   className="w-3.5 h-3.5" />,
};

function ChallengeCard({ c }: { c: ChallengeDTO }) {
  const done     = !!c.completedAt;
  const pct      = Math.min(100, Math.round((c.userProgress / c.target) * 100));

  return (
    <div className={`sot-card rounded-lg p-3.5 border transition-colors ${
      done ? 'border-teal/25 bg-teal/5' : 'border-white/5'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex-shrink-0 ${done ? 'text-teal' : 'text-white/30'}`}>
            {done ? <CheckCircle className="w-3.5 h-3.5" /> : TYPE_ICON[c.type]}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xs font-700 text-white/80 tracking-wide leading-tight">
              {c.title}
            </p>
            <p className="font-body text-[11px] text-white/35 leading-tight mt-0.5">
              {c.description}
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 font-display text-[10px] tracking-widest px-2 py-0.5 rounded-sm border ${
          done
            ? 'text-teal border-teal/30 bg-teal/10'
            : 'text-yellow-400/70 border-yellow-400/20 bg-yellow-400/5'
        }`}>
          +{c.xpReward} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              done ? 'bg-teal' : 'bg-white/25'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-[10px] text-white/20">
            {done ? 'COMPLETE' : `${c.userProgress} / ${c.target}`}
          </span>
          <span className="font-mono text-[10px] text-white/20">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function daysLeft(weekEndIso: string): number {
  return Math.max(0, Math.ceil((new Date(weekEndIso).getTime() - Date.now()) / 86_400_000));
}

export function ChallengesWidget() {
  const { data, isLoading } = useQuery<WeeklyChallengesDTO>({
    queryKey: ['weekly-challenges'],
    queryFn:  () => fetch('/api/challenges').then(r => r.json()),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] text-teal mb-0.5">THIS WEEK</p>
          <h2 className="font-display text-lg tracking-wider text-white/80">CHALLENGES</h2>
        </div>
        {data && (
          <span className="font-mono text-[10px] text-white/20">
            {daysLeft(data.weekEnd)}d left
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="sot-card rounded-lg p-3.5 space-y-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-2 w-full rounded" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : !data?.challenges?.length ? (
        <div className="sot-card rounded-lg p-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/20 mx-auto mb-2" />
          <p className="font-display text-xs text-white/25 tracking-wider">Loading challenges...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.challenges.map(c => <ChallengeCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
