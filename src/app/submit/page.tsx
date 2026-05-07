// src/app/submit/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { TAG_CATEGORIES, TagBadge } from '@/components/ui/TagBadge';
import toast from 'react-hot-toast';
import {
  CheckCircle, Link as LinkIcon, Loader2,
  X, Film, Eye, Clock, Play, Video,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

type PickerTab = 'TWITCH' | 'YOUTUBE' | 'LINK';
type YtFilter  = 'ALL' | 'SHORTS' | 'VIDEOS';
type DetectedPlatform = 'TWITCH' | 'YOUTUBE' | 'MEDAL' | null;

type PickerItem = {
  url:          string;
  title:        string;
  thumbnailUrl: string | null;
  duration:     number | null;
  channelName:  string;
  viewCount?:   number;
  platform:     'TWITCH' | 'YOUTUBE' | 'MEDAL';
  isShort?:     boolean;
  embedUrl?:    string | null;
};

type PreviewData = {
  platform:     'TWITCH' | 'YOUTUBE' | 'MEDAL';
  title:        string;
  channelName:  string;
  thumbnailUrl: string | null;
  duration:     number | null;
  viewCount?:   number;
  embedUrl?:    string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectPlatform(url: string): DetectedPlatform {
  if (/clips\.twitch\.tv|twitch\.tv\/.+\/clip\//i.test(url)) return 'TWITCH';
  if (/youtube\.com\/(watch|shorts\/)|youtu\.be\//i.test(url)) return 'YOUTUBE';
  if (/medal\.tv/i.test(url)) return 'MEDAL';
  return null;
}

function fmtDuration(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}


// ── LoadingGrid ────────────────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton aspect-video rounded" />
          <div className="skeleton h-3 rounded w-3/4" />
          <div className="skeleton h-2 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ── PickerCard ─────────────────────────────────────────────────────────────────

function PickerCard({ item, onSelect }: { item: PickerItem; onSelect: (item: PickerItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group relative rounded overflow-hidden border border-white/10 hover:border-teal/40 transition-all text-left w-full"
    >
      <div className="relative aspect-video bg-[var(--bg-card)]">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏴‍☠️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <span className={`absolute top-1.5 left-1.5 text-[9px] font-display tracking-wider px-1.5 py-0.5 rounded ${
          item.platform === 'TWITCH' ? 'bg-purple-600/80 text-white' : 'bg-red-600/80 text-white'
        }`}>
          {item.platform}
        </span>

        {item.isShort && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-display tracking-wider px-1.5 py-0.5 rounded bg-red-500/80 text-white">
            SHORT
          </span>
        )}

        {item.duration != null && !item.isShort && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white/70 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{fmtDuration(item.duration)}
          </span>
        )}

        <div className="absolute inset-0 bg-teal/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-teal text-[var(--bg-deep)] text-xs font-display tracking-wider px-3 py-1.5 rounded">
            SELECT
          </span>
        </div>
      </div>

      <div className="p-2">
        <p className="font-display text-white/80 text-[11px] leading-tight line-clamp-2">{item.title}</p>
        <p className="font-mono text-white/30 text-[10px] mt-0.5 truncate">{item.channelName}</p>
      </div>
    </button>
  );
}

// ── ClipPickerModal ────────────────────────────────────────────────────────────

const TWITCH_PAGE_SIZE = 20;

function ClipPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (item: PickerItem) => void;
  onClose:  () => void;
}) {
  const [activeTab, setActiveTab]             = useState<PickerTab>('TWITCH');
  // Twitch — fetch 100 at once, paginate locally
  const [twitchAll, setTwitchAll]             = useState<PickerItem[]>([]);
  const [twitchDisplay, setTwitchDisplay]     = useState(TWITCH_PAGE_SIZE);
  const [twitchApiCursor, setTwitchApiCursor] = useState<string | null>(null);
  const [twitchLoadingMore, setTwitchLoadingMore] = useState(false);
  // YouTube — API pagination
  const [ytVideos, setYtVideos]               = useState<PickerItem[]>([]);
  const [ytFilter, setYtFilter]               = useState<YtFilter>('ALL');
  const [ytPageToken, setYtPageToken]         = useState<string | null>(null);
  const [ytLoadingMore, setYtLoadingMore]     = useState(false);
  const [ytNotLinked, setYtNotLinked]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [linkUrl, setLinkUrl]                 = useState('');
  const [linkPreview, setLinkPreview]         = useState<PreviewData | null>(null);
  const [linkLoading, setLinkLoading]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch fresh when tab changes
  useEffect(() => {
    if (activeTab === 'LINK') return;
    const controller = new AbortController();

    const doFetch = async () => {
      setLoading(true);
      if (activeTab === 'TWITCH') {
        setTwitchAll([]);
        setTwitchDisplay(TWITCH_PAGE_SIZE);
        setTwitchApiCursor(null);
        try {
          const d: { clips: PickerItem[]; nextCursor: string | null } =
            await fetch('/api/clips/picker/twitch', { signal: controller.signal }).then(r => r.json());
          setTwitchAll(d.clips ?? []);
          setTwitchApiCursor(d.nextCursor ?? null);
        } catch (e) { if ((e as Error).name !== 'AbortError') setTwitchAll([]); }
      } else {
        setYtVideos([]);
        setYtPageToken(null);
        try {
          const d: { videos: PickerItem[]; nextPageToken: string | null; notLinked?: boolean } =
            await fetch('/api/clips/picker/youtube', { signal: controller.signal }).then(r => r.json());
          if (d.notLinked) setYtNotLinked(true);
          else { setYtVideos(d.videos ?? []); setYtPageToken(d.nextPageToken ?? null); }
        } catch (e) { if ((e as Error).name !== 'AbortError') setYtVideos([]); }
      }
      setLoading(false);
    };

    doFetch();
    return () => controller.abort();
  }, [activeTab]);

  // Link tab URL debounce
  useEffect(() => {
    if (!linkUrl) { setLinkPreview(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLinkLoading(true);
      try {
        const res = await fetch(`/api/clips/preview?url=${encodeURIComponent(linkUrl)}`);
        setLinkPreview(res.ok ? await res.json() : null);
      } catch { setLinkPreview(null); }
      finally { setLinkLoading(false); }
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [linkUrl]);

  // Twitch load more: first exhaust local batch, then fetch next API page
  const loadMoreTwitch = async () => {
    if (twitchDisplay < twitchAll.length) {
      setTwitchDisplay(prev => prev + TWITCH_PAGE_SIZE);
      return;
    }
    if (!twitchApiCursor || twitchLoadingMore) return;
    setTwitchLoadingMore(true);
    try {
      const d: { clips: PickerItem[]; nextCursor: string | null } =
        await fetch(`/api/clips/picker/twitch?cursor=${twitchApiCursor}`).then(r => r.json());
      setTwitchAll(prev => [...prev, ...(d.clips ?? [])]);
      setTwitchApiCursor(d.nextCursor ?? null);
      setTwitchDisplay(prev => prev + TWITCH_PAGE_SIZE);
    } catch {}
    setTwitchLoadingMore(false);
  };

  const loadMoreYoutube = async () => {
    if (!ytPageToken || ytLoadingMore) return;
    setYtLoadingMore(true);
    try {
      const d: { videos: PickerItem[]; nextPageToken: string | null } =
        await fetch(`/api/clips/picker/youtube?pageToken=${ytPageToken}`).then(r => r.json());
      setYtVideos(prev => [...prev, ...(d.videos ?? [])]);
      setYtPageToken(d.nextPageToken ?? null);
    } catch {}
    setYtLoadingMore(false);
  };

  const visibleTwitch = twitchAll.slice(0, twitchDisplay);
  const twitchHasMore = twitchDisplay < twitchAll.length || !!twitchApiCursor;

  const filteredYt = ytVideos.filter(v =>
    ytFilter === 'ALL' ? true : ytFilter === 'SHORTS' ? !!v.isShort : !v.isShort,
  );

  const handleLinkConfirm = () => {
    if (!linkPreview) return;
    onSelect({
      url:          linkUrl,
      title:        linkPreview.title,
      thumbnailUrl: linkPreview.thumbnailUrl,
      duration:     linkPreview.duration,
      channelName:  linkPreview.channelName,
      viewCount:    linkPreview.viewCount,
      platform:     detectPlatform(linkUrl) ?? 'TWITCH',
    });
  };

  const TABS: { id: PickerTab; label: string }[] = [
    { id: 'TWITCH',  label: 'Twitch' },
    { id: 'YOUTUBE', label: 'YouTube' },
    { id: 'LINK',    label: 'Paste URL' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Tab bar */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex gap-1.5 flex-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`font-display text-xs tracking-wider px-3 py-1.5 rounded transition-colors border ${
                  activeTab === tab.id
                    ? 'bg-teal/10 text-teal border-teal/30'
                    : 'text-white/30 hover:text-white/60 border-transparent'
                }`}
              >
                {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* YouTube type filter */}
        {activeTab === 'YOUTUBE' && !ytNotLinked && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] flex-shrink-0">
            {(['ALL', 'SHORTS', 'VIDEOS'] as YtFilter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setYtFilter(f)}
                className={`font-display text-[10px] tracking-wider px-2.5 py-1 rounded border transition-colors ${
                  ytFilter === f ? 'text-teal border-teal/40 bg-teal/10' : 'text-white/30 border-white/10 hover:text-white/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* Twitch tab */}
          {activeTab === 'TWITCH' && (
            loading ? <LoadingGrid /> :
            twitchAll.length === 0 ? (
              <p className="text-center text-white/30 py-16 font-display tracking-wider text-sm">
                No clips found on your channel
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {visibleTwitch.map(c => <PickerCard key={c.url} item={c} onSelect={onSelect} />)}
                </div>
                {twitchHasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMoreTwitch}
                      disabled={twitchLoadingMore}
                      className="btn-teal text-xs px-6 py-2 rounded disabled:opacity-30 flex items-center gap-2"
                    >
                      {twitchLoadingMore
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
                        : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* YouTube tab */}
          {activeTab === 'YOUTUBE' && (
            ytNotLinked ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Video className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm font-body">No YouTube channel linked to your account.</p>
                <Link href="/settings" onClick={onClose} className="btn-teal text-xs px-4 py-2 rounded">
                  Link in Settings →
                </Link>
              </div>
            ) :
            loading ? <LoadingGrid /> :
            filteredYt.length === 0 ? (
              <p className="text-center text-white/30 py-16 font-display tracking-wider text-sm">
                {ytVideos.length === 0 ? 'No videos found on your channel' : `No ${ytFilter.toLowerCase()} found`}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredYt.map(v => <PickerCard key={v.url} item={v} onSelect={onSelect} />)}
                </div>
                {ytPageToken && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMoreYoutube}
                      disabled={ytLoadingMore}
                      className="btn-teal text-xs px-6 py-2 rounded disabled:opacity-30 flex items-center gap-2"
                    >
                      {ytLoadingMore
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
                        : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Link tab */}
          {activeTab === 'LINK' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="font-display text-xs tracking-widest text-white/50 mb-2 block">
                  CLIP URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="Twitch, YouTube, or Medal.tv URL..."
                    className="w-full bg-[var(--bg-card)] border border-white/10 text-white placeholder-white/20 rounded pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-teal/50 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-white/20">
                  clips.twitch.tv · youtube.com/watch · youtube.com/shorts · medal.tv
                </p>
              </div>

              {linkLoading && (
                <div className="flex items-center gap-2 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                  <span className="font-display text-xs tracking-wider">FETCHING CLIP...</span>
                </div>
              )}

              {linkPreview && !linkLoading && (
                <div className="sot-card rounded overflow-hidden border border-teal/20">
                  <div className="relative aspect-video bg-[var(--bg-card)]">
                    {linkPreview.thumbnailUrl ? (
                      <Image src={linkPreview.thumbnailUrl} alt={linkPreview.title} fill style={{ objectFit: 'cover' }} sizes="500px" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl">🏴‍☠️</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-display text-white text-xs leading-snug">{linkPreview.title}</p>
                      <p className="font-mono text-white/50 text-[10px] mt-0.5">{linkPreview.channelName}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal" />
                    <span className="font-display text-xs text-teal tracking-wider">CLIP FOUND — {linkPreview.platform}</span>
                  </div>
                  <div className="px-3 pb-3">
                    <button type="button" onClick={handleLinkConfirm} className="btn-teal-solid w-full py-2.5 rounded text-sm">
                      Use This Clip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PlatformHint ───────────────────────────────────────────────────────────────

function PlatformHint({ platform, youtubeLinked }: { platform: DetectedPlatform; youtubeLinked: boolean }) {
  if (!platform || platform === 'TWITCH') return null;
  if (platform === 'YOUTUBE' && !youtubeLinked) return (
    <div className="sot-card rounded p-3 border-l-2 border-l-yellow-400/50 flex items-start gap-2 text-sm">
      <Video className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      <span className="text-white/50 font-body">
        You haven't linked a YouTube channel. The clip will be flagged for manual review.{' '}
        <Link href="/settings" className="text-teal hover:underline">Link it in Settings →</Link>
      </span>
    </div>
  );
  if (platform === 'MEDAL') return (
    <div className="sot-card rounded p-3 border-l-2 border-l-yellow-400/50 flex items-start gap-2 text-sm">
      <span className="text-yellow-400 flex-shrink-0">🏅</span>
      <span className="text-white/50 font-body">
        Medal.tv clips are always sent to manual review by the crew.
      </span>
    </div>
  );
  return null;
}

// ── SubmitPage ─────────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [url, setUrl]               = useState('');
  const [tags, setTags]             = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [preview, setPreview]       = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const platform     = detectPlatform(url);
  const youtubeLinked = !!(user as { youtubeChannelId?: string } | null)?.youtubeChannelId;

  // Debounce preview fetch — only when URL input is visible and URL typed manually
  useEffect(() => {
    if (!showUrlInput) return;
    if (!url || !platform) {
      setPreview(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      setPreview(null);
      setPlaying(false);
      try {
        const res = await fetch(`/api/clips/preview?url=${encodeURIComponent(url)}`);
        if (res.ok) setPreview(await res.json());
      } catch {}
      finally { setPreviewLoading(false); }
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [url, platform, showUrlInput]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-6 py-20 space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-64 rounded" />
    </div>
  );

  if (!user) return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <p className="font-display text-4xl text-white/20 mb-6">ACCESS DENIED</p>
      <a href="/api/auth/login" className="btn-teal-solid px-6 py-3 rounded inline-block">
        Sign in with Twitch
      </a>
    </div>
  );

  const toggleTag = (t: string) =>
    setTags(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev,
    );

  const handlePickerSelect = (item: PickerItem) => {
    setUrl(item.url);
    setPreview({
      platform:     item.platform,
      title:        item.title,
      channelName:  item.channelName,
      thumbnailUrl: item.thumbnailUrl,
      duration:     item.duration,
      viewCount:    item.viewCount,
      embedUrl:     item.embedUrl ?? null,
    });
    setPlaying(false);
    setPickerOpen(false);
    setShowUrlInput(false);
  };

  const handleClearClip = () => {
    setUrl('');
    setPreview(null);
    setPlaying(false);
  };

  const toggleUrlInput = () => {
    setShowUrlInput(v => {
      if (!v) { setUrl(''); setPreview(null); } // clear picker selection when entering URL mode
      return !v;
    });
  };

  const handleSubmit = async () => {
    if (!url)         return toast.error('Select or paste a clip URL');
    if (!tags.length) return toast.error('Select at least one tag');
    if (!platform)    return toast.error('Unsupported URL — use Twitch, YouTube, or Medal.tv');
    setSubmitting(true);
    try {
      const res = await fetch('/api/clips', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clipUrl: url, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(true);
      toast.success('Clip submitted for review!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <CheckCircle className="w-14 h-14 text-teal mx-auto mb-6" />
      <h1 className="font-display text-4xl text-white mb-2">CLIP RECEIVED</h1>
      <p className="text-white/40 text-sm mb-8 font-body">Your clip is awaiting review by the crew.</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setSuccess(false); setUrl(''); setTags([]); setPreview(null); }}
          className="btn-teal px-5 py-2.5 rounded text-sm"
        >
          Submit Another
        </button>
        <button onClick={() => router.push('/dashboard')} className="btn-teal-solid px-5 py-2.5 rounded text-sm">
          View Dashboard
        </button>
      </div>
    </div>
  );

  const canSubmit = !!url && tags.length > 0 && !!platform && !submitting;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">NEW SUBMISSION</p>
        <h1 className="font-display text-5xl font-900 text-white">SUBMIT A CLIP</h1>
        <div className="teal-divider mt-3" />
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">

        {/* ── LEFT: Clip select + Preview + Submit ── */}
        <div className="space-y-6">

          {/* Step 1 — Select clip */}
          <section className="space-y-4">
            <div>
              <p className="font-display text-[10px] tracking-[0.3em] text-teal mb-0.5">STEP 01</p>
              <h2 className="font-display text-lg tracking-wider text-white/80">SELECT CLIP</h2>
            </div>

            {url && preview ? (
              /* Selected clip card */
              <div className="sot-card rounded-lg p-3 flex gap-3 items-start border border-teal/20">
                <div className="w-24 aspect-video rounded overflow-hidden flex-shrink-0 relative bg-[var(--bg-card)]">
                  {preview.thumbnailUrl && (
                    <Image src={preview.thumbnailUrl} alt="" fill style={{ objectFit: 'cover' }} sizes="96px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-white/80 leading-snug line-clamp-2">{preview.title}</p>
                  <p className="font-mono text-[10px] text-white/30 mt-0.5 truncate">{preview.channelName}</p>
                  <span className={`inline-block mt-1.5 text-[9px] font-display tracking-wider px-1.5 py-0.5 rounded ${
                    preview.platform === 'TWITCH'  ? 'bg-purple-600/20 text-purple-400' :
                    preview.platform === 'YOUTUBE' ? 'bg-red-600/20 text-red-400' :
                    'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    {preview.platform}
                  </span>
                </div>
                <button type="button" onClick={handleClearClip} className="text-white/20 hover:text-white/60 flex-shrink-0 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Browse button */
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full sot-card rounded-lg py-10 border border-dashed border-[var(--border-mid)] hover:border-teal/40 transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card2)] flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                  <Film className="w-5 h-5 text-white/20 group-hover:text-teal/60 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="font-display text-sm tracking-wider text-white/40 group-hover:text-white/60 transition-colors">
                    BROWSE MY CLIPS
                  </p>
                  <p className="font-mono text-xs text-white/20 mt-0.5">Twitch · YouTube</p>
                </div>
              </button>
            )}

            {/* URL paste toggle */}
            <button
              type="button"
              onClick={toggleUrlInput}
              className="text-xs text-white/25 hover:text-white/50 font-mono transition-colors flex items-center gap-1.5"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Hide URL input' : 'Paste a URL instead'}
            </button>

            {showUrlInput && (
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Paste a Twitch, YouTube, or Medal.tv URL..."
                    className="w-full bg-[var(--bg-card)] border border-white/10 text-white placeholder-white/20 rounded pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-teal/50 transition-colors"
                  />
                </div>
                {platform && (
                  <p className="text-xs font-display tracking-wider text-white/30">
                    Detected:{' '}
                    <span className={
                      platform === 'TWITCH'  ? 'text-purple-400' :
                      platform === 'YOUTUBE' ? 'text-red-400' : 'text-yellow-400'
                    }>{platform}</span>
                  </p>
                )}
                <PlatformHint platform={platform} youtubeLinked={youtubeLinked} />
              </div>
            )}
          </section>

          {/* Preview */}
          <section className="space-y-2">
            <p className="font-display text-[10px] tracking-[0.3em] text-white/30">PREVIEW</p>

            {previewLoading ? (
              <div className="sot-card rounded-lg aspect-video flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teal" />
              </div>
            ) : preview ? (
              <div className="sot-card rounded-lg overflow-hidden border border-teal/20">
                <div className="relative aspect-video bg-black">

                  {/* Player iframe — shown when playing */}
                  {playing && preview.embedUrl && (
                    <iframe
                      src={preview.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      title={preview.title}
                    />
                  )}

                  {/* Thumbnail + play overlay — shown when not playing */}
                  {!playing && (
                    <>
                      {preview.thumbnailUrl ? (
                        <Image
                          src={preview.thumbnailUrl}
                          alt={preview.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 1023px) calc(100vw - 32px), calc(100vw - 500px)"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl">🏴‍☠️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="font-display text-white text-sm leading-snug">{preview.title}</p>
                        <p className="font-mono text-white/50 text-xs mt-0.5">{preview.channelName}</p>
                      </div>
                      {preview.duration != null && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white/70 text-xs px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{fmtDuration(preview.duration)}
                        </div>
                      )}

                      {/* Play button */}
                      {preview.embedUrl && (
                        <button
                          type="button"
                          onClick={() => setPlaying(true)}
                          className="absolute inset-0 flex items-center justify-center group/play"
                          aria-label="Play clip"
                        >
                          <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-white/30 flex items-center justify-center group-hover/play:bg-teal group-hover/play:border-teal transition-all duration-200">
                            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                  <span className="font-display text-xs text-teal tracking-wider">
                    CLIP READY — {preview.platform}
                  </span>
                  {playing && (
                    <button
                      type="button"
                      onClick={() => setPlaying(false)}
                      className="ml-2 font-display text-[10px] tracking-wider text-white/30 hover:text-white/60 transition-colors"
                    >
                      ✕ CLOSE
                    </button>
                  )}
                  {preview.viewCount !== undefined && (
                    <span className="ml-auto font-mono text-xs text-white/30 flex items-center gap-1">
                      <Eye className="w-3 h-3" />{preview.viewCount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="sot-card rounded-lg border border-dashed border-[var(--border)] flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="text-4xl mb-3">🏴‍☠️</div>
                <p className="font-display text-sm tracking-wider text-white/20">NO CLIP SELECTED</p>
                <p className="font-mono text-xs text-white/15 mt-1">Select a clip to preview it here</p>
              </div>
            )}
          </section>

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-teal-solid w-full py-4 rounded text-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </span>
            ) : 'Submit Clip'}
          </button>
        </div>

        {/* ── RIGHT: Tags (sticky, scrollable) ── */}
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto space-y-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.3em] text-teal mb-0.5">STEP 02</p>
            <h2 className="font-display text-lg tracking-wider text-white/80">
              CHOOSE TAGS{' '}
              <span className="text-white/25 font-mono normal-case text-xs tracking-normal font-normal">
                (up to 5)
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {TAG_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="font-display text-[10px] tracking-widest text-white/25 mb-2">
                  {cat.label.toUpperCase()}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      disabled={tags.length >= 5 && !tags.includes(t)}
                      className={`transition-all ${
                        tags.includes(t)
                          ? 'opacity-100 scale-105 ring-1 ring-teal/30 rounded-sm'
                          : tags.length >= 5
                          ? 'opacity-15 cursor-not-allowed'
                          : 'opacity-30 hover:opacity-70'
                      }`}
                    >
                      <TagBadge tag={t} small />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5">
              <span className="font-display text-[10px] text-white/30 tracking-wider">SELECTED:</span>
              {tags.map(t => (
                <button key={t} type="button" onClick={() => toggleTag(t)} className="group relative">
                  <TagBadge tag={t} small />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-2.5 h-2.5 text-white" />
                  </span>
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] text-white/20">{tags.length}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Clip picker modal */}
      {pickerOpen && (
        <ClipPickerModal
          onSelect={handlePickerSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
