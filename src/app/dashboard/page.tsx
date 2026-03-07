'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import { TagBadge } from '@/components/ui/TagBadge';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Swords } from 'lucide-react';

const STATUS = {
  APPROVED: { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'text-teal border-teal/30 bg-teal/10' },
  PENDING:  { icon: <Clock className="w-3.5 h-3.5" />,        cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  DECLINED: { icon: <XCircle className="w-3.5 h-3.5" />,      cls: 'text-red-400 border-red-400/30 bg-red-400/10' },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-clips'],
    queryFn: () => fetch('/api/clips/mine').then(r => r.json()),
    enabled: !!user,
  });

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-12"><ClipGridSkeleton count={4} /></div>;

  if (!user) return (
    <div className="text-center py-24">
      <p className="font-display text-4xl text-white/20 mb-6">NOT LOGGED IN</p>
      <a href="/api/auth/login" className="btn-teal-solid px-6 py-3 rounded inline-block">Sign in with Twitch</a>
    </div>
  );

  const clips = data?.clips || [];
  const counts = {
    APPROVED: clips.filter((c: any) => c.status === 'APPROVED').length,
    PENDING:  clips.filter((c: any) => c.status === 'PENDING').length,
    DECLINED: clips.filter((c: any) => c.status === 'DECLINED').length,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Profile */}
      <div className="sot-card rounded p-6 flex items-center gap-5 mb-8">
        {user.profileImage && (
          <Image src={user.profileImage} alt={user.displayName} width={64} height={64}
            className="rounded border-2 border-teal/40 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl font-700 text-white">{user.displayName}</h1>
          <p className="text-white/30 font-mono text-xs mt-0.5">@{user.twitchLogin}</p>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border ${
            user.role === 'ADMIN' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
            user.role === 'MODERATOR' ? 'text-teal border-teal/30 bg-teal/10' :
            'text-white/40 border-white/10'
          }`}>
            {user.role === 'ADMIN' ? 'Captain' : user.role === 'MODERATOR' ? 'First Mate' : 'Crew Member'}
          </span>
        </div>
        <Link href="/submit" className="btn-teal px-4 py-2 rounded text-sm flex items-center gap-2 flex-shrink-0">
          <Swords className="w-4 h-4" />Submit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="stat-card rounded p-4 text-center">
            <div className={`font-display text-4xl font-900 ${
              status === 'APPROVED' ? 'text-teal' : status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
            }`}>{count}</div>
            <div className="text-white/30 text-xs font-display tracking-widest mt-1">{status}</div>
          </div>
        ))}
      </div>

      {/* Clips */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-display text-xl font-700 text-white tracking-wide">Your Clips</h2>
        <div className="flex-1 teal-divider" />
      </div>

      {isLoading ? <ClipGridSkeleton count={4} /> : clips.length === 0 ? (
        <div className="text-center py-16 sot-card rounded">
          <p className="font-display text-3xl text-white/20 mb-4">NO CLIPS YET</p>
          <Link href="/submit" className="btn-teal px-5 py-2.5 rounded text-sm inline-block">Submit Your First Clip</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clips.map((clip: any) => {
            const s = STATUS[clip.status as keyof typeof STATUS];
            return (
              <div key={clip.id} className="sot-card rounded flex items-center gap-4 p-3 hover:border-teal/20 transition-colors">
                <div className="w-24 h-14 rounded overflow-hidden flex-shrink-0 bg-sot-dark">
                  {clip.thumbnailUrl
                    ? <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-600 text-white truncate">{clip.title}</p>
                  <p className="text-white/30 text-xs font-mono mt-0.5">{clip.broadcasterName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clip.tags.slice(0, 3).map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-display tracking-wider border flex-shrink-0 ${s.cls}`}>
                  {s.icon}{clip.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}