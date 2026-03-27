// src/app/dashboard/page.tsx
'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { ClipGridSkeleton } from '@/components/ui/Skeletons';
import { TagBadge } from '@/components/ui/TagBadge';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, Clock, XCircle, Swords, Trash2, AlertTriangle, Settings, Youtube, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS = {
  APPROVED: { icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'text-teal border-teal/30 bg-teal/10' },
  PENDING:  { icon: <Clock className="w-3.5 h-3.5" />,        cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  DECLINED: { icon: <XCircle className="w-3.5 h-3.5" />,      cls: 'text-red-400 border-red-400/30 bg-red-400/10' },
};

const PLATFORM_BADGE: Record<string, React.ReactNode> = {
  YOUTUBE: <span className="text-xs font-mono text-red-400 border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 rounded">YT</span>,
  MEDAL:   <span className="text-xs font-mono text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-1.5 py-0.5 rounded">🏅</span>,
  TWITCH:  null,
};

function DeleteAccountModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative sot-card rounded-lg p-6 w-full max-w-sm border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-700 text-white tracking-wide">Delete Account</h3>
            <p className="text-xs text-white/30 font-mono mt-0.5">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-2 leading-relaxed">This will permanently remove:</p>
        <ul className="space-y-1 mb-6">
          {['Your profile and all account data', 'All clips you submitted', 'Your active session'].map(item => (
            <li key={item} className="flex gap-2 text-sm text-white/40">
              <span className="text-red-400 flex-shrink-0">→</span>{item}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-white/10 text-white/50 font-display text-sm rounded tracking-wider hover:border-white/20 transition-all disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-display text-sm rounded tracking-wider hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            <Trash2 className="w-3.5 h-3.5" />{loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClipRow({ clip, showStatus = true }: { clip: any; showStatus?: boolean }) {
  const s = STATUS[clip.status as keyof typeof STATUS];
  return (
    <div className="sot-card rounded flex items-center gap-3 p-3 hover:border-teal/20 transition-colors">
      <div className="w-20 h-12 md:w-24 md:h-14 rounded overflow-hidden flex-shrink-0 bg-sot-dark">
        {clip.thumbnailUrl
          ? <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">🎬</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-display text-sm font-600 text-white truncate">{clip.title}</p>
          {PLATFORM_BADGE[clip.platform]}
        </div>
        <p className="text-white/30 text-xs font-mono">{clip.broadcasterName}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {clip.tags.slice(0, 2).map((t: any) => <TagBadge key={t.id} tag={t.tag} small />)}
        </div>
        {clip.status === 'DECLINED' && clip.reviewNotes && (
          <p className="text-xs text-red-400/60 font-body mt-1 flex items-center gap-1">
            <span className="flex-shrink-0">→</span>Reason: {clip.reviewNotes}
          </p>
        )}
        {!clip.platformVerified && clip.status === 'PENDING' && (
          <p className="text-xs text-yellow-400/60 font-body mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />Ownership unverified — pending manual review
          </p>
        )}
      </div>
      {showStatus && s && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-display tracking-wider border flex-shrink-0 ${s.cls}`}>
          {s.icon}<span className="hidden sm:inline">{clip.status}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<'mine' | 'channel'>('mine');

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['my-clips'],
    queryFn: () => fetch('/api/clips/mine').then(r => r.json()),
    enabled: !!user,
  });

  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: ['channel-clips', user?.twitchLogin],
    queryFn: () => fetch('/api/clips/channel').then(r => r.json()),
    enabled: !!user,
  });

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Account deleted. Farewell, pirate.');
      window.location.href = '/';
    } catch {
      toast.error('Failed to delete account. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12"><ClipGridSkeleton count={4} /></div>;

  if (!user) return (
    <div className="text-center py-24">
      <p className="font-display text-4xl text-white/20 mb-6">NOT LOGGED IN</p>
      <a href="/api/auth/login" className="btn-teal-solid px-6 py-3 rounded inline-block">Sign in with Twitch</a>
    </div>
  );

  const myClips = myData?.clips || [];
  const channelClips = channelData?.clips || [];

  const counts = {
    APPROVED: myClips.filter((c: any) => c.status === 'APPROVED').length,
    PENDING:  myClips.filter((c: any) => c.status === 'PENDING').length,
    DECLINED: myClips.filter((c: any) => c.status === 'DECLINED').length,
  };

  return (
    <>
      {showDeleteModal && (
        <DeleteAccountModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={deleting} />
      )}

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Profile card */}
        <div className="sot-card rounded p-4 md:p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {user.profileImage && (
              <Image src={user.profileImage} alt={user.displayName} width={56} height={56}
                className="rounded border-2 border-teal/40 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-700 text-white">{user.displayName}</h1>
              <p className="text-white/30 font-mono text-xs mt-0.5">@{user.twitchLogin}</p>
              {/* Linked platforms */}
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border text-purple-400 border-purple-400/30 bg-purple-400/10">
                  Twitch
                </span>
                {user.youtubeChannelId && (
                  <span className="px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border text-red-400 border-red-400/30 bg-red-400/10">
                    YouTube
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-white/5">
            <Link href="/submit" className="btn-teal flex-1 py-2.5 rounded text-sm flex items-center justify-center gap-2">
              <Swords className="w-4 h-4" />Submit Clip
            </Link>
            <Link href="/settings"
              className="flex items-center gap-1.5 px-4 py-2.5 border border-white/10 text-white/30 hover:border-teal/40 hover:text-teal font-display text-xs rounded tracking-wider transition-all">
              <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline">Settings</span>
            </Link>
            <button onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-white/10 text-white/25 hover:border-red-500/40 hover:text-red-400 font-display text-xs rounded tracking-wider transition-all">
              <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className="stat-card rounded p-3 md:p-4 text-center">
              <div className={`font-display text-3xl md:text-4xl font-900 ${
                status === 'APPROVED' ? 'text-teal' : status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'
              }`}>{count}</div>
              <div className="text-white/30 text-xs font-display tracking-widest mt-1">{status}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-5 border-b border-white/5">
          <button onClick={() => setTab('mine')}
            className={`flex items-center gap-2 px-4 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
              tab === 'mine' ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
            }`}>
            <Swords className="w-3.5 h-3.5" />Your Submissions
            <span className="text-xs opacity-60">({myClips.length})</span>
          </button>
          <button onClick={() => setTab('channel')}
            className={`flex items-center gap-2 px-4 py-2.5 font-display text-sm tracking-wider border-b-2 transition-all ${
              tab === 'channel' ? 'border-teal text-teal' : 'border-transparent text-white/25 hover:text-white/50'
            }`}>
            <Users className="w-3.5 h-3.5" />From Your Channel
            <span className="text-xs opacity-60">({channelClips.length})</span>
          </button>
        </div>

        {/* Your Submissions */}
        {tab === 'mine' && (
          myLoading ? <ClipGridSkeleton count={3} /> :
          myClips.length === 0 ? (
            <div className="text-center py-14 sot-card rounded">
              <p className="font-display text-2xl text-white/20 mb-4">NO CLIPS YET</p>
              <Link href="/submit" className="btn-teal px-5 py-2.5 rounded text-sm inline-block">Submit Your First Clip</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myClips.map((clip: any) => <ClipRow key={clip.id} clip={clip} />)}
            </div>
          )
        )}

        {/* From Your Channel */}
        {tab === 'channel' && (
          channelLoading ? <ClipGridSkeleton count={3} /> :
          channelClips.length === 0 ? (
            <div className="text-center py-14 sot-card rounded">
              <p className="font-display text-2xl text-white/20 mb-3">NO CLIPS YET</p>
              <p className="text-white/20 text-sm font-body">When others submit approved clips from your channel, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {channelClips.map((clip: any) => <ClipRow key={clip.id} clip={clip} showStatus={false} />)}
            </div>
          )
        )}
      </div>
    </>
  );
}
