import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const redirectUri = `${appUrl}/api/auth/callback`;
  const scopes = 'user:read:email';

  const twitchAuthUrl = new URL('https://id.twitch.tv/oauth2/authorize');
  twitchAuthUrl.searchParams.set('client_id', clientId);
  twitchAuthUrl.searchParams.set('redirect_uri', redirectUri);
  twitchAuthUrl.searchParams.set('response_type', 'code');
  twitchAuthUrl.searchParams.set('scope', scopes);
  twitchAuthUrl.searchParams.set('force_verify', 'false');

  return NextResponse.redirect(twitchAuthUrl.toString());
}
