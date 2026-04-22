// src/app/admin/page.tsx
'use client';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatCardSkeleton } from '@/components/ui/Skeletons';
import { TagBadge } from '@/components/ui/TagBadge';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Shield, CheckCircle, XCircle, Clock, Users, Film,
  AlertTriangle, Radio, Wifi, WifiOff, RefreshCw, Trash2, Search,
} from 'lucide-react';

// ─── Decline Modal ────────────────────────────────────────────────────────────
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
            className="flex-1 py-2.5 border border-white/10 text-white/50 font-display text-sm rounded tracking-wider disabled:opacity-40">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-display text-sm rounded tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
            <XCircle className="w-3.5 h-3.5" />{loading ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Clip Modal ────────────────────────────────────────────────────────
function DeleteClipModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative sot-card rounded-lg p-6 w-full max-w-sm border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-700 text-white tracking-wide">Delete Clip</h3>
            <p className="text-xs text-white/30 mt-0.5">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/50 mb-5">Are you sure you want to permanently delete this clip?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-white/10 text-white/50 font-display text-sm rounded tracking-wider hover:border-white/20 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-display text-sm rounded tracking-wider hover:bg-red-500/30 disabled:opacity-40 flex items-center justify-center gap-2">
            <Trash2 className="w-3.5 h-3.5" />{loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<string, string> = {
  USER:      'text-white/40 border-white/10',
  MODERATOR: 'text-blue-400 border-blue-400/30',
  PARTNER:   'text-purple-400 border-purple-400/30',
  ADMIN:     'text-red-400 border-red-400/30',
};

const PLATFORM_BADGE: Record<string, React.ReactNode> = {
  YOUTUBE: <span className="text-xs font-mono text-red-400 border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 rounded">YT</span>,
  MEDAL:   <span className="text-xs font-mono text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-1.5 py-0.5 rounded">🏅</span>,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'clips' | 'users' | 'eventsub'>('clips');
  const [clipTab, setClipTab] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [declineClip, setDeclineClip] = useState<any>(null);
  const [deleteClipId, setDeleteClipId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [deletingClip, setDeletingClip] = useState(false);

  const canAccess = user && (user.role === 'ADMIN' || user.role === 'MODERATOR');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then(r => r.json()),
    enabled: !!canAccess,
  });

  const { data: clipsData, isLoading: clipsLoading } = useQuery({
    queryKey: ['admin-clips', clipTab, page],
    queryFn: () => fetch(`/api/admin/clips?status=${clipTab}&page=${page}&limit=5`).then(r => r.json()),
    enabled: !!canAccess && tab === 'clips',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()),
    enabled: !!canAccess && tab === 'users',
  });

  const { data: eventsubData, isLoading: eventsubLoading, refetch: refetchEventsub } = useQuery({
    queryKey: ['admin-eventsub'],
    queryFn: () => fetch('/api/admin/eventsub').then(r => r.json()),
    enabled: !!canAccess && tab === 'eventsub',
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
    mutationFn: ({ id, ...data }: { id: string; role?: string; isLive?: boolean }) =>
      fetch(`/api/admin/users?id=${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const resubscribeMutation = useMutation({
    mutationFn: ({ userId, all }: { userId?: string; all?: boolean }) => {
      if (all) return fetch('/api/admin/eventsub', { method: 'DELETE' }).then(r => r.json());
      return fetch('/api/admin/eventsub', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Done');
      refetchEventsub();
    },
    onError: () => toast.error('Failed to resubscribe'),
  });

  const handleDeleteClip = async (clipId: string) => {
    setDeletingClip(true);
    try {
      const res = await fetch(`/api/clips/${clipId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Clip deleted');
      qc.invalidateQueries({ queryKey: ['admin-clips'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch {
      toast.error('Failed to delete clip');
    } finally {
      setDeletingClip(false);
      setDeleteClipId(null);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-12"><div className="skeleton h-8 w-48 rounded" /></div>;

  if (!canAccess) return (
    <div className="text-center py-24">
      <Shield className="w-12 h-12 text-red-400/40 mx-auto mb-4" />
      <p className="font-display text-4xl text-white/20">FORBIDDEN WATERS</p>
    </div>
  );

  const allowManualLive = usersData?.allowManualLive ?? false;

  return (
    <>
      {/* Modals */}
      {declineClip && (
        <DeclineModal
          clip={declineClip}
          onConfirm={(reason) => clipMutation.mutate({ id: declineClip.id, status: 'DECLINED', reviewNotes: reason || undefined })}
          onCancel={() => setDeclineClip(null)}
          loading={clipMutation.isPending}
        />
      )}
      {deleteClipId && (
        <DeleteClipModal
          onConfirm={() => handleDeleteClip(deleteClipId)}
          onCancel={() => setDeleteClipId(null)}
          loading={deletingClip}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">MODERATION</p>
          <h1 className="font-display text-5xl font-900 text-white">Captain's Quarters</h1>
          <div className="teal-divider mt-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {statsLoading
            ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
            : stats?.stats && (
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
            { key: 'clips',    label: 'Clips',    icon: <Film className="w-3.5 h-3.5" /> },
            { key: 'users',    label: 'Users',    icon: <Users className="w-3.5 h-3.5" /> },
            { key: 'eventsub', label: 'EventSub', icon: <Wifi className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-5 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
                tab === t.key ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── CLIPS TAB ────────────────────────────────────────────────────────── */}
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
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {clipsData?.clips?.map((clip: any) => (
                  <div key={clip.id} className="sot-card rounded overflow-hidden hover:border-teal/20 transition-colors">

                    {/* Mobile: full-width thumbnail */}
                    <div className="relative w-full aspect-video md:hidden bg-sot-dark">
                      {clip.thumbnailUrl
                        ? <Image src={clip.thumbnailUrl} alt={clip.title} fill priority={false} className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                      }
                      <div className="absolute top-2 left-2">{PLATFORM_BADGE[clip.platform]}</div>
                      {!clip.platformVerified && (
                        <div className="absolute top-2 right-2">
                          <span className="flex items-center gap-1 text-xs bg-black/70 text-yellow-400 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />Unverified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content row */}
                    <div className="flex items-start gap-3 p-3">
                      {/* Desktop thumbnail */}
                      <div className="hidden md:block w-28 flex-shrink-0 rounded overflow-hidden bg-sot-dark" style={{ height: 64 }}>
                        {clip.thumbnailUrl
                          ? <Image src={clip.thumbnailUrl} alt={clip.title} priority={false} width={500} height={500} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
                            className="font-display text-sm font-600 text-white hover:text-teal transition-colors truncate">
                            {clip.title}
                          </a>
                          <span className="hidden md:inline">{PLATFORM_BADGE[clip.platform]}</span>
                        </div>
                        <p className="text-white/25 text-xs font-mono mb-1">
                          {clip.broadcasterName} · by {clip.submittedByName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {clip.tags.map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
                        </div>
                        {!clip.platformVerified && (
                          <p className="hidden md:flex text-xs text-yellow-400/70 mt-1 items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />Ownership unverified — manual review required
                          </p>
                        )}
                        {clipTab === 'DECLINED' && clip.reviewNotes && (
                          <p className="text-xs text-red-400/60 mt-1">{clip.reviewNotes}</p>
                        )}
                      </div>

                      {/* Desktop action buttons */}
                      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                        {clipTab === 'PENDING' && (
                          <>
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
                          </>
                        )}
                        <button onClick={() => setDeleteClipId(clip.id)}
                          className="p-1.5 border border-white/10 text-white/20 hover:border-red-500/40 hover:text-red-400 rounded transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile action buttons */}
                    <div className="flex gap-2 p-3 pt-0 md:hidden">
                      {clipTab === 'PENDING' && (
                        <>
                          <button onClick={() => clipMutation.mutate({ id: clip.id, status: 'APPROVED' })}
                            disabled={clipMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal/10 border border-teal/30 text-teal font-display text-xs rounded tracking-wider hover:bg-teal/20 disabled:opacity-40">
                            <CheckCircle className="w-3.5 h-3.5" />Approve
                          </button>
                          <button onClick={() => setDeclineClip(clip)}
                            disabled={clipMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-display text-xs rounded tracking-wider hover:bg-red-500/20 disabled:opacity-40">
                            <XCircle className="w-3.5 h-3.5" />Decline
                          </button>
                        </>
                      )}
                      <button onClick={() => setDeleteClipId(clip.id)}
                        className="px-3 py-2.5 border border-white/10 text-white/20 hover:border-red-500/40 hover:text-red-400 rounded transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {clipsData?.clips?.length === 0 && (
                  <div className="text-center py-16 text-white/20 font-display text-2xl">NO CLIPS HERE</div>
                )}
              </div>
            )}

            {/* Pagination */}
            {clipsData?.pagination?.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-teal px-4 py-2 rounded text-sm disabled:opacity-20">← Prev</button>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={clipsData.pagination.pages}
                    value={page}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= clipsData.pagination.pages) setPage(val);
                    }}
                    className="w-14 bg-sot-card border border-white/10 text-white text-center font-mono text-sm rounded py-1.5 focus:outline-none focus:border-teal/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-white/30 font-mono text-sm">/ {clipsData.pagination.pages}</span>
                </div>
                <button onClick={() => setPage(p => Math.min(clipsData.pagination.pages, p + 1))} disabled={page === clipsData.pagination.pages}
                  className="btn-teal px-4 py-2 rounded text-sm disabled:opacity-20">Next →</button>
              </div>
            )}
          </>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="sot-card rounded p-3 flex items-center gap-4">
                  <div className="skeleton w-9 h-9 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="skeleton h-3 w-16 rounded hidden md:block" />
                  <div className="skeleton h-7 w-28 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Search + meta bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search name or @username..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full bg-sot-card border border-white/10 text-white placeholder-white/25 rounded pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:border-teal/50 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-white/20 text-xs font-mono">
                    {usersData?.users?.filter((u: any) =>
                      !userSearch ||
                      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.twitchLogin.toLowerCase().includes(userSearch.toLowerCase())
                    ).length} / {usersData?.users?.length} streamers
                  </p>
                  {allowManualLive && (
                    <span className="text-xs font-display tracking-wider text-yellow-400/60 border border-yellow-400/20 px-2 py-1 rounded">
                      LIVE OVERRIDE
                    </span>
                  )}
                </div>
              </div>

              {/* Column headers — desktop only */}
              <div className="hidden md:grid grid-cols-[auto_1fr_100px_160px_40px] gap-4 px-4 pb-2 mb-1 border-b border-white/5">
                <div className="w-9" />
                <span className="font-display text-xs tracking-widest text-white/20">STREAMER</span>
                <span className="font-display text-xs tracking-widest text-white/20">CLIPS</span>
                <span className="font-display text-xs tracking-widest text-white/20">ROLE</span>
                <div />
              </div>

              {/* User rows */}
              <div className="space-y-1">
                {usersData?.users
                  ?.filter((u: any) =>
                    !userSearch ||
                    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.twitchLogin.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u: any) => (
                    <div key={u.id}
                      className="sot-card rounded p-3 md:p-0 flex flex-col md:grid md:grid-cols-[auto_1fr_100px_160px_40px] md:gap-4 md:items-center hover:border-white/10 transition-colors group">

                      {/* Avatar */}
                      <div className="hidden md:flex items-center justify-center pl-4">
                        <div className="relative flex-shrink-0">
                          {u.profileImage ? (
                            <Image src={u.profileImage} alt={u.displayName} width={36} height={36}
                              className="w-9 h-9 rounded-full border border-white/10 group-hover:border-teal/30 transition-colors"
                              style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="w-9 h-9 rounded-full border border-white/10 bg-sot-dark flex items-center justify-center text-sm">🏴‍☠️</div>
                          )}
                          {u.isLive && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-sot-bg block" />
                          )}
                        </div>
                      </div>

                      {/* Name + handle — mobile has avatar inline */}
                      <div className="flex items-center gap-3 md:py-3">
                        {/* Mobile avatar */}
                        <div className="md:hidden relative flex-shrink-0">
                          {u.profileImage ? (
                            <Image src={u.profileImage} alt={u.displayName} width={36} height={36}
                              className="w-9 h-9 rounded-full border border-white/10"
                              style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="w-9 h-9 rounded-full border border-white/10 bg-sot-dark flex items-center justify-center text-sm">🏴‍☠️</div>
                          )}
                          {u.isLive && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-sot-bg block" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/streamers/${u.twitchLogin}`}
                              className="font-display text-sm font-700 text-white hover:text-teal transition-colors">
                              {u.displayName}
                            </Link>
                            {u.isLive && (
                              <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
                                <Radio className="w-2.5 h-2.5 animate-pulse" />
                                {u.viewerCount != null ? u.viewerCount.toLocaleString('en-US') : 'LIVE'}
                              </span>
                            )}
                            {u.youtubeChannelName && (
                              <span className="text-xs text-red-400/40 border border-red-400/15 px-1 py-0.5 rounded font-mono">YT</span>
                            )}
                          </div>
                          <p className="text-white/25 text-xs font-mono">@{u.twitchLogin}</p>
                        </div>
                      </div>

                      {/* Clips */}
                      <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 mt-2 md:mt-0">
                        <span className="font-display text-sm font-700 text-teal">{u._count.clips}</span>
                        {u.channelClipCount > 0 ? (
                          <span className="text-white/20 text-xs font-mono md:mt-0.5">
                            +{u.channelClipCount} <span className="hidden md:inline">by others</span>
                          </span>
                        ) : (
                          <span className="text-white/15 text-xs font-mono md:mt-0.5 hidden md:block">—</span>
                        )}
                      </div>

                      {/* Role select */}
                      <div className="mt-2 md:mt-0">
                        <select
                          defaultValue={u.role}
                          onChange={e => userMutation.mutate({ id: u.id, role: e.target.value })}
                          className={`w-full bg-sot-dark border rounded px-2.5 py-1.5 font-display text-xs tracking-wider focus:outline-none focus:border-teal/50 transition-colors cursor-pointer ${ROLE_STYLES[u.role] || 'border-white/10 text-white/40'}`}
                        >
                          {['USER', 'MODERATOR', 'SUPPORTER', 'PARTNER', 'ADMIN'].map(r => (
                            <option key={r} value={r} className="bg-sot-dark text-white">{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* Live toggle */}
                      <div className="hidden md:flex justify-center pr-4">
                        {allowManualLive && ['PARTNER', 'ADMIN'].includes(u.role) ? (
                          <button
                            onClick={() => userMutation.mutate({ id: u.id, isLive: !u.isLive })}
                            disabled={userMutation.isPending}
                            title={u.isLive ? 'Mark offline' : 'Mark live'}
                            className={`w-8 h-8 rounded border flex items-center justify-center transition-all disabled:opacity-40 ${
                              u.isLive
                                ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'border-white/10 text-white/15 hover:border-white/20 hover:text-white/30'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty search state */}
              {userSearch && usersData?.users?.filter((u: any) =>
                u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.twitchLogin.toLowerCase().includes(userSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-12 text-white/20 font-display text-xl tracking-wide">
                  No streamers match "{userSearch}"
                </div>
              )}
            </>
          )
        )}

        {/* ── EVENTSUB TAB ─────────────────────────────────────────────────────── */}
        {tab === 'eventsub' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/40 text-sm font-body">
                EventSub subscription status for all Partners and Admins.
              </p>
              <button
                onClick={() => resubscribeMutation.mutate({ all: true })}
                disabled={resubscribeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-teal/10 border border-teal/30 text-teal font-display text-xs rounded tracking-wider hover:bg-teal/20 transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resubscribeMutation.isPending ? 'animate-spin' : ''}`} />
                Fix All Missing
              </button>
            </div>

            {eventsubLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {eventsubData?.partners?.map((partner: any) => {
                  const onlineStatus = partner.subscriptions.online?.status;
                  const offlineStatus = partner.subscriptions.offline?.status;

                  const SubBadge = ({ status, label }: { status: string | undefined; label: string }) => {
                    if (!status) return (
                      <span className="flex items-center gap-1 text-xs font-mono text-red-400 border border-red-400/20 bg-red-400/10 px-2 py-1 rounded">
                        <WifiOff className="w-3 h-3" />{label}: Missing
                      </span>
                    );
                    if (status === 'enabled') return (
                      <span className="flex items-center gap-1 text-xs font-mono text-teal border border-teal/20 bg-teal/10 px-2 py-1 rounded">
                        <Wifi className="w-3 h-3" />{label}: Active
                      </span>
                    );
                    return (
                      <span className="flex items-center gap-1 text-xs font-mono text-yellow-400 border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 rounded">
                        <WifiOff className="w-3 h-3" />{label}: {status}
                      </span>
                    );
                  };

                  return (
                    <div key={partner.id}
                      className={`sot-card rounded p-3 flex items-center gap-4 ${!partner.fullySubscribed ? 'border border-red-500/20' : ''}`}>
                      <div className="relative flex-shrink-0">
                        {partner.profileImage ? (
                          <Image src={partner.profileImage} alt={partner.displayName} width={40} height={40}
                            className="w-10 h-10 rounded border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded border border-white/10 bg-sot-dark flex items-center justify-center">🏴‍☠️</div>
                        )}
                        {partner.isLive && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
                        )}
                      </div>
                      <div className="flex-shrink-0 min-w-[120px]">
                        <p className="font-display text-sm font-700 text-white">{partner.displayName}</p>
                        <p className="text-white/30 text-xs font-mono">@{partner.twitchLogin}</p>
                        <span className={`text-xs font-display tracking-wider ${partner.role === 'ADMIN' ? 'text-red-400' : 'text-purple-400'}`}>
                          {partner.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-1">
                        <SubBadge status={onlineStatus} label="Online" />
                        <SubBadge status={offlineStatus} label="Offline" />
                      </div>
                      <button
                        onClick={() => resubscribeMutation.mutate({ userId: partner.id })}
                        disabled={resubscribeMutation.isPending}
                        className={`flex items-center gap-1.5 px-3 py-1.5 font-display text-xs rounded tracking-wider transition-all disabled:opacity-40 flex-shrink-0 ${
                          partner.fullySubscribed
                            ? 'border border-white/10 text-white/20 hover:border-white/20 hover:text-white/40'
                            : 'border border-teal/30 bg-teal/10 text-teal hover:bg-teal/20'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {partner.fullySubscribed ? 'Resync' : 'Fix'}
                      </button>
                    </div>
                  );
                })}
                {eventsubData?.partners?.length === 0 && (
                  <div className="text-center py-16 text-white/20 font-display text-2xl">NO PARTNERS OR ADMINS</div>
                )}
              </div>
            )}

            {eventsubData && (
              <p className="text-white/20 text-xs font-mono mt-4 text-right">
                {eventsubData.totalSubs} total active subscriptions on your Twitch app
              </p>
            )}
          </div>
        )}

      </div>
    </>
  );
}