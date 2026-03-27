// src/app/settings/page.tsx
'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Youtube, Link as LinkIcon, Trash2, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function LinkedCard({ title, icon, linked, onLink, onUnlink, placeholder, field }: {
  title: string; icon: React.ReactNode; linked: { name: string; id: string } | null;
  onLink: (url: string) => Promise<void>; onUnlink: () => Promise<void>;
  placeholder: string; field: string;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try { await onLink(url.trim()); setUrl(''); }
    finally { setLoading(false); }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try { await onUnlink(); }
    finally { setLoading(false); }
  };

  return (
    <div className="sot-card rounded p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-base font-700 text-white tracking-wide">{title}</h3>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            {linked ? `Linked as ${linked.name}` : 'Not linked'}
          </p>
        </div>
        {linked && (
          <span className="ml-auto px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border border-teal/30 bg-teal/10 text-teal">
            LINKED
          </span>
        )}
      </div>

      {linked ? (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/50 font-mono truncate flex-1 mr-4">
            ID: {linked.id}
          </div>
          <button onClick={handleUnlink} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-display text-xs rounded tracking-wider transition-all disabled:opacity-40">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Unlink
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-sot-dark border border-white/10 text-white placeholder-white/20 rounded pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:border-teal/50 transition-colors" />
          </div>
          <button onClick={handleLink} disabled={loading || !url.trim()}
            className="flex items-center gap-1.5 px-4 py-2 btn-teal rounded text-xs font-display tracking-wider disabled:opacity-30">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Link
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading, refetch } = useAuth();

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

  const linkYouTube = async (channelUrl: string) => {
    const res = await fetch('/api/settings/link-youtube', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelUrl }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(`YouTube linked: ${data.channelName}`);
    refetch?.();
  };

  const unlinkYouTube = async () => {
    const res = await fetch('/api/settings/link-youtube', { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to unlink'); return; }
    toast.success('YouTube unlinked');
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

      {/* Twitch — always linked, can't unlink */}
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
        <LinkedCard
          title="YouTube"
          icon={<Youtube className="w-4 h-4 text-red-400" />}
          linked={user.youtubeChannelId ? { name: user.youtubeChannelName || 'YouTube Channel', id: user.youtubeChannelId } : null}
          onLink={linkYouTube}
          onUnlink={unlinkYouTube}
          placeholder="https://www.youtube.com/@YourChannel"
          field="youtubeChannelId"
        />

      </div>

      {/* Info box */}
      <div className="sot-card rounded p-4 border-l-2 border-l-white/10">
        <p className="font-display text-xs text-white/30 tracking-widest mb-2">WHY LINK ACCOUNTS?</p>
        <ul className="text-xs text-white/30 space-y-1 font-body">
          <li>→ Linking YouTube lets us verify clip ownership automatically</li>
          <li>→ Unlinked YouTube clips are flagged for manual review by mods</li>
          <li>→ Medal.tv clips always go to manual review — no linking required</li>
          <li>→ Twitch is your primary account and cannot be unlinked</li>
          <li>→ You can unlink YouTube at any time — past clips are not affected</li>
        </ul>
      </div>
    </div>
  );
}