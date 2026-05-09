// src/app/api/auth/youtube/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return NextResponse.redirect(`${appUrl}/api/auth/login`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/settings?error=youtube_config`);
  }

  const state = crypto.randomUUID();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id',     clientId);
  authUrl.searchParams.set('redirect_uri',  `${appUrl}/api/auth/youtube/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope',         'https://www.googleapis.com/auth/youtube.readonly');
  authUrl.searchParams.set('access_type',   'online');
  authUrl.searchParams.set('state',         state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('yt-oauth-state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return response;
}
