import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const clip = await prisma.clip.findUnique({
    where: { id, status: 'APPROVED' },
  });
  if (!clip) return { title: 'Clip Not Found' };
  return {
    title: `Plunderclips — ${clip.title}`,
    description: `${clip.title} — Sea of Thieves clip by ${clip.broadcasterName} on PlunderClips`,
    openGraph: {
      title: `Plunderclips — ${clip.title}`,
      description: `Watch this Sea of Thieves moment by ${clip.broadcasterName}`,
      images: clip.thumbnailUrl ? [{ url: clip.thumbnailUrl, width: 1280, height: 720 }] : [],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: clip.title,
      description: `${clip.broadcasterName} on PlunderClips`,
      images: clip.thumbnailUrl ? [clip.thumbnailUrl] : [],
    },
  };
}

export default async function ClipPage({ params }: Props) {
  const { id } = await params;
  const clip = await prisma.clip.findUnique({
    where: { id, status: 'APPROVED' },
    include: { tags: true },
  });

  if (!clip) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-teal font-display text-xs tracking-widest mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />BACK TO EXPLORE
      </Link>

      {/* Embed */}
      <div className="relative w-full rounded overflow-hidden mb-6 bg-sot-dark" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={clip.embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          title={clip.title}
          allow="autoplay; fullscreen"
        />
      </div>

      {/* Info */}
      <div className="sot-card rounded p-5 mb-4">
        <h1 className="font-display text-2xl md:text-3xl font-700 text-white leading-snug mb-2">
          {clip.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/40 font-mono mb-4">
          <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
            className="text-white/60 hover:text-teal transition-colors">
            {clip.broadcasterName}
          </Link>
          {clip.viewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />{clip.viewCount.toLocaleString()} views
            </span>
          )}
          {clip.duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />{Math.floor(clip.duration)}s
            </span>
          )}
          <a href={clip.twitchUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-teal transition-colors ml-auto">
            <ExternalLink className="w-3.5 h-3.5" />View on Twitch
          </a>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {clip.tags.map((t) => <TagBadge key={t.id} tag={t.tag} />)}
        </div>
      </div>

      {/* Submitted by */}
      <p className="text-white/20 text-xs font-mono text-right">
        Submitted by {clip.submittedByName}
      </p>
    </div>
  );
}
