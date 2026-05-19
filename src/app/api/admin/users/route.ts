// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireStaff, requireAdmin } from '@/modules/auth/auth.middleware';
import { updateStreamerRole } from '@/modules/streamers/streamers.service';
import { LIVE_ROLES } from '@/modules/live/live.service';
import { Role } from '@prisma/client';

const ALLOW_MANUAL_LIVE = process.env.ALLOW_MANUAL_LIVE_OVERRIDE === 'true';

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      twitchId: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      createdAt: true,
      liveStatus: {
        select: { isLive: true, streamTitle: true, streamGame: true, viewerCount: true, liveUpdatedAt: true },
      },
      linkedAccount: {
        select: { youtubeChannelName: true },
      },
      _count: { select: { clips: true } },
    },
  });

  // Batch clip counts in 2 queries instead of N — avoids N+1
  const broadcasterNames = users.map((u) => u.twitchLogin);

  const [totalRows, selfRows] = await Promise.all([
    // Total approved clips per broadcaster
    prisma.clip.groupBy({
      by: ['broadcasterName'],
      where: { broadcasterName: { in: broadcasterNames }, moderation: { status: 'APPROVED' } },
      _count: { id: true },
    }),
    // Self-submitted approved clips per (broadcasterName, submittedBy) pair
    prisma.clip.groupBy({
      by: ['broadcasterName', 'submittedBy'],
      where: {
        broadcasterName: { in: broadcasterNames },
        submittedBy: { in: users.map((u) => u.id) },
        moderation: { status: 'APPROVED' },
      },
      _count: { id: true },
    }),
  ]);

  const totalByBroadcaster = new Map(totalRows.map((r) => [r.broadcasterName, r._count.id]));

  // Map: broadcasterName -> submittedBy -> count (for self-submission lookup)
  const selfByBroadcaster = new Map<string, Map<string, number>>();
  for (const row of selfRows) {
    if (!selfByBroadcaster.has(row.broadcasterName)) {
      selfByBroadcaster.set(row.broadcasterName, new Map());
    }
    selfByBroadcaster.get(row.broadcasterName)!.set(row.submittedBy, row._count.id);
  }

  const result = users.map((u) => {
    const total = totalByBroadcaster.get(u.twitchLogin) ?? 0;
    const self  = selfByBroadcaster.get(u.twitchLogin)?.get(u.id) ?? 0;
    return {
      ...u,
      isLive:             u.liveStatus?.isLive          ?? false,
      streamTitle:        u.liveStatus?.streamTitle      ?? null,
      streamGame:         u.liveStatus?.streamGame       ?? null,
      viewerCount:        u.liveStatus?.viewerCount      ?? null,
      liveUpdatedAt:      u.liveStatus?.liveUpdatedAt    ?? null,
      youtubeChannelName: u.linkedAccount?.youtubeChannelName ?? null,
      liveStatus:         undefined,
      linkedAccount:      undefined,
      channelClipCount:   total - self,
    };
  });

  return NextResponse.json({ users: result, allowManualLive: ALLOW_MANUAL_LIVE });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetId = new URL(request.url).searchParams.get('id');
  if (!targetId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const body = await request.json();
  const { role, isLive } = body;

  // ── Role change ────────────────────────────────────────────────────────────
  if (role !== undefined) {
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    try {
      const updated = await updateStreamerRole(targetId, role as Role);

      // Bust Next.js full route cache so the streamer pages reflect the new role immediately
      revalidatePath('/streamers');
      revalidatePath(`/streamers/${updated.twitchLogin}`);

      return NextResponse.json({ user: updated });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : 'Failed to update role';
      return NextResponse.json({ error: message }, { status });
    }
  }

  // ── Manual live toggle (dev/testing only) ──────────────────────────────────
  if (isLive !== undefined) {
    if (!ALLOW_MANUAL_LIVE) {
      return NextResponse.json(
        { error: 'Manual live override is disabled in production' },
        { status: 403 },
      );
    }

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!LIVE_ROLES.includes(target.role)) {
      return NextResponse.json(
        { error: 'User must be PARTNER or ADMIN to have live status' },
        { status: 400 },
      );
    }

    await prisma.userLiveStatus.upsert({
      where: { userId: targetId },
      update: {
        isLive: Boolean(isLive),
        streamTitle:  isLive ? (body.streamTitle  || 'Test Stream')     : null,
        streamGame:   isLive ? (body.streamGame   || 'Sea of Thieves')  : null,
        viewerCount:  isLive ? (body.viewerCount  ?? 0)                 : null,
        liveUpdatedAt: new Date(),
      },
      create: {
        userId: targetId,
        isLive: Boolean(isLive),
        streamTitle:  isLive ? (body.streamTitle  || 'Test Stream')     : null,
        streamGame:   isLive ? (body.streamGame   || 'Sea of Thieves')  : null,
        viewerCount:  isLive ? (body.viewerCount  ?? 0)                 : null,
        liveUpdatedAt: new Date(),
      },
    });

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: targetId },
      select: { id: true, displayName: true, role: true, twitchLogin: true, liveStatus: { select: { isLive: true, streamTitle: true } } },
    });

    revalidatePath('/streamers');
    revalidatePath(`/streamers/${updated.twitchLogin}`);

    return NextResponse.json({
      user: {
        ...updated,
        isLive:      updated.liveStatus?.isLive      ?? false,
        streamTitle: updated.liveStatus?.streamTitle ?? null,
        liveStatus:  undefined,
      },
    });
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
}
