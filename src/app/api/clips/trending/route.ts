// src/app/api/clips/trending/route.ts
import { NextResponse } from 'next/server';
import { getTrendingClips } from '@/modules/clips/clips.service';

export const revalidate = 1800; // 30 min ISR

export async function GET() {
  const clips = await getTrendingClips(8);
  return NextResponse.json(
    { clips },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300' } },
  );
}
