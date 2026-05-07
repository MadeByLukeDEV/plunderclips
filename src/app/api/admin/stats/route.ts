// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/modules/auth/auth.middleware';
import { getAdminStats } from '@/modules/admin/admin.service';

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { stats, recentPending } = await getAdminStats();
  return NextResponse.json({ stats, recentPending });
}
