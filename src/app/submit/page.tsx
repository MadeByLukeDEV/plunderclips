'use client';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { TAG_LABELS } from '@/components/ui/TagBadge';
import toast from 'react-hot-toast';
import { CheckCircle, Link as LinkIcon } from 'lucide-react';

const ALL_TAGS = Object.keys(TAG_LABELS);

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (loading) return (
    <div className="max-w-xl mx-auto px-6 py-20 space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-40 rounded" />
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitchUrl: url, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(true);
      toast.success('Clip submitted for review!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <CheckCircle className="w-14 h-14 text-teal mx-auto mb-6" />
      <h1 className="font-display text-4xl text-white mb-2">Clip Received</h1>
      <p className="text-white/40 text-sm mb-8 font-body">Your clip is awaiting review by the crew.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setSuccess(false); setUrl(''); setTags([]); }}
          className="btn-teal px-5 py-2.5 rounded text-sm">Submit Another</button>
        <button onClick={() => router.push('/dashboard')}
          className="btn-teal-solid px-5 py-2.5 rounded text-sm">View Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-2">NEW SUBMISSION</p>
        <h1 className="font-display text-5xl font-900 text-white">Submit a Clip</h1>
        <div className="teal-divider mt-3" />
      </div>

      {/* Rules */}
      <div className="sot-card rounded p-4 mb-8 border-l-2 border-l-teal">
        <p className="font-display text-xs text-teal tracking-widest mb-2">REQUIREMENTS</p>
        <ul className="text-sm text-white/40 space-y-1 font-body">
          <li>→ Clip must be from Sea of Thieves</li>
          <li>→ The streamer must be registered on this platform</li>
          <li>→ Twitch clip URLs only (clips.twitch.tv or twitch.tv/.../clip/...)</li>
          <li>→ All submissions are reviewed before going live</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-display text-xs tracking-widest text-white/50 mb-2">CLIP URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required
              placeholder="https://www.twitch.tv/username/clip/..."
              className="w-full bg-sot-card border border-white/10 text-white placeholder-white/20 rounded pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-teal/50 transition-colors" />
          </div>
        </div>

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
          {tags.length > 0 && (
            <p className="mt-2 text-xs text-white/25 font-mono">{tags.length}/5 selected</p>
          )}
        </div>

        <button type="submit" disabled={submitting || !url || !tags.length}
          className="btn-teal-solid w-full py-4 rounded text-lg disabled:opacity-30">
          {submitting ? 'Submitting...' : 'Submit Clip'}
        </button>
      </form>
    </div>
  );
}