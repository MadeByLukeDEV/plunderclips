// src/app/clips/[id]/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ClipCard } from '@/components/clips/ClipCard';
import { prisma } from '@/lib/prisma';
import { getClipById } from '@/modules/clips/clips.service';
import { clipSelect, toClipDTO } from '@/modules/clips/clips.helpers';
import type { ClipDTO } from '@/modules/clips/clips.types';

interface Props { params: Promise<{ id: string }> }

const TAG_READABLE: Record<string, string> = {
  FUNNY: 'Funny Moment', KILL: 'Kill Clip', TUCK: 'Tuck Clip',
  HIGHLIGHT: 'Highlight', PVP: 'PvP Clip', PVE: 'PvE Clip',
  SAILING: 'Sailing Clip', TREASURE: 'Treasure Clip', KEG: 'Keg Clip',
  KRAKEN: 'Kraken Clip', MEGALODON: 'Megalodon Clip', EPIC_FAIL: 'Epic Fail',
  TEAM_PLAY: 'Team Play', SOLO: 'Solo Clip', SIREN: 'Siren Clip',
  BOSS_FIGHT: 'Boss Fight',
};

function getPrimaryTagLabel(tags: { tag: string }[]): string {
  if (!tags.length) return 'Clip';
  return TAG_READABLE[tags[0].tag] || tags[0].tag;
}

function buildTitle(clip: Pick<ClipDTO, 'title' | 'broadcasterName' | 'tags'>): string {
  const tag = getPrimaryTagLabel(clip.tags);
  const clipTitle = clip.title.length > 40 ? clip.title.slice(0, 40) + '…' : clip.title;
  return `${clipTitle} — SoT ${tag} by ${clip.broadcasterName} | PlunderClips`;
}

