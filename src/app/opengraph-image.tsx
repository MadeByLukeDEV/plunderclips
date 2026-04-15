// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'PlunderClips — Sea of Thieves Community Clips';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0c0e10',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Teal glow */}
        <div style={{
          position: 'absolute',
          top: '-100px', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(0,229,192,0.15) 0%, transparent 70%)',
        }} />

        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: '#00e5c0',
        }} />

        {/* Logo */}
        <div style={{
          display: 'flex',
          fontSize: '88px',
          fontWeight: 900,
          letterSpacing: '-2px',
          lineHeight: 1,
          marginBottom: '24px',
        }}>
          <span style={{ color: 'white' }}>PLUNDER</span>
          <span style={{ color: '#00e5c0' }}>CLIPS</span>
        </div>

        {/* Divider */}
        <div style={{
          width: '120px', height: '2px',
          background: 'rgba(0,229,192,0.4)',
          marginBottom: '24px',
        }} />

        {/* Tagline */}
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '24px',
          letterSpacing: '2px',
          textAlign: 'center',
        }}>
          The finest Sea of Thieves moments
        </div>

        <div style={{
          position: 'absolute',
          bottom: '32px',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '14px',
          letterSpacing: '3px',
        }}>
          SAIL. PLUNDER. CLIP.
        </div>
      </div>
    ),
    { ...size }
  );
}