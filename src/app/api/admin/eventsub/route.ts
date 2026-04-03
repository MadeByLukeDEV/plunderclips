// src/app/api/admin/eventsub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/middleware-auth';
import { subscribeToLiveEvents, unsubscribeFromLiveEvents } from '@/lib/eventsub';

const LIVE_ROLES = ['PARTNER', 'ADMIN'];

async function getAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

async function fetchAllEventSubSubscriptions(token: string): Promise<any[]> {
  const subs: any[] = [];
  let cursor: string | null = null;

  do {
    const url:string = cursor
      ? `https://api.twitch.tv/helix/eventsub/subscriptions?after=${cursor}`
      : 'https://api.twitch.tv/helix/eventsub/subscriptions';

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    const data = await res.json();
    subs.push(...(data.data || []));
    cursor = data.pagination?.cursor || null;
  } while (cursor);

  return subs;
}

// GET — fetch subscription status for all Partners/Admins
export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all Partner/Admin users from DB
  const partners = await prisma.user.findMany({
    where: { role: { in: LIVE_ROLES as any } },
    select: {
      id: true,
      twitchId: true,
      twitchLogin: true,
      displayName: true,
      profileImage: true,
      role: true,
      isLive: true,
    },
    orderBy: { role: 'asc' },
  });

  // Fetch all EventSub subscriptions from Twitch
  const token = await getAppToken();
  const allSubs = await fetchAllEventSubSubscriptions(token);

  // Cross-reference: for each partner, find their subscriptions
  const result = partners.map(partner => {
    const userSubs = allSubs.filter(
      s => s.condition?.broadcaster_user_id === partner.twitchId
    );

    const onlineSub = userSubs.find(s => s.type === 'stream.online');
    const offlineSub = userSubs.find(s => s.type === 'stream.offline');

    return {
      ...partner,
      subscriptions: {
        online: onlineSub
          ? { status: onlineSub.status, id: onlineSub.id }
          : null,
        offline: offlineSub
          ? { status: offlineSub.status, id: offlineSub.id }
          : null,
      },
      fullySubscribed:
        onlineSub?.status === 'enabled' && offlineSub?.status === 'enabled',
    };
  });

  return NextResponse.json({
    partners: result,
    totalSubs: allSubs.length,
  });
}

// POST — resubscribe a specific user (delete all + recreate)
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
    // Delete existing then resubscribe fresh
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

// DELETE — resubscribe ALL partners that are missing or failed
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const partners = await prisma.user.findMany({
    where: { role: { in: LIVE_ROLES as any } },
    select: { id: true, twitchId: true, twitchLogin: true },
  });

  const token = await getAppToken();
  const allSubs = await fetchAllEventSubSubscriptions(token);

  let fixed = 0;
  for (const partner of partners) {
    const userSubs = allSubs.filter(
      s => s.condition?.broadcaster_user_id === partner.twitchId
    );
    const onlineOk = userSubs.some(s => s.type === 'stream.online' && s.status === 'enabled');
    const offlineOk = userSubs.some(s => s.type === 'stream.offline' && s.status === 'enabled');

    if (!onlineOk || !offlineOk) {
      await unsubscribeFromLiveEvents(partner.twitchId);
      await subscribeToLiveEvents(partner.twitchId);
      fixed++;
      console.log(`Fixed subscriptions for ${partner.twitchLogin}`);
    }
  }

  return NextResponse.json({
    success: true,
    fixed,
    total: partners.length,
    message: `Fixed ${fixed} of ${partners.length} partners`,
  });
}