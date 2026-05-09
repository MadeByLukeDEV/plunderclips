// src/app/api/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { getUserProgress } from '@/modules/progress/progress.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const progress = await getUserProgress(user.id);
  return NextResponse.json({ progress });
}
