// src/app/api/admin/fix-thumbnails/route.ts
// One-time migration endpoint — fixes Twitch clip thumbnails stored with %{width}x%{height} placeholders
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/auth/auth.middleware';
import { fixTwitchThumbnails } from '@/modules/admin/admin.service';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await fixTwitchThumbnails();
  return NextResponse.json({ ok: true, ...result });
}
