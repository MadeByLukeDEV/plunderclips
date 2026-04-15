// src/app/clips/[id]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'PlunderClips';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clip = await prisma.clip.findUnique({
    where: { id, status: 'APPROVED' },
    select: { title: true, broadcasterName: true, thumbnailUrl: true, viewCount: true },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0c0e10',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background thumbnail */}
        {clip?.thumbnailUrl && (
          <img
            src={clip.thumbnailUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(12,14,16,0.98) 40%, rgba(12,14,16,0.5) 100%)',
        }} />

        {/* Teal glow */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: '#00e5c0',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#00e5c0', fontSize: '14px', letterSpacing: '4px', fontWeight: 700 }}>
              PLUNDERCLIPS
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', letterSpacing: '2px' }}>
              SEA OF THIEVES
            </span>
          </div>

          {/* Title */}
          <div style={{
            color: 'white',
            fontSize: clip?.title && clip.title.length > 60 ? '36px' : '44px',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            maxWidth: '900px',
          }}>
            {clip?.title || 'Sea of Thieves Clip'}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>
              {clip?.broadcasterName || 'PlunderClips'}
            </span>
            {clip?.viewCount && clip.viewCount > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ color: '#00e5c0', fontSize: '18px' }}>
                  {clip.viewCount.toLocaleString()} views
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}