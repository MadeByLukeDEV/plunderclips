// src/app/opengraph-image.tsx
// Default OG image — home page and any page without its own OG image.
// Drop your assets in public/ to activate them:
//   public/og-logo.png       → logo shown top-left of the left panel
//   public/og-screenshot.png → platform screenshot shown on the right (1440×900 recommended)
import { ImageResponse } from 'next/og';
import { getOGFonts, getLocalAsset } from '@/lib/og-helpers';

export const runtime     = 'nodejs';
export const alt         = 'PlunderClips — Sea of Thieves Community Clips';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const [fonts, logo, screenshot] = await Promise.all([
    getOGFonts().catch(() => [] as import('@/lib/og-helpers').OGFont[]),
    getLocalAsset('og-logo.png'),
    getLocalAsset('og-screenshot.png'),
  ]);

  const ff = fonts.length > 0 ? 'Barlow' : 'sans-serif';

  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        display: 'flex',
        background: '#0c0e10',
        fontFamily: ff,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Teal radial glow — top-left */}
        <div style={{
          position: 'absolute', top: '-160px', left: '-160px',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(0,229,192,0.13) 0%, transparent 65%)',
        }} />

        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(to right, #00e5c0 0%, rgba(0,229,192,0.25) 55%, transparent 100%)',
        }} />

        {/* ─── LEFT PANEL ───────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '64px 52px',
          width: '510px', flexShrink: 0,
          position: 'relative', zIndex: 2,
        }}>

          {/* Logo or text wordmark */}
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="PlunderClips"
              style={{ height: '44px', width: 'auto', objectFit: 'contain', objectPosition: 'left', marginBottom: '28px' }} />
          ) : (
            <div style={{ display: 'flex', marginBottom: '28px' }}>
              <span style={{ fontSize: '40px', fontWeight: 900, color: 'white',    letterSpacing: '-1px', lineHeight: 1 }}>PLUNDER</span>
              <span style={{ fontSize: '40px', fontWeight: 900, color: '#00e5c0', letterSpacing: '-1px', lineHeight: 1 }}>CLIPS</span>
            </div>
          )}

          {/* Domain pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px 5px 10px',
            border: '1px solid rgba(0,229,192,0.28)',
            borderRadius: '100px',
            background: 'rgba(0,229,192,0.07)',
            width: 'fit-content',
            marginBottom: '28px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e5c0', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#00e5c0', letterSpacing: '2px' }}>
              plunderclips.com
            </span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: '29px', fontWeight: 700,
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.28, letterSpacing: '-0.3px',
            maxWidth: '380px',
            marginBottom: '28px',
          }}>
            The finest Sea of Thieves community clips
          </div>

          {/* Sub-tagline */}
          <div style={{
            fontSize: '12px', fontWeight: 700,
            color: 'rgba(255,255,255,0.22)',
            letterSpacing: '4px',
          }}>
            SAIL. PLUNDER. CLIP.
          </div>
        </div>

        {/* ─── RIGHT PANEL — screenshot ─────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          {screenshot ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshot} alt=""
                style={{
                  position: 'absolute',
                  top: '24px', right: '-16px',
                  width: '720px', height: '560px',
                  objectFit: 'cover', objectPosition: 'top left',
                  borderRadius: '16px 0 0 16px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '-40px 0 80px rgba(0,0,0,0.65)',
                }}
              />
              {/* Left edge blend */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: '180px', zIndex: 1,
                background: 'linear-gradient(to right, #0c0e10 0%, transparent 100%)',
              }} />
              {/* Bottom edge blend */}
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: '100px', zIndex: 1,
                background: 'linear-gradient(to top, #0c0e10 0%, transparent 100%)',
              }} />
            </>
          ) : (
            /* Fallback: stylised mockup when no screenshot provided */
            <div style={{
              position: 'absolute',
              top: '24px', right: '-16px',
              width: '720px', height: '560px',
              background: '#161b20',
              borderRadius: '16px 0 0 16px',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', padding: '24px', gap: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ height: '3px', background: '#00e5c0', borderRadius: '2px', marginBottom: '6px' }} />
              {([0.14, 0.07, 0.07, 0.05] as number[]).map((op, i) => (
                <div key={i} style={{
                  height: '88px', borderRadius: '8px', display: 'flex',
                  background: `rgba(0,229,192,${op})`,
                  border: `1px solid rgba(0,229,192,${op * 2})`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
