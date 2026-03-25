import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const SESSION_DURATION = 3 * 24 * 60 * 60; // 3 days in seconds

export interface JWTPayload {
  userId: string;
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  role: string;
  sessionId: string;
}

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

export async function createSession(userId: string, payload: Omit<JWTPayload, 'sessionId'>) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);

  // Generate a stable session ID first so the token can reference it,
  // then insert everything in a single write — no 'pending' placeholder needed.
  const { randomBytes } = await import('crypto');
  const sessionId = randomBytes(16).toString('hex');

  const token = await createToken({ ...payload, sessionId });

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      token,
      expiresAt,
    },
  });

  return { token, session };
}

export async function validateSession(token: string) {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return { session, user: session.user, payload };
}

export async function deleteSession(sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}