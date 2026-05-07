// src/app/streamers/[login]/page.tsx — SERVER COMPONENT
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ClipCard } from '@/components/clips/ClipCard';
import { TagBadge } from '@/components/ui/TagBadge';
import { Eye, Film, TrendingUp, ExternalLink, ArrowLeft, Radio } from 'lucide-react';
import { StreamerClipFilter } from '@/components/streamers/StreamerClipFilter';
import { getStreamer } from '@/modules/streamers/streamers.service';
import { LIVE_ROLES } from '@/modules/live/live.service';
import type { ClipDTO } from '@/modules/clips/clips.types';

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

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { login } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const data = await getStreamer(login);
  if (!data) return { title: 'Streamer Not Found — PlunderClips' };

  const { streamer, stats } = data;
  const tagText = stats.topTags.slice(0, 3).map(t => TAG_READABLE[t] || t).join(', ');
  const title = `${streamer.displayName} Sea of Thieves Clips | PlunderClips`;
  const description = `Watch ${stats.totalClips} Sea of Thieves clip${stats.totalClips !== 1 ? 's' : ''} from ${streamer.displayName} on PlunderClips — ${stats.totalViews.toLocaleString('en-US')} total views${tagText ? `. Known for ${tagText}` : ''}. Discover ${streamer.displayName}'s best SoT moments.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/streamers/${streamer.twitchLogin}` },
    openGraph: {
      title, description, url: `${base}/streamers/${streamer.twitchLogin}`,
      siteName: 'PlunderClips', type: 'profile',
      images: streamer.profileImage
        ? [{ url: streamer.profileImage, width: 300, height: 300, alt: streamer.displayName }]
        : [],
    },
    twitter: {
      card: 'summary', title, description,
      images: streamer.profileImage ? [streamer.profileImage] : [],
    },
  };
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function StreamerJsonLd({ streamer, stats, pageUrl, base }: {
  streamer: { displayName: string; twitchLogin: string; profileImage: string | null };
  stats: { totalClips: number };
  pageUrl: string;
  base: string;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Person',
        name: streamer.displayName,
        alternateName: `@${streamer.twitchLogin}`,
        url: pageUrl,
        image: streamer.profileImage || undefined,
        sameAs: [`https://www.twitch.tv/${streamer.twitchLogin}`],
        description: `${streamer.displayName} is a Sea of Thieves streamer on PlunderClips with ${stats.totalClips} clips.`,
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: base },
          { '@type': 'ListItem', position: 2, name: 'Streamers', item: `${base}/streamers` },
          { '@type': 'ListItem', position: 3, name: streamer.displayName, item: pageUrl },
        ],
      }) }} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function StreamerPage({ params }: Props) {
  const { login } = await params;
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const pageUrl = `${base}/streamers/${login}`;

  const data = await getStreamer(login);
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

  const { streamer, clips, stats } = data;
  const isLive = streamer.isLive && LIVE_ROLES.includes(streamer.role);
  const roleBadge = ROLE_BADGE[streamer.role] || ROLE_BADGE.USER;
  const topClips = clips.slice(0, 4);
  const tagText = stats.topTags.slice(0, 3).map((t: string) => TAG_READABLE[t] || t).join(', ');
  const tagLinks = stats.topTags.slice(0, 3);

  return (
    <>
      <StreamerJsonLd streamer={streamer} stats={stats} pageUrl={pageUrl} base={base} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link href="../" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <ArrowLeft className="w-4 h-4" />Back to Explore
        </Link>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-white/25 mb-6">
          <Link href="/" className="hover:text-teal transition-colors">PlunderClips</Link>
          <span>/</span>
          <Link href="/streamers" className="hover:text-teal transition-colors">Streamers</Link>
          <span>/</span>
          <span className="text-white/40">{streamer.displayName}</span>
        </nav>

        {/* Live embed */}
        {isLive && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-display text-sm text-red-400 tracking-widest">LIVE NOW</span>
              {streamer.viewerCount != null && (
                <span className="text-white/30 font-mono text-xs ml-1">{streamer.viewerCount.toLocaleString('en-US')} viewers</span>
              )}
              {streamer.streamGame && <span className="text-white/20 font-mono text-xs">· {streamer.streamGame}</span>}
            </div>
            {streamer.streamTitle && <p className="text-white/50 text-sm font-body mb-3 truncate">{streamer.streamTitle}</p>}
            <div className="relative w-full rounded overflow-hidden bg-sot-dark" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://player.twitch.tv/?channel=${streamer.twitchLogin}&parent=${new URL(base).hostname}&autoplay=false`}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                title={`${streamer.displayName} live stream`}
              />
            </div>
          </div>
        )}

        {/* Profile header */}
        <div className={`sot-card rounded p-5 md:p-7 mb-6 ${isLive ? 'border border-red-500/20' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              {streamer.profileImage ? (
                <Image src={streamer.profileImage} alt={`${streamer.displayName} profile picture`}
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
              <h1 className="font-display text-3xl md:text-4xl font-900 text-white leading-none mb-2">
                {streamer.displayName}
              </h1>
              <p className="font-mono text-white/30 text-xs mb-3">@{streamer.twitchLogin}</p>
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

            <a href={`https://twitch.tv/${streamer.twitchLogin}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white/30 hover:border-teal/40 hover:text-teal font-display text-xs tracking-wider rounded transition-all flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />Twitch
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Clips',       value: stats.totalClips,                          icon: <Film className="w-4 h-4" />,       cls: 'text-teal' },
            { label: 'Total Views', value: stats.totalViews.toLocaleString('en-US'),  icon: <Eye className="w-4 h-4" />,        cls: 'text-white/60' },
            { label: 'Top Tag',     value: stats.topTags[0] ?? '—',                   icon: <TrendingUp className="w-4 h-4" />, cls: 'text-white/60', small: true },
          ].map(s => (
            <div key={s.label} className="stat-card rounded p-4 text-center">
              <div className={`flex justify-center mb-1 ${s.cls}`}>{s.icon}</div>
              <div className={`font-display font-900 ${(s as { small?: boolean }).small ? 'text-lg' : 'text-3xl'} ${s.cls}`}>{s.value}</div>
              <div className="text-white/25 text-xs font-display tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SEO intro */}
        {stats.totalClips > 0 && (
          <div className="sot-card rounded p-5 mb-8 text-white/35 text-sm font-body leading-relaxed">
            <p>
              <strong className="text-white/60">{streamer.displayName}</strong> is a Sea of Thieves streamer
              on PlunderClips with <strong className="text-white/50">{stats.totalClips} approved clip{stats.totalClips !== 1 ? 's' : ''}</strong> and{' '}
              <strong className="text-white/50">{stats.totalViews.toLocaleString('en-US')} total views</strong>.
              {tagText && (
                <> Known for {tagText} content,{' '}
                  {streamer.displayName}'s collection covers some of the finest Sea of Thieves moments
                  from the seven seas.</>
              )}
              {tagLinks.length > 0 && (
                <> Browse {streamer.displayName}'s clips by category:{' '}
                  {tagLinks.map((t: string, i: number) => (
                    <span key={t}>
                      {i > 0 && ', '}
                      <Link href={`/?tag=${t}`} className="text-teal/70 hover:text-teal transition-colors">
                        {TAG_READABLE[t] || t}
                      </Link>
                    </span>
                  ))}.
                </>
              )}
            </p>
          </div>
        )}

        {/* Clips section */}
        {clips.length === 0 ? (
          <div className="text-center py-20 sot-card rounded">
            <p className="font-display text-3xl text-white/20 mb-2">NO CLIPS YET</p>
            <p className="text-white/20 text-sm font-body">No approved clips from this streamer yet.</p>
          </div>
        ) : (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-lg font-700 text-white tracking-wide">
                {streamer.displayName}'s Clips
              </h2>
              <div className="flex-1 teal-divider" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
              {topClips.map((clip: ClipDTO) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>

            {clips.length > 4 && (
              <StreamerClipFilter
                clips={clips}
                displayName={streamer.displayName}
                shownIds={new Set(topClips.map(c => c.id))}
              />
            )}
          </section>
        )}

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
