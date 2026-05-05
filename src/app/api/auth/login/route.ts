// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appUrl   = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const clientId = process.env.TWITCH_CLIENT_ID!;

  const twitchAuthUrl = new URL('https://id.twitch.tv/oauth2/authorize');
  twitchAuthUrl.searchParams.set('client_id',     clientId);
  twitchAuthUrl.searchParams.set('redirect_uri',  `${appUrl}/api/auth/callback`);
  twitchAuthUrl.searchParams.set('response_type', 'code');
  twitchAuthUrl.searchParams.set('scope',         'user:read:email');
  twitchAuthUrl.searchParams.set('force_verify',  'false');

  return NextResponse.redirect(twitchAuthUrl.toString());
}