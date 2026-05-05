// src/modules/auth/auth.service.ts
// Core JWT + session logic — no HTTP concerns here

import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import type { JWTPayload, SessionResult, AuthUser } from './auth.types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export const SESSION_DURATION = 3 * 24 * 60 * 60; // 3 days in seconds

// ── Token ─────────────────────────────────────────────────────────────────────

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  payload: Omit<JWTPayload, 'sessionId'>
): Promise<{ token: string }> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);
  const { randomBytes } = await import('crypto');
  const sessionId = randomBytes(16).toString('hex');
  const token = await createToken({ ...payload, sessionId });

  await prisma.session.create({
    data: { id: sessionId, userId, token, expiresAt },
  });

  return { token };
}

export async function validateSession(token: string): Promise<SessionResult | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        select: {
          id:           true,
          twitchId:     true,
          twitchLogin:  true,
          displayName:  true,
          profileImage: true,
          role:         true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    session,
    user: session.user as AuthUser,
    payload,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}