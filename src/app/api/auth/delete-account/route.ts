// src/app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { deleteUser } from '@/modules/auth/auth.service';

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Deletes user + all relations via DB cascade (onDelete: Cascade on every User relation)
    await deleteUser(user.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
