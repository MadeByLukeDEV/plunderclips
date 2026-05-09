// src/app/streamers/[login]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getOGFonts, getLocalAsset, formatViews, ROLE_OG, TAG_OG_LABELS } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate  = 3600; // 1-hour ISR

export default async function OGImage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const normalised = decodeURIComponent(login).toLowerCase();

  const [streamer, clipCount, viewsAgg, topTagsData, thumbnailClips, fonts, logo] = await Promise.all([
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
    prisma.clipTag.groupBy({
      by: ['tag'],
      where: { clip: { broadcasterName: normalised, moderation: { status: 'APPROVED' } } },
      _count: { tag: true },
      orderBy: { _count: { tag: 'desc' } },
      take: 3,
    }),
    // Background collage thumbnails
    prisma.clip.findMany({
      where: { broadcasterName: normalised, moderation: { status: 'APPROVED' }, thumbnailUrl: { not: null } },
      select: { thumbnailUrl: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    getOGFonts(),
    getLocalAsset('og-logo.png'),
  ]);

  // Graceful 404 fallback
  if (!streamer) {
    return new ImageResponse(
      <div style={{ background: '#0c0e10', width: '1200px', height: '630px', display: 'flex' }} />,
      { ...size },
    );
  }

  const ff         = fonts.length > 0 ? 'Barlow' : 'sans-serif';
  const isLive     = streamer.liveStatus?.isLive ?? false;
  const totalViews = viewsAgg._sum.viewCount ?? 0;
  const topTags    = topTagsData.map(t => t.tag as string);
  const role       = streamer.role as string;
  const roleStyle  = ROLE_OG[role] ?? ROLE_OG.USER;
  const thumbs     = thumbnailClips.map(c => c.thumbnailUrl!).filter(Boolean);

  // Background collage positions — 6 thumbnails spread across the canvas
  const COLLAGE: { x: number; y: number; w: number; h: number }[] = [
    { x: 0,    y: 0,    w: 420, h: 270 },
    { x: 400,  y: 0,    w: 420, h: 270 },
    { x: 800,  y: 0,    w: 420, h: 270 },
    { x: 0,    y: 250,  w: 420, h: 270 },
    { x: 400,  y: 250,  w: 420, h: 270 },
    { x: 800,  y: 250,  w: 420, h: 270 },
  ];

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        display: 'flex', flexDirection: 'column',
        background: '#0c0e10',
        fontFamily: ff,
        position: 'relative', overflow: 'hidden',
      }}>

        {/* ─── BACKGROUND: clip thumbnail collage ──────────────────────────── */}
        {thumbs.length > 0 && COLLAGE.slice(0, thumbs.length).map((pos, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={thumbs[i]} alt=""
            style={{
              position: 'absolute',
              left: `${pos.x}px`, top: `${pos.y}px`,
              width: `${pos.w}px`, height: `${pos.h}px`,
              objectFit: 'cover',
              opacity: 0.18,
            }}
          />
        ))}

        {/* Heavy dark vignette over collage */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(12,14,16,0.86)',
        }} />

        {/* Teal glow top-left */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-120px',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(0,229,192,0.10) 0%, transparent 65%)',
        }} />

        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#00e5c0' }} />

        {/* ─── TOP-RIGHT: branding ─────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '28px', right: '44px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10,
        }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="PlunderClips"
              style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '15px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
              PLUNDER<span style={{ color: 'rgba(0,229,192,0.6)' }}>CLIPS</span>
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px' }}>·</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '2px' }}>
            plunderclips.com
          </span>
        </div>

        {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          padding: '64px',
          zIndex: 5,
          gap: '56px',
        }}>

          {/* Left: profile image */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '16px',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'relative', display: 'flex',
              width: '220px', height: '220px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${isLive ? '#ef4444' : 'rgba(0,229,192,0.35)'}`,
              boxShadow: isLive
                ? '0 0 0 6px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.2)'
                : '0 0 0 6px rgba(0,229,192,0.06), 0 0 40px rgba(0,0,0,0.4)',
            }}>
              {streamer.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={streamer.profileImage} alt={streamer.displayName}
                  style={{ width: '220px', height: '220px', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '220px', height: '220px',
                  background: '#161b20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '80px',
                }}>
                  🏴‍☠️
                </div>
              )}
            </div>

            {/* Live badge below avatar */}
            {isLive && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 14px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.45)',
                borderRadius: '100px',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#f87171', letterSpacing: '3px' }}>LIVE</span>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div style={{
            width: '1px', height: '260px', flexShrink: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.08) 75%, transparent 100%)',
          }} />

          {/* Right: info */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            gap: '0px', flex: 1,
          }}>

            {/* Display name */}
            <div style={{
              fontSize: clipCount >= 10 ? '52px' : '56px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.05,
              letterSpacing: '-1px',
              marginBottom: '6px',
              maxWidth: '580px',
              // Truncate very long names
              overflow: 'hidden',
            }}>
              {streamer.displayName}
            </div>

            {/* @handle */}
            <div style={{
              fontSize: '18px', fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.5px',
              marginBottom: '20px',
            }}>
              @{streamer.twitchLogin}
            </div>

            {/* Role badge */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '5px 14px',
              background: roleStyle.bg,
              border: `1px solid ${roleStyle.border}`,
              borderRadius: '4px',
              width: 'fit-content',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: roleStyle.color, letterSpacing: '2.5px' }}>
                {roleStyle.label.toUpperCase()}
              </span>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              marginBottom: topTags.length > 0 ? '18px' : '0',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '30px', fontWeight: 900, color: '#00e5c0', lineHeight: 1 }}>
                  {clipCount.toLocaleString()}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
                  CLIPS
                </span>
              </div>

              {totalViews > 0 && (
                <>
                  <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '30px', fontWeight: 900, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>
                      {formatViews(totalViews)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
                      VIEWS
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Top tags */}
            {topTags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                {topTags.map(tag => (
                  <div key={tag} style={{
                    padding: '4px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '4px',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px' }}>
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
}
