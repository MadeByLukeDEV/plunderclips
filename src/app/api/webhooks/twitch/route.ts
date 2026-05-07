// src/app/api/webhooks/twitch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyTwitchSignature, fetchLiveStreams } from '@/modules/platform/twitch.service';
import { setLiveStatus, clearLiveStatus } from '@/modules/live/live.service';

// Twitch requires the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const messageId  = request.headers.get('twitch-eventsub-message-id')        ?? '';
  const timestamp  = request.headers.get('twitch-eventsub-message-timestamp') ?? '';
  const signature  = request.headers.get('twitch-eventsub-message-signature') ?? '';
  const messageType = request.headers.get('twitch-eventsub-message-type')     ?? '';

  const rawBody = await request.text();

  if (!verifyTwitchSignature(messageId, timestamp, rawBody, signature)) {
    console.warn('Invalid Twitch webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const body = JSON.parse(rawBody);

  if (messageType === 'webhook_callback_verification') {
    return new NextResponse(body.challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (messageType === 'revocation') {
    console.warn('EventSub subscription revoked:', body.subscription?.type, body.subscription?.condition);
    return NextResponse.json({ ok: true });
  }

  if (messageType === 'notification') {
    const type  = body.subscription?.type as string;
    const event = body.event;
    const twitchId: string = event.broadcaster_user_id;

    if (type === 'stream.online') {
      // Fetch current stream info for title/game/viewers
      let streamTitle: string | null = null;
      let streamGame: string | null = null;
      let viewerCount: number | null = null;

      try {
        const [stream] = await fetchLiveStreams([twitchId]);
        if (stream) {
          streamTitle  = stream.title      || null;
          streamGame   = stream.game_name  || null;
          viewerCount  = stream.viewer_count ?? null;
        }
      } catch (err) {
        console.error('Failed to fetch stream info on stream.online:', err);
      }

      await setLiveStatus(twitchId, { streamTitle, streamGame, viewerCount });
      console.log(`stream.online: ${event.broadcaster_user_login}`);
    }

    if (type === 'stream.offline') {
      await clearLiveStatus(twitchId);
      console.log(`stream.offline: ${event.broadcaster_user_login}`);
    }
  }

  return NextResponse.json({ ok: true });
}
