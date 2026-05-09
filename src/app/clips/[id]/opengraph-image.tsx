// src/app/clips/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getOGFonts, getLocalAsset, formatViews, PLATFORM_OG, type OGFont } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate  = 3600;

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [clip, featuredClip, fonts, logo] = await Promise.all([
    prisma.clip.findUnique({
      where: { id },
      select: {
        title: true, broadcasterName: true, thumbnailUrl: true, platform: true,
        moderation: { select: { status: true } },
        stats: { select: { viewCount: true } },
      },
    }),
    prisma.clip.findFirst({
      where: { moderation: { status: 'APPROVED' }, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { stats: { viewCount: 'desc' } },
      select: { id: true },
    }),
    getOGFonts().catch((): OGFont[] => []),
    getLocalAsset('og-logo.png'),
  ]);

  if (clip?.moderation?.status !== 'APPROVED') {
    return new ImageResponse(
      <div style={{ background: '#0c0e10', width: 1200, height: 630, display: 'flex' }} />,
      { ...size },
    );
  }

  const isFeatured = featuredClip?.id === id;
  const ff         = fonts.length > 0 ? 'Barlow' : 'sans-serif';
  const platStyle  = PLATFORM_OG[clip.platform as string] ?? PLATFORM_OG.TWITCH;
  const views      = clip.stats?.viewCount ?? 0;
  const titleLen   = clip.title?.length ?? 0;
  const titleSize  = titleLen > 80 ? 34 : titleLen > 55 ? 42 : 52;

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        display: 'flex',
        background: '#0c0e10',
        fontFamily: ff,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* ── 1. Background thumbnail (first = lowest layer) ── */}
        {clip.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnailUrl} alt="" style={{
            position: 'absolute', top: 0, left: 0,
            width: 1200, height: 630,
            objectFit: 'cover', opacity: 0.45,
          }} />
        )}

        {/* ── 2. Gradient overlays ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(12,14,16,0.3) 0%, rgba(12,14,16,0.6) 40%, rgba(12,14,16,0.97) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(12,14,16,0.55) 0%, transparent 55%)',
        }} />

        {/* ── 3. Top accent ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#00e5c0' }} />

        {/* ── 4. Bottom content (last = top layer, no z-index needed) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 48px 44px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Platform badge */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 12px',
            background: platStyle.bg,
            border: `1px solid ${platStyle.border}`,
            borderRadius: 4,
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: platStyle.color, letterSpacing: 2.5 }}>
              {platStyle.label}
            </span>
          </div>

          {/* Title — single text child, no display needed */}
          <div style={{ fontSize: titleSize, fontWeight: 900, color: 'white', lineHeight: 1.1, maxWidth: 960 }}>
            {clip.title || 'Sea of Thieves Clip'}
          </div>

          {/* Streamer + views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              {clip.broadcasterName}
            </span>
            {views > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>·</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#00e5c0' }}>
                  {formatViews(views)} views
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 5. Top-bar overlays (after bottom content = on top) ── */}
        {/* Branding top-left */}
        <div style={{
          position: 'absolute', top: 28, left: 44,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" style={{ height: 26, width: 26, objectFit: 'contain' }} />
          ) : null}
          {/* Split into two spans — Satori requires display:flex if mixing text + element child */}
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: 'white' }}>PLUNDER</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#00e5c0' }}>CLIPS</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>
            plunderclips.com
          </span>
        </div>

        {/* Featured badge top-right */}
        {isFeatured && (
          <div style={{
            position: 'absolute', top: 26, right: 44,
            display: 'flex', alignItems: 'center',
            padding: '6px 14px',
            background: 'rgba(250,204,21,0.14)',
            border: '1px solid rgba(250,204,21,0.5)',
            borderRadius: 4,
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fef08a', letterSpacing: 3 }}>
              ★ WEEKLY HIGHLIGHT
            </span>
          </div>
        )}
      </div>
    ),
    { ...size, fonts },
  );
}
