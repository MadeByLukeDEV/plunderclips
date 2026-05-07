// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/modules/auth/auth.service';
import { getTwitchProfileImage } from '@/lib/images';
import { getTwitchUser } from '@/modules/platform/twitch.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth_error`);
  }

  try {
    // ── Exchange code for token ───────────────────────────────────────────────
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  `${appUrl}/api/auth/callback`,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        `${appUrl}/login?error=token_error&detail=${encodeURIComponent(tokenData.message || 'unknown')}`
      );
    }

    // ── Fetch Twitch user ─────────────────────────────────────────────────────
    const twitchUser = await getTwitchUser(tokenData.access_token);
    if (!twitchUser) {
      return NextResponse.redirect(`${appUrl}/login?error=user_error`);
    }

    const profileImage = getTwitchProfileImage(twitchUser.profile_image_url, 150);

    // ── Upsert core user ──────────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { twitchId: twitchUser.id },
      update: {
        twitchLogin:  twitchUser.login.toLowerCase(),
        displayName:  twitchUser.display_name,
        profileImage,
        email:        twitchUser.email ?? null,
      },
      create: {
        twitchId:     twitchUser.id,
        twitchLogin:  twitchUser.login.toLowerCase(),
        displayName:  twitchUser.display_name,
        profileImage,
        email:        twitchUser.email ?? null,
        role:         'USER',
      },
    });

    // ── Upsert live status row (new schema — must exist for every user) ────────
    await prisma.userLiveStatus.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, isLive: false },
      update: {}, // never overwrite live status on login
    });

    // ── Create session ────────────────────────────────────────────────────────
    const { token } = await createSession(user.id, {
      userId:      user.id,
      twitchId:    user.twitchId,
      twitchLogin: user.twitchLogin,
      displayName: user.displayName,
      role:        user.role,
    });

    const response = NextResponse.redirect(`${appUrl}/dashboard`);
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   3 * 24 * 60 * 60,
      path:     '/',
    });

    return response;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/login?error=server_error`);
  }
}