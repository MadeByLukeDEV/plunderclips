// src/app/admin/page.tsx
'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton } from '@/components/ui/Skeletons';
import { TagBadge } from '@/components/ui/TagBadge';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield, CheckCircle, XCircle, Clock, Users, Film,
  AlertTriangle, Radio,
} from 'lucide-react';

function DeclineModal({ clip, onConfirm, onCancel, loading }: {
  clip: any; onConfirm: (reason: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const presets = [
    'Not Sea of Thieves content', 'Poor video quality',
    'Already submitted', 'Inappropriate content', 'Not from a registered streamer',
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative sot-card rounded-lg p-6 w-full max-w-md border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-700 text-white tracking-wide">Decline Clip</h3>
            <p className="text-xs text-white/30 font-mono truncate max-w-[260px]">{clip.title}</p>
          </div>
        </div>
        <p className="font-display text-xs text-white/30 tracking-widest mb-2">QUICK REASON</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {presets.map(p => (
            <button key={p} onClick={() => setReason(p)}
              className={`px-2 py-1 rounded text-xs border font-body transition-all ${
                reason === p ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/10 text-white/30 hover:border-white/20'
              }`}>{p}</button>
          ))}
        </div>
        <p className="font-display text-xs text-white/30 tracking-widest mb-2">CUSTOM REASON (OPTIONAL)</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Add a reason..." rows={2}
          className="w-full bg-sot-dark border border-white/10 text-white placeholder-white/20 rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-red-500/40 resize-none mb-5" />
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-white/10 text-white/50 font-display text-sm rounded tracking-wider disabled:opacity-40">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-display text-sm rounded tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
            <XCircle className="w-3.5 h-3.5" />{loading ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLE_STYLES: Record<string, string> = {
  USER:      'text-white/40 border-white/10',
  MODERATOR: 'text-green-400 border-green-400/30',
  PARTNER:   'text-purple-400 border-purple-400/30',
  SUPPORTER: 'text-blue-400 border-blue-400/30',
  ADMIN:     'text-red-400 border-red-400/30',
};

const PLATFORM_BADGE: Record<string, React.ReactNode> = {
  YOUTUBE: <span className="text-xs font-mono text-red-400 border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 rounded">YT</span>,
  MEDAL:   <span className="text-xs font-mono text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-1.5 py-0.5 rounded">🏅</span>,
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'clips' | 'users'>('clips');
  const [clipTab, setClipTab] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [declineClip, setDeclineClip] = useState<any>(null);

  const canAccess = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then(r => r.json()),
    enabled: !!canAccess,
  });

  const { data: clipsData, isLoading: clipsLoading } = useQuery({
    queryKey: ['admin-clips', clipTab, page],
    queryFn: () => fetch(`/api/admin/clips?status=${clipTab}&page=${page}&limit=15`).then(r => r.json()),
    enabled: !!canAccess && tab === 'clips',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()),
    enabled: !!canAccess && tab === 'users',
  });

  const clipMutation = useMutation({
    mutationFn: ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) =>
      fetch(`/api/admin/clips?id=${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-clips'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`Clip ${data.clip?.status?.toLowerCase()}`);
      setDeclineClip(null);
    },
    onError: () => toast.error('Failed to update clip'),
  });

  const userMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; role?: string; isLive?: boolean; streamTitle?: string }) =>
      fetch(`/api/admin/users?id=${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user'),
  });

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12"><div className="skeleton h-8 w-48 rounded" /></div>;

  if (!canAccess) return (
    <div className="text-center py-24">
      <Shield className="w-12 h-12 text-red-400/40 mx-auto mb-4" />
      <p className="font-display text-4xl text-white/20">FORBIDDEN WATERS</p>
    </div>
  );

  const allowManualLive = usersData?.allowManualLive ?? false;

  return (
    <>
      {declineClip && (
        <DeclineModal
          clip={declineClip}
          onConfirm={(reason) => clipMutation.mutate({ id: declineClip.id, status: 'DECLINED', reviewNotes: reason || undefined })}
          onCancel={() => setDeclineClip(null)}
          loading={clipMutation.isPending}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
          <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">MODERATION</p>
          <h1 className="font-display text-5xl font-900 text-white">Captain's Quarters</h1>
          <div className="teal-divider mt-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {statsLoading ? Array.from({length:5}).map((_,i) => <StatCardSkeleton key={i} />) : stats?.stats && (
            <>
              {[
                { label: 'Total',    value: stats.stats.totalClips,    icon: <Film className="w-4 h-4" />,        cls: 'text-white/60' },
                { label: 'Pending',  value: stats.stats.pendingClips,  icon: <Clock className="w-4 h-4" />,       cls: 'text-yellow-400' },
                { label: 'Approved', value: stats.stats.approvedClips, icon: <CheckCircle className="w-4 h-4" />, cls: 'text-teal' },
                { label: 'Declined', value: stats.stats.declinedClips, icon: <XCircle className="w-4 h-4" />,     cls: 'text-red-400' },
                { label: 'Users',    value: stats.stats.totalUsers,    icon: <Users className="w-4 h-4" />,       cls: 'text-blue-400' },
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

        {/* Main tabs */}
        <div className="flex gap-0 mb-6 border-b border-white/5">
          {[
            { key: 'clips', label: 'Clips', icon: <Film className="w-3.5 h-3.5" /> },
            { key: 'users', label: 'Users', icon: <Users className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
                tab === t.key ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── CLIPS TAB ── */}
        {tab === 'clips' && (
          <>
            <div className="flex gap-0 mb-6 border-b border-white/5">
              {['PENDING', 'APPROVED', 'DECLINED'].map(t => (
                <button key={t} onClick={() => { setClipTab(t); setPage(1); }}
                  className={`px-5 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
                    clipTab === t ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
                  }`}>
                  {t === 'PENDING' ? '⏳ ' : t === 'APPROVED' ? '✓ ' : '✕ '}{t}
                </button>
              ))}
            </div>

            {clipsLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-20 rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {clipsData?.clips?.map((clip: any) => (
                  <div key={clip.id} className="sot-card rounded flex items-start gap-4 p-3 hover:border-teal/20 transition-colors">
                    <div className="w-28 flex-shrink-0 rounded overflow-hidden bg-sot-dark" style={{height:64}}>
                      {clip.thumbnailUrl
                        ? <Image src={clip.thumbnailUrl} alt={clip.title} priority={false} width={500} height={500} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
                          className="font-display text-sm font-600 text-white hover:text-teal transition-colors truncate">
                          {clip.title}
                        </a>
                        {PLATFORM_BADGE[clip.platform]}
                      </div>
                      <p className="text-white/25 text-xs font-mono">{clip.broadcasterName} · by {clip.submittedByName}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {clip.tags.map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                      </div>
                      {!clip.platformVerified && (
                        <p className="text-xs text-yellow-400/70 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />Ownership unverified — manual review required
                        </p>
                      )}
                      {clipTab === 'DECLINED' && clip.reviewNotes && (
                        <p className="text-xs text-red-400/60 mt-1">{clip.reviewNotes}</p>
                      )}
                    </div>
                    {clipTab === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => clipMutation.mutate({ id: clip.id, status: 'APPROVED' })}
                          disabled={clipMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/10 border border-teal/30 text-teal font-display text-xs rounded tracking-wider hover:bg-teal/20 disabled:opacity-40">
                          <CheckCircle className="w-3.5 h-3.5" />Approve
                        </button>
                        <button onClick={() => setDeclineClip(clip)}
                          disabled={clipMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 font-display text-xs rounded tracking-wider hover:bg-red-500/20 disabled:opacity-40">
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
          </>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          usersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-28 rounded" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/20 text-xs font-mono">{usersData?.users?.length} registered streamers</p>
                {allowManualLive && (
                  <span className="text-xs font-display tracking-wider text-yellow-400/60 border border-yellow-400/20 px-2 py-1 rounded">
                    MANUAL LIVE OVERRIDE ENABLED
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {usersData?.users?.map((u: any) => (
                  <div key={u.id} className="sot-card rounded p-4 hover:border-teal/20 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar + live indicator */}
                      <div className="relative flex-shrink-0">
                        {u.profileImage ? (
                          <Image src={u.profileImage} alt={u.displayName} priority={false} width={300} height={300} className="w-11 h-11 rounded border border-white/10" />
                        ) : (
                          <div className="w-11 h-11 rounded border border-white/10 bg-sot-dark flex items-center justify-center">🏴‍☠️</div>
                        )}
                        {u.isLive && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/streamers/${u.twitchLogin}`}
                          className="font-display text-sm font-700 text-white hover:text-teal transition-colors truncate block">
                          {u.displayName}
                        </Link>
                        <p className="text-white/30 text-xs font-mono">@{u.twitchLogin}</p>
                      </div>
                      {/* Clip count */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-display text-lg font-900 text-teal">{u._count.clips}</p>
                        <p className="text-white/20 text-xs font-mono">clips</p>
                      </div>
                    </div>

                    {/* Live status info */}
                    {u.isLive && (
                      <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs">
                        <Radio className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" />
                        <span className="text-red-400 font-display tracking-wider">LIVE</span>
                        {u.viewerCount != null && (
                          <span className="text-white/30 font-mono ml-auto">{u.viewerCount.toLocaleString()} viewers</span>
                        )}
                      </div>
                    )}

                    {/* Role selector */}
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => userMutation.mutate({ id: u.id, role: e.target.value })}
                        className={`flex-1 bg-sot-dark border rounded px-2 py-1.5 font-display text-xs tracking-wider focus:outline-none focus:border-teal/50 transition-colors ${ROLE_STYLES[u.role] || 'border-white/10 text-white/40'}`}
                      >
                        {['USER', 'MODERATOR', 'PARTNER', 'SUPPORTER', 'ADMIN'].map(r => (
                          <option key={r} value={r} className="bg-sot-dark text-white">{r}</option>
                        ))}
                      </select>

                      {/* Manual live toggle — only shown when env var is true */}
                      {allowManualLive && ['PARTNER', 'ADMIN'].includes(u.role) && (
                        <button
                          onClick={() => userMutation.mutate({ id: u.id, isLive: !u.isLive })}
                          disabled={userMutation.isPending}
                          className={`px-2 py-1.5 rounded border font-display text-xs tracking-wider transition-all disabled:opacity-40 ${
                            u.isLive
                              ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-white/10 text-white/20 hover:border-white/20'
                          }`}
                        >
                          <Radio className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
