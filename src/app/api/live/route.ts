// src/app/api/live/route.ts
import { NextResponse } from 'next/server';
import { getLiveStreamers } from '@/modules/streamers/streamers.service';

export async function GET() {
  const liveUsers = await getLiveStreamers();
  return NextResponse.json({ liveUsers });
}
