// src/modules/progress/progress.types.ts

export type UserProgressDTO = {
  xp:            number;
  level:         number;
  rank:          string;
  /** XP earned within the current level */
  currentXP:     number;
  /** XP needed to reach the next level */
  neededXP:      number;
  /** 0-100 fill percentage for the progress bar */
  percent:       number;
  isMaxLevel:    boolean;
};
