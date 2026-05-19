// src/modules/cron/cron.types.ts

export interface RefreshLiveResult {
  updated: number; // viewer counts refreshed
  fixed: number;   // stale "live" statuses corrected via Twitch API comparison
  swept: number;   // stale "live" statuses cleared by age (liveUpdatedAt > 2h old)
}

export interface RefreshCountResult {
  updated: number;
  total: number;
}

export interface RefreshStatsResult {
  youtube: RefreshCountResult;
  profiles: RefreshCountResult;
}
