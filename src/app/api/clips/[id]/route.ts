// src/app/api/clips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { getClipById, deleteClip, ClipServiceError } from '@/modules/clips/clips.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clip = await getClipById(id);
  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';
  const isSubmitter = clip.submittedBy === user.id;
  const isBroadcaster = clip.broadcasterName.toLowerCase() === user.twitchLogin.toLowerCase();

  if (!isStaff && !isSubmitter && !isBroadcaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await deleteClip(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ClipServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete clip error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
