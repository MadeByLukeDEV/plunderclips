// src/app/clips/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getOGFonts, getLocalAsset, formatViews, PLATFORM_OG } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate  = 3600; // 1-hour ISR

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
    // Check if this is the current top clip (weekly highlight)
    prisma.clip.findFirst({
      where: { moderation: { status: 'APPROVED' }, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { stats: { viewCount: 'desc' } },
      select: { id: true },
    }),
    getOGFonts(),
    getLocalAsset('og-logo.png'),
  ]);

  // Fallback for unapproved / missing clips
  if (clip?.moderation?.status !== 'APPROVED') {
    return new ImageResponse(
      <div style={{ background: '#0c0e10', width: '1200px', height: '630px', display: 'flex' }} />,
      { ...size },
    );
  }

  const isFeatured  = featuredClip?.id === id;
  const ff          = fonts.length > 0 ? 'Barlow' : 'sans-serif';
  const platform    = clip.platform as string;
  const platStyle   = PLATFORM_OG[platform] ?? PLATFORM_OG.TWITCH;
  const views       = clip.stats?.viewCount ?? 0;
  const titleLen    = clip.title?.length ?? 0;
  const titleSize   = titleLen > 80 ? '34px' : titleLen > 55 ? '42px' : '52px';

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        display: 'flex', flexDirection: 'column',
        background: '#0c0e10',
        fontFamily: ff,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Full-bleed thumbnail */}
        {clip.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnailUrl} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
          />
        )}

        {/* Primary gradient — light top, very dark bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(12,14,16,0.35) 0%, rgba(12,14,16,0.65) 42%, rgba(12,14,16,0.97) 100%)',
        }} />

        {/* Left vignette for reading comfort */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(12,14,16,0.55) 0%, transparent 55%)',
        }} />

        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#00e5c0' }} />

        {/* ─── TOP BAR — branding ──────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '28px', left: '44px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10,
        }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="PlunderClips"
              style={{ height: '26px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '17px', fontWeight: 900, color: 'white', letterSpacing: '0.5px' }}>
              PLUNDER<span style={{ color: '#00e5c0' }}>CLIPS</span>
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>·</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px' }}>
            plunderclips.com
          </span>
        </div>

        {/* ─── FEATURED BADGE — top right ─────────────────────────────────── */}
        {isFeatured && (
          <div style={{
            position: 'absolute', top: '26px', right: '44px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px',
            background: 'rgba(250,204,21,0.14)',
            border: '1px solid rgba(250,204,21,0.5)',
            borderRadius: '4px',
            zIndex: 10,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#fef08a', letterSpacing: '3px' }}>
              ★ WEEKLY HIGHLIGHT
            </span>
          </div>
        )}

        {/* ─── BOTTOM CONTENT ──────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 48px 44px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          zIndex: 10,
        }}>

          {/* Platform badge */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 12px',
            background: platStyle.bg,
            border: `1px solid ${platStyle.border}`,
            borderRadius: '4px',
            width: 'fit-content',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 900, color: platStyle.color, letterSpacing: '2.5px' }}>
              {platStyle.label}
            </span>
          </div>

          {/* Clip title */}
          <div style={{
            fontSize: titleSize, fontWeight: 900,
            color: 'white', lineHeight: 1.1,
            letterSpacing: '-0.5px',
            maxWidth: '960px',
          }}>
            {clip.title || 'Sea of Thieves Clip'}
          </div>

          {/* Streamer + views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              {clip.broadcasterName}
            </span>
            {views > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>·</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#00e5c0' }}>
                  {formatViews(views)} views
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
