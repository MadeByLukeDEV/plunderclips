// src/modules/progress/progress.constants.ts

/** XP required to reach each level (index = level - 1). Level 1 = 0 XP. */
export const LEVEL_XP: readonly number[] = [
       0,  // 1
     100,  // 2
     300,  // 3
     600,  // 4
   1_000,  // 5
   1_500,  // 6
   2_200,  // 7
   3_100,  // 8
   4_200,  // 9
   5_500,  // 10
   7_200,  // 11
   9_200,  // 12
  11_700,  // 13
  14_700,  // 14
  18_200,  // 15
  22_700,  // 16
  27_700,  // 17
  33_200,  // 18
  39_700,  // 19
  47_200,  // 20
] as const;

/** Funny pirate-flavoured rank titles — nothing to do with permission roles. */
export const LEVEL_RANKS: readonly string[] = [
  'Shipwrecked Newcomer',      // 1
  'Bilge Rat',                 // 2
  'Deck Swabber',              // 3
  'Cannon Fodder',             // 4
  'Rum Sniffler',              // 5
  'Parrot Trainer',            // 6
  'Sea Legs McGee',            // 7
  "Crow's Nest Loiterer",      // 8
  'Kraken Bait',               // 9
  'Powder Monkey',             // 10
  'Ghost Ship Regular',        // 11
  'Cursed Barnacle',           // 12
  "Davy Jones' Intern",        // 13
  'Treasure Hoarder',          // 14
  'Master of the Seven Seas',  // 15
  'Fear of Neptune',           // 16
  'Admiral of Absolute Chaos', // 17
  'The Unsinkable',            // 18
  'Legend of the Deep',        // 19
  'THE KRAKEN ITSELF',         // 20
] as const;

export const MAX_LEVEL = LEVEL_XP.length;

/** XP awarded for each action. */
export const XP_REWARDS = {
  CLIP_SUBMITTED: 15,
  CLIP_APPROVED:  50,
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the level (1-based) a user is at given their total XP. */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
    else break;
  }
  return level;
}

/** Return the rank title for a given level. */
export function getRankFromLevel(level: number): string {
  return LEVEL_RANKS[Math.min(level, MAX_LEVEL) - 1] ?? LEVEL_RANKS[MAX_LEVEL - 1];
}

/**
 * XP progress within the current level.
 * Returns { current, needed, percent } where `current` is XP above the level
 * floor and `needed` is the XP gap to the next level.
 */
export function getLevelProgress(xp: number, level: number): {
  current: number;
  needed:  number;
  percent: number;
} {
  const floorXP  = LEVEL_XP[level - 1] ?? 0;
  const ceilXP   = LEVEL_XP[level] ?? floorXP; // at max level, no ceiling
  const current  = xp - floorXP;
  const needed   = ceilXP - floorXP;
  const percent  = needed > 0 ? Math.min(100, Math.round((current / needed) * 100)) : 100;
  return { current, needed, percent };
}
