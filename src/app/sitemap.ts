// src/app/sitemap.ts
// ─────────────────────────────────────────────────────────────────────────────
// Split sitemap — Next.js auto-generates an index at /sitemap.xml that
// points to each sub-sitemap:
//   /sitemap/0.xml  →  static routes
//   /sitemap/1.xml  →  approved clips
//   /sitemap/2.xml  →  registered streamers
// ─────────────────────────────────────────────────────────────────────────────
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // ── 0: Static routes ───────────────────────────────────────────────────────
  if (id === 0) {
    const now = new Date();
    return [
      { url: BASE,                  lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
      { url: `${BASE}/streamers`,   lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
      { url: `${BASE}/privacy`,     lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    ];
  }

  // ── 1: Approved clips ──────────────────────────────────────────────────────
  if (id === 1) {
    const clips = await prisma.clip.findMany({
      where: { moderation: { status: 'APPROVED' } },
      select: { id: true, updatedAt: true, thumbnailUrl: true },
      orderBy: { createdAt: 'desc' },
    });

    return clips.map(clip => ({
      url:             `${BASE}/clips/${clip.id}`,
      lastModified:    clip.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
      // images: string[] — Next.js image sitemap extension
      ...(clip.thumbnailUrl && { images: [clip.thumbnailUrl] }),
    }));
  }

  // ── 2: Registered streamers ────────────────────────────────────────────────
  if (id === 2) {
    const streamers = await prisma.user.findMany({
      select: { twitchLogin: true, profileImage: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return streamers.map(s => ({
      url:             `${BASE}/streamers/${s.twitchLogin}`,
      lastModified:    s.updatedAt,
      changeFrequency: 'daily' as const,
      priority:        0.6,
      ...(s.profileImage && { images: [s.profileImage] }),
    }));
  }

  return [];
}
