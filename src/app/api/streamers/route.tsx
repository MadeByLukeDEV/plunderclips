// src/app/api/streamers/route.ts
import { NextResponse } from 'next/server';
import { getAllStreamers } from '@/modules/streamers/streamers.service';

export async function GET() {
  const streamers = await getAllStreamers();
  return NextResponse.json({ streamers });
}
