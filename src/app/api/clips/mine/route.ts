// src/app/api/clips/mine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { getClipsByUser } from '@/modules/clips/clips.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clips = await getClipsByUser(user.id);
  return NextResponse.json({ clips });
}
