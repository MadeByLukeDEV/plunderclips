'use client';
import { useState, useEffect } from 'react';
import { Youtube, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

const DISMISS_KEY = 'yt-relink-v2-dismissed';
const EXPIRES_AT  = new Date('2025-06-07T00:00:00Z');

export function YoutubeRelinkBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.youtubeChannelId) return;
    if (new Date() >= EXPIRES_AT) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, [user?.youtubeChannelId]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-6 rounded border border-yellow-500/30 bg-yellow-500/8 px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded bg-yellow-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Youtube className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-700 text-yellow-300 tracking-wide mb-0.5">
          YouTube account upgrade required
        </p>
        <p className="text-xs text-white/45 font-body leading-relaxed">
          We&apos;ve switched YouTube linking to OAuth for better security and automatic ownership
          verification. Please relink your channel to keep clip verification working.
        </p>
        <a
          href="/api/auth/youtube/login"
          className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 font-display text-xs rounded tracking-wider transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          RELINK YOUTUBE
        </a>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-1 text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
