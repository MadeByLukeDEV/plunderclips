// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${base}/streamers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ];

  // All approved clips
  const clips = await prisma.clip.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const clipRoutes: MetadataRoute.Sitemap = clips.map(clip => ({
    url: `${base}/clips/${clip.id}`,
    lastModified: clip.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // All registered streamers
  const streamers = await prisma.user.findMany({
    select: { twitchLogin: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const streamerRoutes: MetadataRoute.Sitemap = streamers.map(s => ({
    url: `${base}/streamers/${s.twitchLogin}`,
    lastModified: s.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...clipRoutes, ...streamerRoutes];
}