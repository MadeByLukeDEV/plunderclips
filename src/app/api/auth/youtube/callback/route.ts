// src/app/api/auth/youtube/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { prisma } from '@/lib/prisma';
import { fetchYouTubeChannelFromToken } from '@/modules/platform/youtube.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?error=youtube_oauth`);
  }

  // CSRF: verify state matches what we set in the login route
  const savedState = request.cookies.get('yt-oauth-state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/settings?error=youtube_state`);
  }

  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) {
    return NextResponse.redirect(`${appUrl}/api/auth/login`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  `${appUrl}/api/auth/youtube/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=youtube_token`);
    }

    // Fetch the authenticated user's YouTube channel
    const channel = await fetchYouTubeChannelFromToken(tokenData.access_token);
    if (!channel) {
      return NextResponse.redirect(`${appUrl}/settings?error=youtube_no_channel`);
    }

    // Prevent the same channel being linked to two accounts
    const existing = await prisma.userLinkedAccount.findFirst({
      where: { youtubeChannelId: channel.channelId, userId: { not: user.id } },
      select: { userId: true },
    });
    if (existing) {
      return NextResponse.redirect(`${appUrl}/settings?error=youtube_taken`);
    }

    await prisma.userLinkedAccount.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, youtubeChannelId: channel.channelId, youtubeChannelName: channel.channelName },
      update: { youtubeChannelId: channel.channelId, youtubeChannelName: channel.channelName },
    });

    const response = NextResponse.redirect(`${appUrl}/settings?linked=youtube`);
    response.cookies.delete('yt-oauth-state');
    return response;
  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?error=youtube_server`);
  }
}
