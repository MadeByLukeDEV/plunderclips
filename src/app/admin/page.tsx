'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton } from '@/components/ui/Skeletons';
import { TagBadge } from '@/components/ui/TagBadge';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Clock, Users, Film } from 'lucide-react';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('PENDING');
  const [page, setPage] = useState(1);

  const canAccess = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then(r => r.json()),
    enabled: !!canAccess,
  });

  const { data: clipsData, isLoading: clipsLoading } = useQuery({
    queryKey: ['admin-clips', tab, page],
    queryFn: () => fetch(`/api/admin/clips?status=${tab}&page=${page}&limit=15`).then(r => r.json()),
    enabled: !!canAccess,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/admin/clips?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-clips'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`Clip ${data.clip?.status?.toLowerCase()}`);
    },
    onError: () => toast.error('Failed to update clip'),
  });

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12"><div className="skeleton h-8 w-48 rounded" /></div>;

  if (!canAccess) return (
    <div className="text-center py-24">
      <Shield className="w-12 h-12 text-red-400/40 mx-auto mb-4" />
      <p className="font-display text-4xl text-white/20">FORBIDDEN WATERS</p>
    </div>
  );

  const TABS = ['PENDING', 'APPROVED', 'DECLINED'];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">MODERATION</p>
        <h1 className="font-display text-5xl font-900 text-white">Captain's Quarters</h1>
        <div className="teal-divider mt-3" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {statsLoading ? Array.from({length:5}).map((_,i) => <StatCardSkeleton key={i} />) : stats?.stats && (
          <>
            {[
              { label: 'Total',    value: stats.stats.totalClips,    icon: <Film className="w-4 h-4" />,         cls: 'text-white/60' },
              { label: 'Pending',  value: stats.stats.pendingClips,  icon: <Clock className="w-4 h-4" />,        cls: 'text-yellow-400' },
              { label: 'Approved', value: stats.stats.approvedClips, icon: <CheckCircle className="w-4 h-4" />,  cls: 'text-teal' },
              { label: 'Declined', value: stats.stats.declinedClips, icon: <XCircle className="w-4 h-4" />,      cls: 'text-red-400' },
              { label: 'Users',    value: stats.stats.totalUsers,    icon: <Users className="w-4 h-4" />,        cls: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="stat-card rounded p-4 text-center">
                <div className={`flex justify-center mb-1 ${s.cls}`}>{s.icon}</div>
                <div className={`font-display text-3xl font-900 ${s.cls}`}>{s.value}</div>
                <div className="text-white/25 text-xs font-display tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-white/5">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
              tab === t ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
            }`}>
            {t === 'PENDING' ? '⏳ ' : t === 'APPROVED' ? '✓ ' : '✕ '}{t}
          </button>
        ))}
      </div>

      {/* Clips */}
      {clipsLoading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-20 rounded" />)}</div>
      ) : (
        <div className="space-y-2">
          {clipsData?.clips?.map((clip: any) => (
            <div key={clip.id} className="sot-card rounded flex items-center gap-4 p-3 hover:border-teal/20 transition-colors">
              <div className="w-28 flex-shrink-0 rounded overflow-hidden bg-sot-dark" style={{height:64}}>
                {clip.thumbnailUrl
                  ? <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
                  className="font-display text-sm font-600 text-white hover:text-teal transition-colors truncate block">
                  {clip.title}
                </a>
                <p className="text-white/25 text-xs font-mono mt-0.5">
                  {clip.broadcasterName} · by {clip.submittedByName}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {clip.tags.map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                </div>
              </div>
              {tab === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => mutation.mutate({ id: clip.id, status: 'APPROVED' })}
                    disabled={mutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/10 border border-teal/30 text-teal font-display text-xs rounded tracking-wider hover:bg-teal/20 transition-all disabled:opacity-40">
                    <CheckCircle className="w-3.5 h-3.5" />Approve
                  </button>
                  <button onClick={() => mutation.mutate({ id: clip.id, status: 'DECLINED' })}
                    disabled={mutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 font-display text-xs rounded tracking-wider hover:bg-red-500/20 transition-all disabled:opacity-40">
                    <XCircle className="w-3.5 h-3.5" />Decline
                  </button>
                </div>
              )}
            </div>
          ))}
          {clipsData?.clips?.length === 0 && (
            <div className="text-center py-16 text-white/20 font-display text-2xl">NO CLIPS HERE</div>
          )}
        </div>
      )}

      {clipsData?.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            className="btn-teal px-4 py-2 rounded text-sm disabled:opacity-20">← Prev</button>
          <span className="text-white/30 font-mono text-sm">{page} / {clipsData.pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page===clipsData.pagination.pages}
            className="btn-teal px-4 py-2 rounded text-sm disabled:opacity-20">Next →</button>
        </div>
      )}
    </div>
  );
}