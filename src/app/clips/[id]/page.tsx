// src/app/clips/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ClipCard } from '@/components/clips/ClipCard';

interface Props { params: Promise<{ id: string }> }

// ─── Tag → human readable ─────────────────────────────────────────────────────
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

function buildTitle(clip: { title: string; broadcasterName: string; tags: { tag: string }[] }): string {
  const tag = getPrimaryTagLabel(clip.tags);
  // Cap title length for Google (60 chars ideal)
  const clipTitle = clip.title.length > 40 ? clip.title.slice(0, 40) + '…' : clip.title;
  return `${clipTitle} — SoT ${tag} by ${clip.broadcasterName} | PlunderClips`;
}

function buildDescription(clip: {
  title: string; broadcasterName: string;
  viewCount: number; tags: { tag: string }[];
}): string {
  const tagWords = clip.tags
    .slice(0, 3)
    .map(t => TAG_READABLE[t.tag] || t.tag)
    .join(', ');
  const views = clip.viewCount > 0 ? ` · ${clip.viewCount.toLocaleString()} views` : '';
  return `Watch ${clip.broadcasterName}'s Sea of Thieves clip "${clip.title}" on PlunderClips${views}. Tagged: ${tagWords || 'Sea of Thieves'}. Discover the finest SoT moments from the seven seas.`;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';

  const clip = await prisma.clip.findUnique({
    where: { id, status: 'APPROVED' },
    include: { tags: true },
  });

  if (!clip) return { title: 'Clip Not Found — PlunderClips' };

  const title = buildTitle(clip);
  const description = buildDescription(clip);

  return {
    title,
    description,

    alternates: {
      canonical: `${base}/clips/${id}`,
    },

    openGraph: {
      title,
      description,
      url: `${base}/clips/${id}`,
      siteName: 'PlunderClips',
      type: 'video.other',
      images: clip.thumbnailUrl
        ? [{ url: clip.thumbnailUrl, width: 1280, height: 720, alt: clip.title }]
        : [],
      videos: clip.twitchUrl ? [{ url: clip.twitchUrl }] : [],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: clip.thumbnailUrl ? [clip.thumbnailUrl] : [],
    },
  };
}

// ─── JSON-LD VideoObject ──────────────────────────────────────────────────────
function VideoJsonLd({ clip, pageUrl }: {
  clip: {
    id: string; title: string; broadcasterName: string;
    thumbnailUrl: string | null; twitchUrl: string; embedUrl: string;
    viewCount: number; duration: number | null; createdAt: Date;
    tags: { tag: string }[];
  };
  pageUrl: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: clip.title,
    description: buildDescription({ ...clip, tags: clip.tags }),
    thumbnailUrl: clip.thumbnailUrl || undefined,
    uploadDate: clip.createdAt.toISOString(),
    duration: clip.duration ? `PT${Math.floor(clip.duration)}S` : undefined,
    contentUrl: clip.twitchUrl,
    embedUrl: clip.embedUrl,
    url: pageUrl,
    interactionStatistic: clip.viewCount > 0
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/WatchAction',
          userInteractionCount: clip.viewCount,
        }
      : undefined,
    author: {
      '@type': 'Person',
      name: clip.broadcasterName,
      url: `https://www.twitch.tv/${clip.broadcasterName.toLowerCase()}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PlunderClips',
      url: pageUrl.split('/clips')[0],
    },
    keywords: [
      'Sea of Thieves',
      'SoT clip',
      clip.broadcasterName,
      ...clip.tags.map(t => TAG_READABLE[t.tag] || t.tag),
    ].join(', '),
    genre: 'Gaming',
    inLanguage: 'en',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── BreadcrumbList JSON-LD ───────────────────────────────────────────────────
function BreadcrumbJsonLd({ clip, pageUrl, base }: {
  clip: { title: string; broadcasterName: string };
  pageUrl: string; base: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: clip.broadcasterName, item: `${base}/streamers/${clip.broadcasterName.toLowerCase()}` },
      { '@type': 'ListItem', position: 3, name: clip.title, item: pageUrl },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ClipPage({ params }: Props) {
  const { id } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const pageUrl = `${base}/clips/${id}`;

  const clip = await prisma.clip.findUnique({
    where: { id, status: 'APPROVED' },
    include: { tags: true },
  });

  if (!clip) notFound();

  // Related clips — same broadcaster, exclude current
  const relatedClips = await prisma.clip.findMany({
    where: {
      status: 'APPROVED',
      broadcasterName: clip.broadcasterName,
      id: { not: id },
    },
    include: { tags: true },
    orderBy: { viewCount: 'desc' },
    take: 4,
  });

  // If fewer than 4 related, top up with same-tag clips
  const relatedIds = new Set([id, ...relatedClips.map(c => c.id)]);
  const tagFill = relatedClips.length < 4 && clip.tags.length > 0
    ? await prisma.clip.findMany({
        where: {
          status: 'APPROVED',
          id: { notIn: [...relatedIds] },
          tags: { some: { tag: clip.tags[0].tag } },
        },
        include: { tags: true },
        orderBy: { viewCount: 'desc' },
        take: 4 - relatedClips.length,
      })
    : [];

  const allRelated = [...relatedClips, ...tagFill];
  const primaryTag = getPrimaryTagLabel(clip.tags);

  return (
    <>
      {/* JSON-LD structured data */}
      <VideoJsonLd clip={clip} pageUrl={pageUrl} />
      <BreadcrumbJsonLd clip={clip} pageUrl={pageUrl} base={base} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
<Link href="../" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Explore
        </Link>
        {/* Breadcrumb — visible + semantic */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <Link href="/" className="hover:text-teal transition-colors">PlunderClips</Link>
          <span>/</span>
          <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`} className="hover:text-teal transition-colors">
            {clip.broadcasterName}
          </Link>
          <span>/</span>
          <span className="text-white/40 truncate max-w-[200px]">{clip.title}</span>
        </nav>

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

        {/* Info card */}
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
              <ExternalLink className="w-3.5 h-3.5" />View on ${clip.platform === 'YOUTUBE' ? 'YouTube' : clip.platform === 'TWITCH' ? 'Twitch' : 'MedalTV'}
            </a>
          </div>

          {/* Tags — now linked to filtered explore */}
          <div className="flex flex-wrap gap-1.5">
            {clip.tags.map((t) => (
              <Link key={t.id} href={`/?tag=${t.tag}`}>
                <TagBadge tag={t.tag} />
              </Link>
            ))}
          </div>
        </div>

        {/* SEO text block — gives Google something to read, helps thin content */}
        <div className="sot-card rounded p-5 mb-8 text-white/30 text-sm font-body leading-relaxed">
          <p>
            <strong className="text-white/50">{clip.title}</strong> is a Sea of Thieves {primaryTag.toLowerCase()} from <Link href={`/streamers/${clip.broadcasterName.toLowerCase()}`}
              className="text-teal/70 hover:text-teal transition-colors">{clip.broadcasterName}</Link> shared
            on PlunderClips — a community platform for Sea of Thieves streamers to showcase their best moments.
            {clip.tags.length > 1 && (
              <> This clip is tagged as {clip.tags.map((t, i) => (
                <span key={t.id}>{i > 0 ? ', ' : ''}{TAG_READABLE[t.tag] || t.tag}</span>
              ))}.</>
            )}
            {' '}Submitted by {clip.submittedByName}.
          </p>
        </div>

        {/* Related clips — reduces bounce, increases session depth */}
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
                <ClipCard key={related.id} clip={related as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}