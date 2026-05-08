// src/modules/challenges/challenges.service.ts

import { prisma } from '@/lib/prisma';
import type { ChallengeType } from '@prisma/client';
import { awardXP } from '@/modules/progress/progress.service';
import type { WeeklyChallengesDTO } from './challenges.types';

// ── Weekly templates ──────────────────────────────────────────────────────────

const WEEKLY_TEMPLATES = [
  {
    title:       'Sea Legs',
    description: 'Submit 3 clips this week',
    type:        'SUBMIT_CLIPS' as ChallengeType,
    target:      3,
    xpReward:    75,
  },
  {
    title:       'Seal of Approval',
    description: 'Get 2 clips approved by the crew',
    type:        'GET_APPROVED' as ChallengeType,
    target:      2,
    xpReward:    100,
  },
  {
    title:       'View Hungry',
    description: 'Earn 250 views on newly approved clips',
    type:        'REACH_VIEWS' as ChallengeType,
    target:      250,
    xpReward:    150,
  },
] as const;

// ── Week helpers ──────────────────────────────────────────────────────────────

/** Returns the Monday 00:00 UTC of the week containing `date`. */
export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust so Monday = 0
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns the Sunday 23:59:59 UTC of the week containing `date`. */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getWeeklyChallenges(userId: string): Promise<WeeklyChallengesDTO> {
  const weekStart = getWeekStart();
  const weekEnd   = getWeekEnd(weekStart);

  // Ensure this week's challenges exist
  await seedWeeklyChallenges(weekStart, weekEnd);

  const challenges = await prisma.challenge.findMany({
    where: {
      active:    true,
      weekStart: { lte: weekEnd },
      weekEnd:   { gte: weekStart },
    },
    include: {
      entries: {
        where: { userId },
      },
    },
    orderBy: { xpReward: 'asc' },
  });

  return {
    weekStart: weekStart.toISOString(),
    weekEnd:   weekEnd.toISOString(),
    challenges: challenges.map((c) => {
      const entry = c.entries[0] ?? null;
      return {
        id:           c.id,
        title:        c.title,
        description:  c.description,
        type:         c.type,
        target:       c.target,
        xpReward:     c.xpReward,
        userProgress: entry?.progress ?? 0,
        completedAt:  entry?.completedAt?.toISOString() ?? null,
      };
    }),
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Increment a user's progress on all active challenges of a given type.
 * Awards XP automatically when a challenge is completed for the first time.
 */
export async function incrementChallengeProgress(
  userId: string,
  type:   ChallengeType,
  amount = 1,
): Promise<void> {
  const weekStart = getWeekStart();
  const weekEnd   = getWeekEnd(weekStart);

  const challenges = await prisma.challenge.findMany({
    where: {
      active: true,
      type,
      weekStart: { lte: weekEnd },
      weekEnd:   { gte: weekStart },
    },
    select: { id: true, target: true, xpReward: true },
  });

  for (const challenge of challenges) {
    const entry = await prisma.userChallenge.upsert({
      where:  { userId_challengeId: { userId, challengeId: challenge.id } },
      create: { userId, challengeId: challenge.id, progress: amount },
      update: { progress: { increment: amount } },
    });

    // Re-fetch to get the updated value
    const updated = await prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      select: { progress: true, completedAt: true },
    });

    // Complete if reached target for the first time
    if (updated && updated.progress >= challenge.target && !updated.completedAt) {
      await prisma.userChallenge.update({
        where: { userId_challengeId: { userId, challengeId: challenge.id } },
        data:  { completedAt: new Date() },
      });
      await awardXP(userId, challenge.xpReward);
    }
  }
}

/**
 * Seed this week's challenges if they don't already exist.
 * Safe to call on every request — idempotent.
 */
export async function seedWeeklyChallenges(weekStart: Date, weekEnd: Date): Promise<void> {
  const existing = await prisma.challenge.count({
    where: { weekStart, weekEnd, active: true },
  });
  if (existing >= WEEKLY_TEMPLATES.length) return;

  await prisma.challenge.createMany({
    data: WEEKLY_TEMPLATES.map((t) => ({
      title:       t.title,
      description: t.description,
      type:        t.type,
      target:      t.target,
      xpReward:    t.xpReward,
      weekStart,
      weekEnd,
      active:      true,
    })),
    skipDuplicates: true,
  });
}

/**
 * Deactivate the previous week's challenges and seed the new ones.
 * Called by the weekly cron job.
 */
export async function resetWeeklyChallenges(): Promise<{ deactivated: number; created: number }> {
  const weekStart = getWeekStart();
  const weekEnd   = getWeekEnd(weekStart);

  const { count: deactivated } = await prisma.challenge.updateMany({
    where: { weekStart: { lt: weekStart }, active: true },
    data:  { active: false },
  });

  const before = await prisma.challenge.count({ where: { weekStart, weekEnd, active: true } });
  await seedWeeklyChallenges(weekStart, weekEnd);
  const after  = await prisma.challenge.count({ where: { weekStart, weekEnd, active: true } });

  return { deactivated, created: after - before };
}
