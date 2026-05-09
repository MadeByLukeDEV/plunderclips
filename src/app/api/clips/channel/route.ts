// src/app/api/clips/channel/route.ts
// Returns approved clips from the logged-in user's channel, submitted by others
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { getChannelClips } from '@/modules/clips/clips.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clips = await getChannelClips(user.id, user.twitchLogin);
  return NextResponse.json({ clips });
}
