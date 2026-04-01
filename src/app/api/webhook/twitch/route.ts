// src/app/api/webhooks/twitch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTwitchSignature } from '@/lib/eventsub';

// Twitch requires the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const messageId = request.headers.get('twitch-eventsub-message-id') || '';
  const timestamp = request.headers.get('twitch-eventsub-message-timestamp') || '';
  const signature = request.headers.get('twitch-eventsub-message-signature') || '';
  const messageType = request.headers.get('twitch-eventsub-message-type') || '';

  const rawBody = await request.text();

  // Verify signature
  if (!verifyTwitchSignature(messageId, timestamp, rawBody, signature)) {
    console.warn('Invalid Twitch webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  // Twitch sends a challenge on initial subscription — respond with it
  if (messageType === 'webhook_callback_verification') {
    return new NextResponse(body.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Handle revocation (subscription was cancelled by Twitch)
  if (messageType === 'revocation') {
    console.warn('EventSub subscription revoked:', body.subscription?.type, body.subscription?.condition);
    return NextResponse.json({ ok: true });
  }

  // Handle notification events
  if (messageType === 'notification') {
    const type = body.subscription?.type;
    const event = body.event;

    if (type === 'stream.online') {
      const twitchId = event.broadcaster_user_id;

      // Fetch current stream info from Twitch for title/game/viewers
      let streamTitle: string | null = null;
      let streamGame: string | null = null;
      let viewerCount: number | null = null;

      try {
        const token = await getAppToken();
        const res = await fetch(
          `https://api.twitch.tv/helix/streams?user_id=${twitchId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Client-Id': process.env.TWITCH_CLIENT_ID!,
            },
          }
        );
        const data = await res.json();
        const stream = data.data?.[0];
        if (stream) {
          streamTitle = stream.title || null;
          streamGame = stream.game_name || null;
          viewerCount = stream.viewer_count ?? null;
        }
      } catch (err) {
        console.error('Failed to fetch stream info:', err);
      }

      await prisma.user.updateMany({
        where: {
          twitchId,
          role: { in: ['PARTNER', 'ADMIN'] },
        },
        data: {
          isLive: true,
          streamTitle,
          streamGame,
          viewerCount,
          liveUpdatedAt: new Date(),
        },
      });

      console.log(`stream.online: ${event.broadcaster_user_login}`);
    }

    if (type === 'stream.offline') {
      const twitchId = event.broadcaster_user_id;

      await prisma.user.updateMany({
        where: {
          twitchId,
          role: { in: ['PARTNER', 'ADMIN'] },
        },
        data: {
          isLive: false,
          streamTitle: null,
          streamGame: null,
          viewerCount: null,
          liveUpdatedAt: new Date(),
        },
      });

      console.log(`stream.offline: ${event.broadcaster_user_login}`);
    }
  }

  return NextResponse.json({ ok: true });
}

async function getAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}
