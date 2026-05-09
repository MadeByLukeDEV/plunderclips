// src/app/api/clips/picker/twitch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { fetchUserClips } from '@/modules/platform/twitch.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
  const result = await fetchUserClips(user.twitchId, { cursor });
  return NextResponse.json(result);
}
