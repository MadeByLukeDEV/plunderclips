import { NextRequest } from 'next/server';
import { validateSession } from './auth';
import { User } from '@prisma/client';

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth-token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;

  const result = await validateSession(token);
  return result?.user || null;
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { user: null, error: 'Unauthorized' };
  }
  return { user, error: null };
}

export async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return { user: null, error: 'Unauthorized' };
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return { user: null, error: 'Forbidden' };
  }
  return { user, error: null };
}
