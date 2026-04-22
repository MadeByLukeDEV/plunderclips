// src/app/streamers/[login]/page.tsx
// SERVER COMPONENT — fully crawlable by Google
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ClipCard } from '@/components/clips/ClipCard';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Film, TrendingUp, ExternalLink, ArrowLeft, Radio } from 'lucide-react';
import { StreamerClipFilter } from '@/components/streamers/StreamerClipFilter';

interface Props { params: Promise<{ login: string }> }

const TAG_READABLE: Record<string, string> = {
  FUNNY: 'Funny Moments', KILL: 'Kill Clips', TUCK: 'Tuck Clips',
  HIGHLIGHT: 'Highlights', PVP: 'PvP Clips', PVE: 'PvE Clips',
  SAILING: 'Sailing Clips', TREASURE: 'Treasure Clips', KEG: 'Keg Clips',
  KRAKEN: 'Kraken Clips', MEGALODON: 'Megalodon Clips', EPIC_FAIL: 'Epic Fails',
  TEAM_PLAY: 'Team Play', SOLO: 'Solo Clips', SIREN: 'Siren Clips',
  BOSS_FIGHT: 'Boss Fights',
};

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN:     { label: 'Captain',    cls: 'text-red-400 border-red-400/30 bg-red-400/10' },
  PARTNER:   { label: 'Partner',    cls: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
  MODERATOR: { label: 'First Mate', cls: 'text-green-400 border-green-400/30 bg-green-400/10' },
  SUPPORTER: { label: 'Bilge Rat',  cls: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  USER:      { label: 'Crew',       cls: 'text-gray-300 border-gray-400/20 bg-gray-400/10' },
};

const LIVE_ROLES = ['PARTNER', 'ADMIN'];

// ─── Data fetcher ─────────────────────────────────────────────────────────────
async function getStreamerData(login: string) {
  const user = await prisma.user.findUnique({
    where: { twitchLogin: login.toLowerCase() },
    select: {
      id: true, twitchLogin: true, displayName: true,
      profileImage: true, role: true,
      isLive: true, streamTitle: true, streamGame: true, viewerCount: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [clips, totalViews] = await Promise.all([
    prisma.clip.findMany({
      where: { broadcasterName: login.toLowerCase(), status: 'APPROVED' },
      include: { tags: true },
      orderBy: { viewCount: 'desc' },
    }),
    prisma.clip.aggregate({
      where: { broadcasterName: login.toLowerCase(), status: 'APPROVED' },
      _sum: { viewCount: true },
    }),
  ]);

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  for (const clip of clips) {
    for (const t of clip.tags) {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    user,
    clips,
    stats: {
      totalClips: clips.length,
      totalViews: totalViews._sum.viewCount || 0,
      topTags,
    },
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { login } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const data = await getStreamerData(login);

  if (!data) return { title: 'Streamer Not Found — PlunderClips' };

  const { user, stats } = data;
  const tagText = stats.topTags
    .slice(0, 3)
    .map(t => TAG_READABLE[t] || t)
    .join(', ');

  const title = `${user.displayName} Sea of Thieves Clips | PlunderClips`;
  const description = `Watch ${stats.totalClips} Sea of Thieves clip${stats.totalClips !== 1 ? 's' : ''} from ${user.displayName} on PlunderClips — ${stats.totalViews.toLocaleString('en-US')} total views${tagText ? `. Known for ${tagText}` : ''}. Discover ${user.displayName}'s best SoT moments.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/streamers/${user.twitchLogin}` },
    openGraph: {
      title,
      description,
      url: `${base}/streamers/${user.twitchLogin}`,
      siteName: 'PlunderClips',
      type: 'profile',
      images: user.profileImage
        ? [{ url: user.profileImage, width: 300, height: 300, alt: user.displayName }]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: user.profileImage ? [user.profileImage] : [],
    },
  };
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function StreamerJsonLd({ user, stats, pageUrl, base }: {
  user: any; stats: any; pageUrl: string; base: string;
}) {
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.displayName,
    alternateName: `@${user.twitchLogin}`,
    url: pageUrl,
    image: user.profileImage || undefined,
    sameAs: [`https://www.twitch.tv/${user.twitchLogin}`],
    description: `${user.displayName} is a Sea of Thieves streamer on PlunderClips with ${stats.totalClips} clips.`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Streamers', item: `${base}/streamers` },
      { '@type': 'ListItem', position: 3, name: user.displayName, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StreamerPage({ params }: Props) {
  const { login } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const pageUrl = `${base}/streamers/${login}`;

  const data = await getStreamerData(login);

  if (!data) {
    return (
      <div className="text-center py-24 max-w-md mx-auto px-6">
        <p className="font-display text-4xl text-white/20 mb-3">UNKNOWN WATERS</p>
        <p className="text-white/30 text-sm mb-6">This streamer hasn't registered on PlunderClips yet.</p>
        <Link href="/" className="btn-teal px-6 py-2 rounded text-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />Back to Explore
        </Link>
      </div>
    );
  }

  const { user, clips, stats } = data;
  const isLive = user.isLive && LIVE_ROLES.includes(user.role);
  const roleBadge = ROLE_BADGE[user.role] || ROLE_BADGE.USER;

  // Top 4 clips for server render — rest handled by client filter
  const topClips = clips.slice(0, 4);

  const tagText = stats.topTags.slice(0, 3).map((t: string) => TAG_READABLE[t] || t).join(', ');
  const tagLinks = stats.topTags.slice(0, 3);

  return (
    <>
      <StreamerJsonLd user={user} stats={stats} pageUrl={pageUrl} base={base} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <Link href="/" className="hover:text-teal transition-colors">PlunderClips</Link>
          <span>/</span>
          <Link href="/streamers" className="hover:text-teal transition-colors">Streamers</Link>
          <span>/</span>
          <span className="text-white/40">{user.displayName}</span>
        </nav>

        {/* Live embed */}
        {isLive && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-display text-sm text-red-400 tracking-widest">LIVE NOW</span>
              {user.viewerCount != null && (
                <span className="text-white/30 font-mono text-xs ml-1">{user.viewerCount.toLocaleString('en-US')} viewers</span>
              )}
              {user.streamGame && <span className="text-white/20 font-mono text-xs">· {user.streamGame}</span>}
            </div>
            {user.streamTitle && <p className="text-white/50 text-sm font-body mb-3 truncate">{user.streamTitle}</p>}
            <div className="relative w-full rounded overflow-hidden bg-sot-dark" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://player.twitch.tv/?channel=${user.twitchLogin}&parent=${new URL(base).hostname}&autoplay=false`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                title={`${user.displayName} live stream`}
              />
            </div>
          </div>
        )}

        {/* Profile header */}
        <div className={`sot-card rounded p-5 md:p-7 mb-6 ${isLive ? 'border border-red-500/20' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              {user.profileImage ? (
                <Image src={user.profileImage} alt={`${user.displayName} profile picture`}
                  width={80} height={80}
                  className={`rounded border-2 ${isLive ? 'border-red-500/50' : 'border-teal/40'}`}
                  style={{ objectFit: 'cover' }} />
              ) : (
                <div className="w-20 h-20 rounded border-2 border-teal/20 bg-sot-dark flex items-center justify-center text-3xl">🏴‍☠️</div>
              )}
              {isLive && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 border-2 border-sot-bg animate-pulse block" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* H1 — optimized for "[name] clips" searches */}
              <h1 className="font-display text-3xl md:text-4xl font-900 text-white leading-none mb-2">
                {user.displayName}
              </h1>
              <p className="font-mono text-white/30 text-xs mb-3">@{user.twitchLogin}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border ${roleBadge.cls}`}>
                  {roleBadge.label}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-display tracking-wider border border-red-500/30 bg-red-500/10 text-red-400">
                    <Radio className="w-3 h-3 animate-pulse" />LIVE
                  </span>
                )}
                {stats.topTags.slice(0, 3).map((t: string) => (
                  <TagBadge key={t} tag={t} small />
                ))}
              </div>
            </div>

            <a href={`https://twitch.tv/${user.twitchLogin}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/30 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />Twitch
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Clips',        value: stats.totalClips,                  icon: <Film className="w-4 h-4" />,       cls: 'text-teal' },
            { label: 'Total Views',  value: stats.totalViews.toLocaleString('en-US'), icon: <Eye className="w-4 h-4" />,        cls: 'text-white/60' },
            { label: 'Top Tag',      value: stats.topTags[0] ?? '—',           icon: <TrendingUp className="w-4 h-4" />, cls: 'text-white/60', small: true },
          ].map(s => (
            <div key={s.label} className="stat-card rounded p-4 text-center">
              <div className={`flex justify-center mb-1 ${s.cls}`}>{s.icon}</div>
              <div className={`font-display font-900 ${(s as any).small ? 'text-lg' : 'text-3xl'} ${s.cls}`}>{s.value}</div>
              <div className="text-white/25 text-xs font-display tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SEO intro — crawlable text, avoids thin content */}
        {stats.totalClips > 0 && (
          <div className="sot-card rounded p-5 mb-8 text-white/35 text-sm font-body leading-relaxed">
            <p>
              <strong className="text-white/60">{user.displayName}</strong> is a Sea of Thieves streamer
              on PlunderClips with <strong className="text-white/50">{stats.totalClips} approved clip{stats.totalClips !== 1 ? 's' : ''}</strong> and{' '}
              <strong className="text-white/50">{stats.totalViews.toLocaleString('en-US')} total views</strong>.
              {tagText && (
                <> Known for {tagText} content,{' '}
                  {user.displayName}'s collection covers some of the finest Sea of Thieves moments
                  from the seven seas.</>
              )}
              {tagLinks.length > 0 && (
                <> Browse {user.displayName}'s clips by category:{' '}
                  {tagLinks.map((t: string, i: number) => (
                    <span key={t}>
                      {i > 0 && ', '}
                      <Link href={`/?tag=${t}`}
                        className="text-teal/70 hover:text-teal transition-colors">
                        {TAG_READABLE[t] || t}
                      </Link>
                    </span>
                  ))}.
                </>
              )}
            </p>
          </div>
        )}

        {/* Clips section — top 4 server rendered for SEO, rest client filtered */}
        {clips.length === 0 ? (
          <div className="text-center py-20 sot-card rounded">
            <p className="font-display text-3xl text-white/20 mb-2">NO CLIPS YET</p>
            <p className="text-white/20 text-sm font-body">No approved clips from this streamer yet.</p>
          </div>
        ) : (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-lg font-700 text-white tracking-wide">
                {user.displayName}'s Clips
              </h2>
              <div className="flex-1 teal-divider" />
            </div>

            {/* Top clips — server rendered, immediately crawlable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
              {topClips.map(clip => (
                <ClipCard key={clip.id} clip={clip as any} />
              ))}
            </div>

            {/* Client component handles sort/filter + remaining clips */}
            {clips.length > 4 && (
              <StreamerClipFilter
                clips={clips as any[]}
                displayName={user.displayName}
                shownIds={new Set(topClips.map(c => c.id))}
              />
            )}
          </section>
        )}

        {/* Internal links — other streamers discovery */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs font-mono mb-3">DISCOVER MORE</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/" className="text-white/30 hover:text-teal text-sm font-display tracking-wider transition-colors">
              Explore All Clips →
            </Link>
            <Link href="/streamers" className="text-white/30 hover:text-teal text-sm font-display tracking-wider transition-colors">
              All Streamers →
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}