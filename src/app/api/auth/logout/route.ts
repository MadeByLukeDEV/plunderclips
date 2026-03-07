import { NextRequest, NextResponse } from 'next/server';
import { validateSession, deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (token) {
    const result = await validateSession(token);
    if (result) {
      await deleteSession(result.session.id);
    }
  }

  const response = NextResponse.redirect(`${appUrl}/`);
  response.cookies.delete('auth-token');
  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
