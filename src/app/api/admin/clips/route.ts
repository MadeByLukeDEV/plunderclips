// src/app/api/admin/clips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/modules/auth/auth.middleware';
import { reviewClipSchema } from '@/modules/clips/clips.schema';
import { getClipsForModeration, reviewClip, ClipServiceError } from '@/modules/clips/clips.service';
import type { PaginationInput } from '@/modules/clips/clips.types';
import { ClipStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ClipStatus | null;
  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit  = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const pagination: PaginationInput = { page, limit };
  const result = await getClipsForModeration(status, pagination);

  return NextResponse.json({ clips: result.items, pagination: result.pagination });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireStaff(request);
  if (error || !user) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

  const clipId = new URL(request.url).searchParams.get('id');
  if (!clipId) return NextResponse.json({ error: 'Clip ID required' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = reviewClipSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

  try {
    const clip = await reviewClip(clipId, {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
      reviewedById: user.id,
    });
    return NextResponse.json({ clip });
  } catch (err) {
    if (err instanceof ClipServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Review clip error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
