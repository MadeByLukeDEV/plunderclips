// src/modules/progress/progress.service.ts

import { prisma } from '@/lib/prisma';
import {
  getLevelFromXP,
  getRankFromLevel,
  getLevelProgress,
  MAX_LEVEL,
} from './progress.constants';
import type { UserProgressDTO } from './progress.types';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getUserProgress(userId: string): Promise<UserProgressDTO> {
  const row = await prisma.userProgress.findUnique({ where: { userId } });
  const xp    = row?.xp ?? 0;
  const level = getLevelFromXP(xp);
  const rank  = getRankFromLevel(level);
  const { current, needed, percent } = getLevelProgress(xp, level);

  return {
    xp,
    level,
    rank,
    currentXP:  current,
    neededXP:   needed,
    percent,
    isMaxLevel: level >= MAX_LEVEL,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Award XP to a user. Upserts the progress row and recalculates level/rank.
 * Safe to call without awaiting — failures are non-fatal.
 */
export async function awardXP(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;

  const existing = await prisma.userProgress.findUnique({
    where: { userId },
    select: { xp: true },
  });

  const newXP    = (existing?.xp ?? 0) + amount;
  const newLevel = getLevelFromXP(newXP);
  const newRank  = getRankFromLevel(newLevel);

  await prisma.userProgress.upsert({
    where:  { userId },
    create: { userId, xp: newXP, level: newLevel, class: newRank },
    update: { xp: newXP, level: newLevel, class: newRank },
  });
}
