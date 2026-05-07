// src/app/api/clips/featured/route.ts
import { NextResponse } from 'next/server';
import { getFeaturedClip } from '@/modules/clips/clips.service';

export const revalidate = 3600; // 1 hour ISR

export async function GET() {
  const clip = await getFeaturedClip();
  return NextResponse.json(
    { clip },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } },
  );
}
