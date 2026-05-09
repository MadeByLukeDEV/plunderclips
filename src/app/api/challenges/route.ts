// src/app/api/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { getWeeklyChallenges } from '@/modules/challenges/challenges.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await getWeeklyChallenges(user.id);
  return NextResponse.json(data);
}
