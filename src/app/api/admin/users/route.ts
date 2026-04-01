// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware-auth';
import { subscribeToLiveEvents, unsubscribeFromLiveEvents } from '@/lib/eventsub';
import { Role } from '@prisma/client';

const LIVE_ROLES: Role[] = ['PARTNER', 'ADMIN'];
const ALLOW_MANUAL_LIVE = process.env.ALLOW_MANUAL_LIVE_OVERRIDE === 'true';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
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
      isLive: true,
      streamTitle: true,
      streamGame: true,
      viewerCount: true,
      liveUpdatedAt: true,
      youtubeChannelName: true,
      createdAt: true,
      _count: { select: { clips: true } },
    },
  });

  const usersWithChannelClips = await Promise.all(
    users.map(async (u) => {
      const channelClipCount = await prisma.clip.count({
        where: {
          broadcasterName: u.twitchLogin,
          submittedBy: { not: u.id },
          status: 'APPROVED',
        },
      });
      return { ...u, channelClipCount };
    })
  );

  return NextResponse.json({
    users: usersWithChannelClips,
    allowManualLive: ALLOW_MANUAL_LIVE,
  });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get('id');
  if (!targetId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const body = await request.json();
  const { role, isLive } = body;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // ── Role change ────────────────────────────────────────────────────────────
  if (role !== undefined) {
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const wasLiveRole = LIVE_ROLES.includes(target.role);
    const willBeLiveRole = LIVE_ROLES.includes(role as Role);

    // Handle EventSub subscriptions based on role transition
    if (!wasLiveRole && willBeLiveRole) {
      // Promoted to live-eligible role → subscribe
      try {
        await subscribeToLiveEvents(target.twitchId);
      } catch (err) {
        console.error('EventSub subscribe failed:', err);
      }
    } else if (wasLiveRole && !willBeLiveRole) {
      // Demoted from live-eligible role → unsubscribe + clear live status
      try {
        await unsubscribeFromLiveEvents(target.twitchId);
      } catch (err) {
        console.error('EventSub unsubscribe failed:', err);
      }
      await prisma.user.update({
        where: { id: targetId },
        data: { isLive: false, streamTitle: null, streamGame: null, viewerCount: null },
      });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role: role as Role },
      select: { id: true, displayName: true, role: true, isLive: true },
    });

    return NextResponse.json({ user: updated });
  }

  // ── Manual live toggle (dev/testing only) ──────────────────────────────────
  if (isLive !== undefined) {
    if (!ALLOW_MANUAL_LIVE) {
      return NextResponse.json(
        { error: 'Manual live override is disabled in production' },
        { status: 403 }
      );
    }

    if (!LIVE_ROLES.includes(target.role)) {
      return NextResponse.json(
        { error: 'User must be PARTNER or ADMIN to have live status' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        isLive: Boolean(isLive),
        streamTitle: isLive ? (body.streamTitle || 'Test Stream') : null,
        streamGame: isLive ? (body.streamGame || 'Sea of Thieves') : null,
        viewerCount: isLive ? (body.viewerCount || 0) : null,
        liveUpdatedAt: new Date(),
      },
      select: { id: true, displayName: true, role: true, isLive: true, streamTitle: true },
    });

    return NextResponse.json({ user: updated });
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
}
