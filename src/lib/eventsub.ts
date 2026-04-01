// src/lib/eventsub.ts
// Twitch EventSub subscription management

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET!;

async function getAppToken(): Promise<string> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  return data.access_token;
}

function getCallbackUrl(): string {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${base}/api/webhooks/twitch`;
}

// Subscribe a user to stream.online and stream.offline
export async function subscribeToLiveEvents(twitchUserId: string): Promise<void> {
  const token = await getAppToken();
  const callbackUrl = getCallbackUrl();

  const types = ['stream.online', 'stream.offline'];

  for (const type of types) {
    const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        version: '1',
        condition: { broadcaster_user_id: twitchUserId },
        transport: {
          method: 'webhook',
          callback: callbackUrl,
          secret: WEBHOOK_SECRET,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(`EventSub subscribe error for ${type}:`, data);
    } else {
      console.log(`EventSub subscribed: ${type} for user ${twitchUserId}`);
    }
  }
}

// Unsubscribe a user from all stream.online/offline EventSub subscriptions
export async function unsubscribeFromLiveEvents(twitchUserId: string): Promise<void> {
  const token = await getAppToken();

  // List all subscriptions
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': TWITCH_CLIENT_ID,
    },
  });

  if (!res.ok) {
    console.error('Failed to list EventSub subscriptions');
    return;
  }

  const data = await res.json();
  const subs = data.data || [];

  // Find subscriptions matching this user
  const matching = subs.filter((s: any) =>
    s.condition?.broadcaster_user_id === twitchUserId &&
    ['stream.online', 'stream.offline'].includes(s.type)
  );

  // Delete each matching subscription
  for (const sub of matching) {
    const delRes = await fetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': TWITCH_CLIENT_ID,
        },
      }
    );
    if (delRes.ok) {
      console.log(`EventSub unsubscribed: ${sub.type} for user ${twitchUserId}`);
    } else {
      console.error(`Failed to delete EventSub subscription ${sub.id}`);
    }
  }
}

// Verify Twitch webhook signature
export function verifyTwitchSignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const message = messageId + timestamp + body;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
