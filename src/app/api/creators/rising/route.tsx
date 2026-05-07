// src/app/api/creators/rising/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 21600; // 6 hours ISR cache

function getBadge(viewGrowth: number, recentClips: number, totalClips: number, daysSinceJoined: number) {
  if (daysSinceJoined <= 14 || totalClips <= 3)
    return { label: 'New Voice',      emoji: '🆕', cls: 'text-blue-400 border-blue-400/30 bg-blue-400/10' };
  if (viewGrowth > 100 && recentClips >= 2)
    return { label: 'Hot Streak',     emoji: '🔥', cls: 'text-orange-400 border-orange-400/30 bg-orange-400/10' };
  if (viewGrowth > 50)
    return { label: 'Rising Fast',    emoji: '⚡', cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' };
  return   { label: 'On the Horizon', emoji: '🌊', cls: 'text-teal border-teal/30 bg-teal/10' };
}

export async function GET() {
  const now = new Date();
  const day3  = new Date(now); day3.setDate(now.getDate() - 3);
  const day7  = new Date(now); day7.setDate(now.getDate() - 7);
  const day14 = new Date(now); day14.setDate(now.getDate() - 14);
  const day30 = new Date(now); day30.setDate(now.getDate() - 30);

  const users = await prisma.user.findMany({
    select: {
      id: true, twitchLogin: true, displayName: true,
      profileImage: true, role: true, createdAt: true,
      liveStatus: { select: { isLive: true } },
    },
  });

  // ── Single aggregated query for ALL clip data ──────────────────────────────
  // Instead of N*7 queries, fetch everything in one shot and group in JS
  const [allRecentClips, latestClipPerBroadcaster, totalClipCounts] = await Promise.all([
    // All approved clips from last 30 days for all users
    prisma.clip.findMany({
      where: { moderation: { status: 'APPROVED' }, createdAt: { gte: day30 } },
      select: {
        broadcasterName: true,
        createdAt: true,
        thumbnailUrl: true,
        id: true,
        stats: { select: { viewCount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Latest clip per broadcaster (for thumbnail)
    prisma.clip.findMany({
      where: { moderation: { status: 'APPROVED' } },
      select: { broadcasterName: true, thumbnailUrl: true, id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      distinct: ['broadcasterName'],
    }),
    // Total clip count per broadcaster
    prisma.clip.groupBy({
      by: ['broadcasterName'],
      where: { moderation: { status: 'APPROVED' } },
      _count: { id: true },
    }),
  ]);

  // Build lookup maps
  const totalCountMap = new Map(totalClipCounts.map(r => [r.broadcasterName, r._count.id]));
  const latestClipMap = new Map(latestClipPerBroadcaster.map(c => [c.broadcasterName, c]));

  // Group recent clips by broadcaster
  const clipsByBroadcaster = new Map<string, typeof allRecentClips>();
  for (const clip of allRecentClips) {
    const key = clip.broadcasterName.toLowerCase();
    if (!clipsByBroadcaster.has(key)) clipsByBroadcaster.set(key, []);
    clipsByBroadcaster.get(key)!.push(clip);
  }

  // Score each user
  const scored = users.map(user => {
    const login = user.twitchLogin.toLowerCase();
    const clips = clipsByBroadcaster.get(login) || [];

    // Skip users with no activity in 30 days
    if (clips.length === 0) return null;

    const last7Clips  = clips.filter(c => new Date(c.createdAt) >= day7);
    const prev7Clips  = clips.filter(c => new Date(c.createdAt) >= day14 && new Date(c.createdAt) < day7);
    const last14Clips = clips.filter(c => new Date(c.createdAt) >= day14);
    const last3Clips  = clips.filter(c => new Date(c.createdAt) >= day3);
    const totalClips  = totalCountMap.get(login) || 0;
    const latestClip  = latestClipMap.get(login) || null;

    const last7Views  = last7Clips.reduce((s, c) => s + (c.stats?.viewCount ?? 0), 0);
    const prev7Views  = prev7Clips.reduce((s, c) => s + (c.stats?.viewCount ?? 0), 0);

    const viewGrowthPct = prev7Views === 0
      ? (last7Views > 0 ? 100 : 0)
      : ((last7Views - prev7Views) / prev7Views) * 100;

    // Score components
    const recentViewsScore = Math.min(last7Views / 100, 100);
    const viewGrowthScore  = Math.min(Math.max(viewGrowthPct, 0), 200) / 2;
    const consistencyScore = Math.min(last14Clips.length, 5) * 20;
    const recencyScore     = Math.min(
      last7Clips.reduce((s, c) => {
        const daysAgo = (now.getTime() - new Date(c.createdAt).getTime()) / 86400000;
        return s + Math.exp(-daysAgo * 0.3) * 100;
      }, 0),
      100
    );
    const undergodScore = (1 / Math.log(totalClips + 2)) * 100;

    const momentumScore =
      recentViewsScore  * 0.30 +
      viewGrowthScore   * 0.25 +
      consistencyScore  * 0.20 +
      recencyScore      * 0.15 +
      undergodScore     * 0.10;

    const daysSinceJoined = (now.getTime() - new Date(user.createdAt).getTime()) / 86400000;
    const badge = getBadge(viewGrowthPct, last7Clips.length, totalClips, daysSinceJoined);

    let growthLabel = '';
    if (last3Clips.length >= 2) growthLabel = `${last3Clips.length} clips in 3 days`;
    else if (viewGrowthPct > 0 && prev7Views > 0) growthLabel = `+${Math.round(viewGrowthPct)}% views this week`;
    else if (last7Clips.length > 0) growthLabel = `${last7Clips.length} clip${last7Clips.length !== 1 ? 's' : ''} this week`;

    return {
      id: user.id,
      twitchLogin: user.twitchLogin,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: user.role,
      isLive: user.liveStatus?.isLive ?? false,
      momentumScore,
      badge,
      growthLabel,
      last7Views,
      totalClips,
      latestThumbnail: latestClip?.thumbnailUrl || null,
      latestClipId: latestClip?.id || null,
    };
  });

  const results = scored
    .filter(Boolean)
    .sort((a: any, b: any) => b.momentumScore - a.momentumScore)
    .slice(0, 6);

  return NextResponse.json(
    { creators: results, cachedAt: now.toISOString() },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
      },
    }
  );
}