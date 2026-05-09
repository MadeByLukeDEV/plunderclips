// src/modules/cron/cron.types.ts

export interface RefreshLiveResult {
  updated: number; // viewer counts refreshed
  fixed: number;   // stale "live" statuses corrected to offline
}

export interface RefreshCountResult {
  updated: number;
  total: number;
}

export interface RefreshStatsResult {
  youtube: RefreshCountResult;
  profiles: RefreshCountResult;
}
