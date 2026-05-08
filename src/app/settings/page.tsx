// src/app/settings/page.tsx
'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { YouTubeIcon } from '@/components/ui/BrandIcons';
import Link from 'next/link';
import { YoutubeRelinkBanner } from '@/components/ui/YoutubeRelinkBanner';

const YT_ERROR_MESSAGES: Record<string, string> = {
  youtube_oauth:       'YouTube authorisation was cancelled or failed.',
  youtube_state:       'Security check failed — please try again.',
  youtube_token:       'Could not exchange YouTube auth code. Try again.',
  youtube_no_channel:  'No YouTube channel found on that account.',
  youtube_taken:       'This YouTube channel is already linked to another account.',
  youtube_server:      'Something went wrong — please try again.',
  youtube_config:      'YouTube OAuth is not configured yet.',
};

function YouTubeCard({
  linked,
  onUnlink,
}: {
  linked: { name: string; id: string } | null;
  onUnlink: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleUnlink = async () => {
    setLoading(true);
    try { await onUnlink(); }
    finally { setLoading(false); }
  };

  return (
    <div className="sot-card rounded p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <YouTubeIcon className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h3 className="font-display text-base font-700 text-white tracking-wide">YouTube</h3>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            {linked ? `Connected as ${linked.name}` : 'Not connected'}
          </p>
        </div>
        {linked && (
          <span className="ml-auto px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border border-teal/30 bg-teal/10 text-teal flex-shrink-0">
            LINKED
          </span>
        )}
      </div>

      {linked ? (
        <div className="flex items-center justify-between gap-4">
          <a
            href={`https://www.youtube.com/channel/${linked.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/40 font-mono hover:text-white/70 transition-colors truncate"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {linked.name}
          </a>
          <button
            onClick={handleUnlink}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-display text-xs rounded tracking-wider transition-all disabled:opacity-40 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Disconnect
          </button>
        </div>
      ) : (
        <a
          href="/api/auth/youtube/login"
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 text-red-400 font-display text-xs rounded tracking-wider transition-all"
        >
          <YouTubeIcon className="w-3.5 h-3.5" />
          CONNECT WITH YOUTUBE
        </a>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading, refetch } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get('linked');
    const error  = params.get('error');
    if (linked === 'youtube') {
      toast.success('YouTube connected!');
      refetch?.();
      window.history.replaceState({}, '', '/settings');
    } else if (error && error.startsWith('youtube')) {
      toast.error(YT_ERROR_MESSAGES[error] ?? 'YouTube linking failed.');
      window.history.replaceState({}, '', '/settings');
    }
  }, [refetch]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-32 rounded" />
      <div className="skeleton h-32 rounded" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-24">
      <a href="/api/auth/login" className="btn-teal-solid px-6 py-3 rounded inline-block">Sign in with Twitch</a>
    </div>
  );

  const unlinkYouTube = async () => {
    const res = await fetch('/api/settings/link-youtube', { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to disconnect YouTube'); return; }
    toast.success('YouTube disconnected');
    refetch?.();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/30 hover:text-teal font-display text-xs tracking-widest mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />BACK TO DASHBOARD
      </Link>

      <div className="mb-8">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">ACCOUNT</p>
        <h1 className="font-display text-4xl font-900 text-white">Settings</h1>
        <div className="teal-divider mt-3" />
      </div>

      <YoutubeRelinkBanner />

      {/* Twitch — always linked, primary */}
      <div className="sot-card rounded p-5 mb-4 border border-teal/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400 text-sm font-bold">T</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-700 text-white tracking-wide">Twitch</h3>
            <p className="text-xs text-white/30 font-mono mt-0.5">Primary account — {user.displayName}</p>
          </div>
          <span className="px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border border-teal/30 bg-teal/10 text-teal">
            PRIMARY
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <YouTubeCard
          linked={user.youtubeChannelId ? { name: user.youtubeChannelName || 'YouTube Channel', id: user.youtubeChannelId } : null}
          onUnlink={unlinkYouTube}
        />
      </div>

      <div className="sot-card rounded p-4 border-l-2 border-l-white/10">
        <p className="font-display text-xs text-white/30 tracking-widest mb-2">WHY LINK ACCOUNTS?</p>
        <ul className="text-xs text-white/30 space-y-1 font-body">
          <li>→ Linking YouTube verifies clip ownership automatically</li>
          <li>→ Unlinked YouTube clips are flagged for manual review by mods</li>
          <li>→ Medal.tv clips always go to manual review — no linking required</li>
          <li>→ Twitch is your primary account and cannot be unlinked</li>
          <li>→ You can disconnect YouTube at any time — past clips are not affected</li>
        </ul>
      </div>
    </div>
  );
}
