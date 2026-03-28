// src/app/submit/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { TAG_LABELS } from '@/components/ui/TagBadge';
import toast from 'react-hot-toast';
import { CheckCircle, Link as LinkIcon, Loader2, Eye, Clock, Youtube, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ALL_TAGS = Object.keys(TAG_LABELS);

type Platform = 'TWITCH' | 'YOUTUBE' | 'MEDAL' | null;

function detectPlatform(url: string): Platform {
  if (/clips\.twitch\.tv|twitch\.tv\/.+\/clip\//i.test(url)) return 'TWITCH';
  if (/youtube\.com\/(watch|shorts\/)|youtu\.be\//i.test(url)) return 'YOUTUBE';
  if (/medal\.tv/i.test(url)) return 'MEDAL';
  return null;
}

function PlatformHint({ platform, user }: { platform: Platform; user: any }) {
  if (!platform || platform === 'TWITCH') return null;
  if (platform === 'YOUTUBE' && !user?.youtubeChannelId) return (
    <div className="sot-card rounded p-3 border-l-2 border-l-yellow-400/50 flex items-start gap-2 text-sm">
      <Youtube className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      <span className="text-white/50">
        You haven't linked a YouTube channel. The clip will be flagged for manual review.{' '}
        <Link href="/settings" className="text-teal hover:underline">Link it in Settings →</Link>
      </span>
    </div>
  );
  if (platform === 'MEDAL') return (
    <div className="sot-card rounded p-3 border-l-2 border-l-yellow-400/50 flex items-start gap-2 text-sm">
      <span className="text-yellow-400 flex-shrink-0">🏅</span>
      <span className="text-white/50">
        Medal.tv clips are always sent to manual review — our crew will verify the clip before it goes live.
      </span>
    </div>
  );
  return null;
}

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const platform = detectPlatform(url);

  useEffect(() => {
    if (!url || !platform) { setPreview(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      setPreview(null);
      try {
        const res = await fetch(`/api/clips/preview?url=${encodeURIComponent(url)}`);
        if (res.ok) setPreview(await res.json());
      } catch {}
      finally { setPreviewLoading(false); }
    }, 700);
  }, [url, platform]);

  if (loading) return (
    <div className="max-w-xl mx-auto px-6 py-20 space-y-4">
      <div className="skeleton h-8 w-48 rounded" /><div className="skeleton h-40 rounded" />
    </div>
  );

  if (!user) return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <p className="font-display text-4xl text-white/20 mb-6">ACCESS DENIED</p>
      <a href="/api/auth/login" className="btn-teal-solid px-6 py-3 rounded inline-block">Sign in with Twitch</a>
    </div>
  );

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error('Enter a clip URL');
    if (!tags.length) return toast.error('Select at least one tag');
    if (!platform) return toast.error('Unsupported URL. Use Twitch, YouTube, or Medal.tv links.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: url, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(true);
      toast.success('Clip submitted for review!');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <CheckCircle className="w-14 h-14 text-teal mx-auto mb-6" />
      <h1 className="font-display text-4xl text-white mb-2">Clip Received</h1>
      <p className="text-white/40 text-sm mb-8 font-body">Your clip is awaiting review by the crew.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setSuccess(false); setUrl(''); setTags([]); setPreview(null); }}
          className="btn-teal px-5 py-2.5 rounded text-sm">Submit Another</button>
        <button onClick={() => router.push('/dashboard')}
          className="btn-teal-solid px-5 py-2.5 rounded text-sm">View Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">NEW SUBMISSION</p>
        <h1 className="font-display text-5xl font-900 text-white">Submit a Clip</h1>
        <div className="teal-divider mt-3" />
      </div>

      {/* Rules */}
      <div className="sot-card rounded p-4 mb-6 border-l-2 border-l-teal">
        <p className="font-display text-xs text-teal tracking-widest mb-2">SUPPORTED PLATFORMS</p>
        <ul className="text-sm text-white/40 space-y-1 font-body">
          <li>→ Twitch clips (clips.twitch.tv or twitch.tv/.../clip/...)</li>
          <li>→ YouTube videos (youtube.com/watch or youtu.be/...)</li>
          <li>→ Medal.tv clips (medal.tv/games/.../clips/...)</li>
          <li>→ Clip must be from Sea of Thieves</li>
          <li>→ The streamer must be registered on this platform</li>
          <li>→ All submissions are reviewed before going live</li>
        </ul>
      </div>

      <div className="space-y-5">
        {/* URL input */}
        <div>
          <label className="block font-display text-xs tracking-widest text-white/50 mb-2">CLIP URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required
              placeholder="Paste a Twitch, YouTube, or Medal.tv URL..."
              className="w-full bg-sot-card border border-white/10 text-white placeholder-white/20 rounded pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-teal/50 transition-colors" />
          </div>
          {/* Platform indicator */}
          {platform && (
            <p className="mt-1.5 text-xs font-display tracking-wider text-white/30">
              Detected:{' '}
              <span className={platform === 'TWITCH' ? 'text-purple-400' : platform === 'YOUTUBE' ? 'text-red-400' : 'text-yellow-400'}>
                {platform}
              </span>
            </p>
          )}
        </div>

        {/* Platform hint for unlinked accounts */}
        <PlatformHint platform={platform} user={user} />

        {/* Live preview */}
        {previewLoading && (
          <div className="sot-card rounded p-4 flex items-center gap-3 text-white/30 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-teal" />
            <span className="font-display tracking-wider text-xs">FETCHING CLIP...</span>
          </div>
        )}

        {preview && !previewLoading && (
          <div className="sot-card rounded overflow-hidden border border-teal/20">
            <div className="relative aspect-video bg-sot-dark overflow-hidden">
              {preview.thumbnailUrl ? (
                <Image src={preview.thumbnailUrl} alt={preview.title} priority={false} objectFit='cover' layout='fill'/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🏴‍☠️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-display text-white text-sm font-700 leading-snug">{preview.title}</p>
                <p className="font-mono text-white/50 text-xs mt-0.5">{preview.channelName}</p>
              </div>
              {preview.duration && (
                <div className="absolute top-2 right-2 bg-black/70 text-white/70 text-xs px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{Math.floor(preview.duration)}s
                </div>
              )}
            </div>
            <div className="px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-teal flex-shrink-0" />
              <span className="font-display text-xs text-teal tracking-wider">CLIP FOUND — {preview.platform}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block font-display text-xs tracking-widest text-white/50 mb-2">
            TAGS <span className="text-white/20">(up to 5)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(t => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className={`px-2.5 py-1 rounded-sm text-xs font-mono border transition-all tag-${t} ${
                  tags.includes(t) ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-70'
                }`}>
                {TAG_LABELS[t]}
              </button>
            ))}
          </div>
          {tags.length > 0 && <p className="mt-2 text-xs text-white/25 font-mono">{tags.length}/5 selected</p>}
        </div>

        <button onClick={handleSubmit} disabled={submitting || !url || !tags.length || !platform}
          className="btn-teal-solid w-full py-4 rounded text-lg disabled:opacity-30">
          {submitting ? 'Submitting...' : 'Submit Clip'}
        </button>
      </div>
    </div>
  );
}