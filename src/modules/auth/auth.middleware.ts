// src/modules/auth/auth.middleware.ts
// Request-level auth guards — used by all API routes

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from './auth.service';
import type { AuthUser } from './auth.types';

type AuthResult =
  | { user: AuthUser; error: null }
  | { user: null;     error: string };

// ── Token extraction ──────────────────────────────────────────────────────────

function extractToken(request: NextRequest): string | null {
  return (
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    null
  );
}

// ── Guards ────────────────────────────────────────────────────────────────────

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) return null;
  const result = await validateSession(token);
  return result?.user ?? null;
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const user = await getCurrentUser(request);
  if (!user) return { user: null, error: 'Unauthorized' };
  return { user, error: null };
}

// Admin only
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const user = await getCurrentUser(request);
  if (!user)                  return { user: null, error: 'Unauthorized' };
  if (user.role !== 'ADMIN')  return { user: null, error: 'Forbidden' };
  return { user, error: null };
}

// Admin OR Moderator — use this for clip moderation routes
export async function requireStaff(request: NextRequest): Promise<AuthResult> {
  const user = await getCurrentUser(request);
  if (!user) return { user: null, error: 'Unauthorized' };
  if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return { user: null, error: 'Forbidden' };
  }
  return { user, error: null };
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
