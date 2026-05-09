// src/app/api/admin/eventsub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/modules/auth/auth.middleware';
import {
  subscribeToLiveEvents,
  unsubscribeFromLiveEvents,
  fetchAllEventSubSubscriptions,
  getTwitchAppToken,
} from '@/modules/platform/twitch.service';
import { LIVE_ROLES } from '@/modules/live/live.service';

// GET — subscription status for all Partners/Admins
export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const partners = await prisma.user.findMany({
    where: { role: { in: LIVE_ROLES } },
    select: {
      id: true,
      twitchId: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      liveStatus: { select: { isLive: true } },
    },
    orderBy: { role: 'asc' },
  });

  const token = await getTwitchAppToken();
  const allSubs = await fetchAllEventSubSubscriptions(token) as {
    id: string;
    type: string;
    status: string;
    condition: { broadcaster_user_id: string };
  }[];

  const result = partners.map((partner) => {
    const userSubs = allSubs.filter((s) => s.condition?.broadcaster_user_id === partner.twitchId);
    const onlineSub  = userSubs.find((s) => s.type === 'stream.online');
    const offlineSub = userSubs.find((s) => s.type === 'stream.offline');

    return {
      ...partner,
      isLive: partner.liveStatus?.isLive ?? false,
      liveStatus: undefined,
      subscriptions: {
        online:  onlineSub  ? { status: onlineSub.status,  id: onlineSub.id  } : null,
        offline: offlineSub ? { status: offlineSub.status, id: offlineSub.id } : null,
      },
      fullySubscribed: onlineSub?.status === 'enabled' && offlineSub?.status === 'enabled',
    };
  });

  return NextResponse.json({ partners: result, totalSubs: allSubs.length });
}

// POST — resubscribe a specific user
export async function POST(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, twitchId: true, twitchLogin: true, role: true },
  });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (!LIVE_ROLES.includes(target.role)) {
    return NextResponse.json({ error: 'User must be PARTNER or ADMIN' }, { status: 400 });
  }

  try {
    await unsubscribeFromLiveEvents(target.twitchId);
    await subscribeToLiveEvents(target.twitchId);
    return NextResponse.json({
      success: true,
      message: `Resubscribed ${target.twitchLogin} to stream.online and stream.offline`,
    });
  } catch (err) {
    console.error('Resubscribe error:', err);
    return NextResponse.json({ error: 'Failed to resubscribe' }, { status: 500 });
  }
}

// DELETE — fix all partners missing or failed subscriptions
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const partners = await prisma.user.findMany({
    where: { role: { in: LIVE_ROLES } },
    select: { id: true, twitchId: true, twitchLogin: true },
  });

  const token = await getTwitchAppToken();
  const allSubs = await fetchAllEventSubSubscriptions(token) as {
    type: string;
    status: string;
    condition: { broadcaster_user_id: string };
  }[];

  let fixed = 0;
  for (const partner of partners) {
    const userSubs  = allSubs.filter((s) => s.condition?.broadcaster_user_id === partner.twitchId);
    const onlineOk  = userSubs.some((s) => s.type === 'stream.online'  && s.status === 'enabled');
    const offlineOk = userSubs.some((s) => s.type === 'stream.offline' && s.status === 'enabled');

    if (!onlineOk || !offlineOk) {
      await unsubscribeFromLiveEvents(partner.twitchId);
      await subscribeToLiveEvents(partner.twitchId);
      fixed++;
    }
  }

  return NextResponse.json({
    success: true,
    fixed,
    total: partners.length,
    message: `Fixed ${fixed} of ${partners.length} partners`,
  });
}
