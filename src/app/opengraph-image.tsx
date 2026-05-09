// src/app/opengraph-image.tsx
// Default OG image — home page and generic pages.
// public/og-logo.png       → icon shown beside the PLUNDERCLIPS wordmark
// public/og-screenshot.png → platform screenshot on the right (1440×900 recommended)
import { ImageResponse } from 'next/og';
import { getOGFonts, getLocalAsset, type OGFont } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips — Sea of Thieves Community Clips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const [fonts, logo, screenshot] = await Promise.all([
    getOGFonts().catch((): OGFont[] => []),
    getLocalAsset('og-logo.png'),
    getLocalAsset('og-screenshot.png'),
  ]);

  const ff = fonts.length > 0 ? 'Barlow' : 'sans-serif';

  return new ImageResponse(
    (
      // Root — position: relative so absolute children resolve here
      <div style={{
        width: 1200, height: 630,
        display: 'flex',
        background: '#0c0e10',
        fontFamily: ff,
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Screenshot — absolutely on ROOT so Satori resolves it correctly ── */}
        {screenshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={screenshot} alt="" style={{
            position: 'absolute',
            top: 0, right: 0,
            width: 710, height: 630,
            objectFit: 'cover',
            objectPosition: 'top left',
          }} />
        )}

        {/* ── Gradient: blends screenshot into dark left panel ── */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: screenshot
            ? 'linear-gradient(to right, #0c0e10 32%, rgba(12,14,16,0.93) 46%, rgba(12,14,16,0.55) 62%, rgba(12,14,16,0.1) 82%, transparent 100%)'
            : 'transparent',
        }} />
        {/* Top + bottom edge darkening over screenshot */}
        {screenshot && (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 90,
              background: 'linear-gradient(to bottom, rgba(12,14,16,0.9) 0%, transparent 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 110,
              background: 'linear-gradient(to top, rgba(12,14,16,0.9) 0%, transparent 100%)',
            }} />
          </>
        )}

        {/* ── Teal radial glow — top-left atmosphere ── */}
        <div style={{
          position: 'absolute', top: -180, left: -180,
          width: 750, height: 560,
          background: 'radial-gradient(ellipse, rgba(0,229,192,0.15) 0%, transparent 65%)',
        }} />

        {/* ── Top accent line ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(to right, #00e5c0 0%, rgba(0,229,192,0.3) 50%, transparent 100%)',
        }} />

        {/* ── Left content — EXPLICIT height so justifyContent: center works ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          width: 520, height: 630,
          padding: '0 52px',
          position: 'relative', zIndex: 5,
          flexShrink: 0,
        }}>

          {/* Logo icon + PLUNDERCLIPS wordmark — always both */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" style={{ height: 42, width: 42, objectFit: 'contain', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex' }}>
              <span style={{ fontSize: 38, fontWeight: 900, color: 'white',    letterSpacing: -1, lineHeight: 1 }}>PLUNDER</span>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#00e5c0', letterSpacing: -1, lineHeight: 1 }}>CLIPS</span>
            </div>
          </div>

          {/* Domain pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 14px 5px 10px',
            border: '1px solid rgba(0,229,192,0.28)',
            borderRadius: 100,
            background: 'rgba(0,229,192,0.07)',
            marginBottom: 26,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e5c0', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#00e5c0', letterSpacing: 2 }}>
              plunderclips.com
            </span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 28, fontWeight: 700,
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.3,
            maxWidth: 380,
            marginBottom: 26,
          }}>
            The finest Sea of Thieves community clips
          </div>

          {/* Sub-tagline */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: 4 }}>
            SAIL. PLUNDER. CLIP.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
