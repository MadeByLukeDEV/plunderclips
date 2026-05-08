// src/modules/challenges/challenges.types.ts
import type { ChallengeType } from '@prisma/client';

export type ChallengeDTO = {
  id:           string;
  title:        string;
  description:  string;
  type:         ChallengeType;
  target:       number;
  xpReward:     number;
  /** User's current progress toward the target (0 if not started) */
  userProgress: number;
  /** ISO string if completed, null otherwise */
  completedAt:  string | null;
};

export type WeeklyChallengesDTO = {
  weekStart:  string;
  weekEnd:    string;
  challenges: ChallengeDTO[];
};
