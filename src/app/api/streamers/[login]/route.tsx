// src/app/api/streamers/[login]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStreamer } from '@/modules/streamers/streamers.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ login: string }> },
) {
  const { login } = await params;
  const result = await getStreamer(login);

  if (!result) return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });

  return NextResponse.json({
    user: result.streamer,
    clips: result.clips,
    stats: result.stats,
  });
}
