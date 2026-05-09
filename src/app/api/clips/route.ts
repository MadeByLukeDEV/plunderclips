// src/app/api/clips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleCors, withCors } from '@/lib/cors';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { submitClipSchema } from '@/modules/clips/clips.schema';
import { getClips, submitClip, ClipServiceError } from '@/modules/clips/clips.service';
import type { ClipFilters, PaginationInput } from '@/modules/clips/clips.types';
import { Tag, Platform } from '@prisma/client';

export async function GET(request: NextRequest) {
  const corsCheck = handleCors(request);
  if (corsCheck) return corsCheck;

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
  const tag      = searchParams.get('tag')      as Tag | null;
  const platform = searchParams.get('platform') as Platform | null;
  const search   = searchParams.get('search')   || '';
  const sort     = searchParams.get('sort') === 'popular' ? 'popular' : 'newest';

  const filters: ClipFilters   = { tag, platform, search: search || undefined, sort };
  const pagination: PaginationInput = { page, limit };

  const result = await getClips(filters, pagination);

  return withCors(
    NextResponse.json({ clips: result.items, pagination: result.pagination }),
    request.headers.get('origin'),
  );
}

export async function POST(request: NextRequest) {
  const corsCheck = handleCors(request);
  if (corsCheck) return corsCheck;

  const origin = request.headers.get('origin');

  const { user, error } = await requireAuth(request);
  if (error || !user) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), origin);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return withCors(NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }), origin); }

  // Support legacy twitchUrl field
  if (body && typeof body === 'object' && 'twitchUrl' in body && !('clipUrl' in body)) {
    (body as Record<string, unknown>).clipUrl = (body as Record<string, unknown>).twitchUrl;
  }

  const parsed = submitClipSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 }),
      origin,
    );
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const clip = await submitClip({
      clipUrl: parsed.data.clipUrl,
      tags: parsed.data.tags,
      submittedById: user.id,
      submittedByName: user.displayName,
      appUrl,
    });

    const message =
      clip.platform === 'MEDAL'
        ? 'Medal.tv clip submitted! It will be manually reviewed by the crew.'
        : 'Clip submitted! It will be reviewed shortly.';

    return withCors(NextResponse.json({ clip, message }, { status: 201 }), origin);
  } catch (err) {
    if (err instanceof ClipServiceError) {
      return withCors(NextResponse.json({ error: err.message }, { status: err.status }), origin);
    }
    console.error('Clip submission error:', err);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}
