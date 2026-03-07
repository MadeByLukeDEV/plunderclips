import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      twitchId: user.twitchId,
      twitchLogin: user.twitchLogin,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}
