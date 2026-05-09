// src/app/streamers/[login]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getOGFonts, getLocalAsset, formatViews, ROLE_OG, TAG_OG_LABELS, type OGFont } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate  = 3600;

// Minimal fallback — always valid, never 502
function fallback(fonts: OGFont[]) {
  return new ImageResponse(
    <div style={{ background: '#0c0e10', width: 1200, height: 630, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex' }}>
        <span style={{ fontSize: 60, fontWeight: 900, color: 'white' }}>PLUNDER</span>
        <span style={{ fontSize: 60, fontWeight: 900, color: '#00e5c0' }}>CLIPS</span>
      </div>
    </div>,
    { ...size, fonts },
  );
}

export default async function OGImage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const normalised = decodeURIComponent(login).toLowerCase();

  // Fonts + logo load independently — never block the DB queries
  const [fonts, logo] = await Promise.all([
    getOGFonts().catch((): OGFont[] => []),
    getLocalAsset('og-logo.png'),
  ]);

  try {
    // Separate DB queries from asset loading so a DB error returns the fallback
    const [streamer, clipCount, viewsAgg, allTagRows, thumbnailClips] = await Promise.all([
      prisma.user.findUnique({
        where: { twitchLogin: normalised },
        select: {
          displayName: true, twitchLogin: true, profileImage: true, role: true,
          liveStatus: { select: { isLive: true } },
        },
      }),
      prisma.clip.count({
        where: { broadcasterName: normalised, moderation: { status: 'APPROVED' } },
      }),
      prisma.clipStats.aggregate({
        where: { clip: { broadcasterName: normalised, moderation: { status: 'APPROVED' } } },
        _sum: { viewCount: true },
      }),
      // findMany + JS sort avoids groupBy orderBy _count which is problematic on MariaDB
      prisma.clipTag.findMany({
        where: { clip: { broadcasterName: normalised, moderation: { status: 'APPROVED' } } },
        select: { tag: true },
      }),
      prisma.clip.findMany({
        where: { broadcasterName: normalised, moderation: { status: 'APPROVED' }, thumbnailUrl: { not: null } },
        select: { thumbnailUrl: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    if (!streamer) return fallback(fonts);

    // Tally top tags in JS — same pattern as streamers.service.ts
    const tagCounts = new Map<string, number>();
    for (const { tag } of allTagRows) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    const ff         = fonts.length > 0 ? 'Barlow' : 'sans-serif';
    const isLive     = streamer.liveStatus?.isLive ?? false;
    const totalViews = viewsAgg._sum.viewCount ?? 0;
    const roleStyle  = ROLE_OG[streamer.role as string] ?? ROLE_OG.USER;
    const thumbs     = thumbnailClips.map(c => c.thumbnailUrl!).filter(Boolean);

    // Collage grid positions
    const GRID = [
      { x: 0,   y: 0,   w: 420, h: 270 }, { x: 400, y: 0,   w: 420, h: 270 },
      { x: 800, y: 0,   w: 420, h: 270 }, { x: 0,   y: 250, w: 420, h: 270 },
      { x: 400, y: 250, w: 420, h: 270 }, { x: 800, y: 250, w: 420, h: 270 },
    ];

    return new ImageResponse(
      (
        <div style={{
          width: 1200, height: 630,
          display: 'flex', flexDirection: 'column',
          background: '#0c0e10',
          fontFamily: ff,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background collage */}
          {thumbs.slice(0, GRID.length).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" style={{
              position: 'absolute',
              left: GRID[i].x, top: GRID[i].y,
              width: GRID[i].w, height: GRID[i].h,
              objectFit: 'cover', opacity: 0.18,
            }} />
          ))}

          {/* Dark overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(12,14,16,0.87)' }} />

          {/* Teal glow */}
          <div style={{
            position: 'absolute', top: -120, left: -120,
            width: 600, height: 400,
            background: 'radial-gradient(ellipse, rgba(0,229,192,0.10) 0%, transparent 65%)',
          }} />

          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#00e5c0' }} />

          {/* Top-right branding */}
          <div style={{ position: 'absolute', top: 28, right: 44, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" style={{ height: 22, width: 22, objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>
              PLUNDER<span style={{ color: 'rgba(0,229,192,0.6)' }}>CLIPS</span>
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 2 }}>
              plunderclips.com
            </span>
          </div>

          {/* Main content */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center',
            padding: '64px', zIndex: 5, gap: 56,
          }}>
            {/* Profile image */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <div style={{
                width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${isLive ? '#ef4444' : 'rgba(0,229,192,0.35)'}`,
                boxShadow: isLive ? '0 0 0 6px rgba(239,68,68,0.15)' : '0 0 0 6px rgba(0,229,192,0.06)',
                display: 'flex', flexShrink: 0,
              }}>
                {streamer.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={streamer.profileImage} alt={streamer.displayName}
                    style={{ width: 220, height: 220, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 220, height: 220, background: '#161b20', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🏴‍☠️</div>
                )}
              </div>
              {isLive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px',
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 100 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#f87171', letterSpacing: 3 }}>LIVE</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{
              width: 1, height: 260, flexShrink: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.08) 75%, transparent 100%)',
            }} />

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>
              <div style={{ fontSize: 50, fontWeight: 900, color: 'white', lineHeight: 1.05, letterSpacing: -1, marginBottom: 6 }}>
                {streamer.displayName}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
                @{streamer.twitchLogin}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '5px 14px',
                background: roleStyle.bg, border: `1px solid ${roleStyle.border}`, borderRadius: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: roleStyle.color, letterSpacing: 2.5 }}>
                  {roleStyle.label.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: topTags.length ? 18 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: '#00e5c0', lineHeight: 1 }}>
                    {clipCount.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>CLIPS</span>
                </div>
                {totalViews > 0 && (
                  <>
                    <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 30, fontWeight: 900, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>
                        {formatViews(totalViews)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>VIEWS</span>
                    </div>
                  </>
                )}
              </div>
              {topTags.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {topTags.map(tag => (
                    <div key={tag} style={{ display: 'flex', alignItems: 'center', padding: '4px 12px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5 }}>
                        {(TAG_OG_LABELS[tag] ?? tag).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  } catch (err) {
    console.error('[streamer-og] generation failed:', err);
    return fallback(fonts);
  }
}