function buildDescription(clip: Pick<ClipDTO, 'title' | 'broadcasterName' | 'viewCount' | 'tags'>): string {
  const tagWords = clip.tags.slice(0, 3).map(t => TAG_READABLE[t.tag] || t.tag).join(', ');
  const views = clip.viewCount > 0 ? ` · ${clip.viewCount.toLocaleString('en-US')} views` : '';
  return `Watch ${clip.broadcasterName}'s Sea of Thieves clip "${clip.title}" on PlunderClips${views}. Tagged: ${tagWords || 'Sea of Thieves'}. Discover the finest SoT moments from the seven seas.`;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';

  const clip = await getClipById(id);
  if (!clip || clip.moderation?.status !== 'APPROVED') return { title: 'Clip Not Found — PlunderClips' };

  const title = buildTitle(clip);
  const description = buildDescription(clip);

  return {
    title,
    description,
    alternates: { canonical: `${base}/clips/${id}` },
    openGraph: {
      title, description, url: `${base}/clips/${id}`,
      siteName: 'PlunderClips', type: 'video.other',
      images: clip.thumbnailUrl
        ? [{ url: clip.thumbnailUrl, width: 1280, height: 720, alt: clip.title }]
        : [],
      videos: clip.sourceUrl ? [{ url: clip.sourceUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: clip.thumbnailUrl ? [clip.thumbnailUrl] : [],
    },
  };
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function VideoJsonLd({ clip, pageUrl }: { clip: ClipDTO; pageUrl: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: clip.title,
    description: buildDescription(clip),
    thumbnailUrl: clip.thumbnailUrl || undefined,
    uploadDate: new Date(clip.createdAt).toISOString(),
    duration: clip.duration ? `PT${Math.floor(clip.duration)}S` : undefined,
    contentUrl: clip.sourceUrl,
    embedUrl: clip.embedUrl,
    url: pageUrl,
    interactionStatistic: clip.viewCount > 0
      ? { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WatchAction', userInteractionCount: clip.viewCount }
      : undefined,
    author: {
      '@type': 'Person',
      name: clip.broadcasterName,
      url: `https://www.twitch.tv/${clip.broadcasterName.toLowerCase()}`,
    },
    publisher: { '@type': 'Organization', name: 'PlunderClips', url: pageUrl.split('/clips')[0] },
    keywords: ['Sea of Thieves', 'SoT clip', clip.broadcasterName, ...clip.tags.map(t => TAG_READABLE[t.tag] || t.tag)].join(', '),
    genre: 'Gaming',
    inLanguage: 'en',
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function BreadcrumbJsonLd({ clip, pageUrl, base }: { clip: ClipDTO; pageUrl: string; base: string }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base },
        { '@type': 'ListItem', position: 2, name: clip.broadcasterName, item: `${base}/streamers/${clip.broadcasterName.toLowerCase()}` },
        { '@type': 'ListItem', position: 3, name: clip.title, item: pageUrl },
      ],
    }) }} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ClipPage({ params }: Props) {
  const { id } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const pageUrl = `${base}/clips/${id}`;

  const clip = await getClipById(id);
  if (!clip || clip.moderation?.status !== 'APPROVED') notFound();

  // Related clips — same broadcaster, exclude current, ordered by views
  const relatedRaw = await prisma.clip.findMany({
    where: {
      moderation: { status: 'APPROVED' },
      broadcasterName: clip.broadcasterName,
      id: { not: id },
    },
    select: clipSelect,
    orderBy: { stats: { viewCount: 'desc' } },
    take: 4,
  });

  // Top-up with same-tag clips if fewer than 4
  const relatedIds = new Set([id, ...relatedRaw.map(c => c.id)]);
  const tagFillRaw = relatedRaw.length < 4 && clip.tags.length > 0
    ? await prisma.clip.findMany({
        where: {
          moderation: { status: 'APPROVED' },
          id: { notIn: [...relatedIds] },
          tags: { some: { tag: clip.tags[0].tag } },
        },
        select: clipSelect,
        orderBy: { stats: { viewCount: 'desc' } },
        take: 4 - relatedRaw.length,
      })
    : [];

  const allRelated: ClipDTO[] = [...relatedRaw, ...tagFillRaw].map(toClipDTO);
  const primaryTag = getPrimaryTagLabel(clip.tags);

  return (
    <>
      <VideoJsonLd clip={clip} pageUrl={pageUrl} />
      <BreadcrumbJsonLd clip={clip} pageUrl={pageUrl} base={base} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link href="../" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Explore
        </Link>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <Link href="/" className="hover:text-teal transition-colors">PlunderClips</Link>
          <span>/</span>
          <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`} className="hover:text-teal transition-colors">
            {clip.broadcasterName}
          </Link>
          <span>/</span>
          <span className="text-white/40 truncate max-w-[200px]">{clip.title}</span>
        </nav>

        <div className="relative w-full rounded overflow-hidden mb-6 bg-sot-dark" style={{ paddingBottom: '56.25%' }}>
          <iframe src={clip.embedUrl} className="absolute inset-0 w-full h-full"
            allowFullScreen title={clip.title} allow="autoplay; fullscreen" />
        </div>

        <div className="sot-card rounded p-5 mb-4">
          <h1 className="font-display text-2xl md:text-3xl font-700 text-white leading-snug mb-2">
            {clip.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/40 font-mono mb-4">
            <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
              className="text-white/60 hover:text-teal transition-colors font-display text-sm font-700">
              {clip.broadcasterName}
            </Link>
            {clip.viewCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />{clip.viewCount.toLocaleString('en-US')} views
              </span>
            )}
            {clip.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />{Math.floor(clip.duration)}s
              </span>
            )}
            <a href={clip.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-teal transition-colors ml-auto">
              <ExternalLink className="w-3.5 h-3.5" />
              View on {clip.platform === 'YOUTUBE' ? 'YouTube' : clip.platform === 'TWITCH' ? 'Twitch' : 'MedalTV'}
            </a>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {clip.tags.map((t) => (
              <Link key={t.tag} href={`/?tag=${t.tag}`}>
                <TagBadge tag={t.tag} />
              </Link>
            ))}
          </div>
        </div>

        <div className="sot-card rounded p-5 mb-8 text-white/30 text-sm font-body leading-relaxed">
          <p>
            <strong className="text-white/50">{clip.title}</strong> is a Sea of Thieves {primaryTag.toLowerCase()} clip
            from <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
              className="text-teal/70 hover:text-teal transition-colors">{clip.broadcasterName}</Link> shared
            on PlunderClips — a community platform for Sea of Thieves streamers to showcase their best moments.
            {clip.tags.length > 1 && (
              <> This clip is tagged as {clip.tags.map((t, i) => (
                <span key={t.tag}>{i > 0 ? ', ' : ''}{TAG_READABLE[t.tag] || t.tag}</span>
              ))}.</>
            )}
            {' '}Submitted by {clip.submittedByName}.
          </p>
        </div>

        {allRelated.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-lg font-700 text-white tracking-wide">
                More from {clip.broadcasterName}
              </h2>
              <div className="flex-1 teal-divider" />
              <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
                className="text-teal text-xs font-display tracking-wider hover:underline flex-shrink-0">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allRelated.slice(0, 4).map(related => (
                <ClipCard key={related.id} clip={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
