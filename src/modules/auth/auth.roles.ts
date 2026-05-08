// src/modules/auth/auth.roles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for role metadata.
// Import this everywhere instead of duplicating badge/weight/permission logic.
// ─────────────────────────────────────────────────────────────────────────────

export type RoleKey =
  | 'ADMIN'
  | 'FEATURED'
  | 'MODERATOR'
  | 'PARTNER'
  | 'VERIFIED'
  | 'VIP'
  | 'SUPPORTER'
  | 'CONTRIBUTOR'
  | 'USER';

// ── Per-role metadata ─────────────────────────────────────────────────────────

export type RoleMeta = {
  label:    string;   // pirate-themed display name
  badge:    string;   // short uppercase badge text
  cls:      string;   // Tailwind base classes (text + border + bg)
  cssClass: string;   // extra CSS class for glow/animation effects
  weight:   number;   // sort priority — lower renders first
  isLive:   boolean;  // shown in live section when streaming
  isStaff:  boolean;  // can access admin panel
};

export const ROLE_META: Record<RoleKey, RoleMeta> = {
  ADMIN: {
    label:    'Captain',
    badge:    'CAPTAIN',
    cls:      'text-red-300 border-red-500/55 bg-red-500/18',
    cssClass: 'role-captain',
    weight:   0,
    isLive:   true,
    isStaff:  true,
  },
  FEATURED: {
    label:    'Pirate Legend',
    badge:    'LEGEND',
    cls:      'text-yellow-200 border-yellow-400/65 bg-yellow-400/18',
    cssClass: 'role-legend',
    weight:   1,
    isLive:   true,
    isStaff:  false,
  },
  MODERATOR: {
    label:    'First Mate',
    badge:    'MOD',
    cls:      'text-emerald-300 border-emerald-500/50 bg-emerald-500/15',
    cssClass: 'role-moderator',
    weight:   2,
    isLive:   false,
    isStaff:  true,
  },
  PARTNER: {
    label:    'Navigator',
    badge:    'PARTNER',
    cls:      'text-violet-300 border-violet-500/50 bg-violet-500/18',
    cssClass: 'role-partner',
    weight:   3,
    isLive:   true,
    isStaff:  false,
  },
  VERIFIED: {
    label:    'Sea Dog',
    badge:    'VERIFIED',
    cls:      'text-cyan-300 border-cyan-400/55 bg-cyan-500/15',
    cssClass: 'role-verified',
    weight:   4,
    isLive:   true,
    isStaff:  false,
  },
  VIP: {
    label:    'Privateer',
    badge:    'VIP',
    cls:      'text-orange-300 border-orange-500/55 bg-orange-500/18',
    cssClass: 'role-vip',
    weight:   5,
    isLive:   true,
    isStaff:  false,
  },
  SUPPORTER: {
    label:    'Gold Hoarder',
    badge:    'SUPPORTER',
    cls:      'text-pink-300 border-pink-500/50 bg-pink-500/18',
    cssClass: 'role-supporter',
    weight:   6,
    isLive:   false,
    isStaff:  false,
  },
  CONTRIBUTOR: {
    label:    'Plunderer',
    badge:    'CREW+',
    cls:      'text-lime-300 border-lime-500/50 bg-lime-500/15',
    cssClass: 'role-contributor',
    weight:   7,
    isLive:   false,
    isStaff:  false,
  },
  USER: {
    label:    'Deckhand',
    badge:    'CREW',
    cls:      'text-slate-400 border-slate-500/25 bg-slate-500/10',
    cssClass: 'role-user',
    weight:   8,
    isLive:   false,
    isStaff:  false,
  },
};

// ── Derived sets (computed once, used across the codebase) ────────────────────

/** All roles sorted by display priority */
export const ALL_ROLES = (Object.keys(ROLE_META) as RoleKey[]).sort(
  (a, b) => ROLE_META[a].weight - ROLE_META[b].weight,
);

/** Roles that appear in the live streamers section */
export const LIVE_ROLES: RoleKey[] = ALL_ROLES.filter(r => ROLE_META[r].isLive);

/** Roles that can access the admin panel */
export const STAFF_ROLES: RoleKey[] = ALL_ROLES.filter(r => ROLE_META[r].isStaff);

/** Role order for admin dropdowns (least-privileged first) */
export const ROLE_DROPDOWN_ORDER: RoleKey[] = [
  'USER', 'CONTRIBUTOR', 'SUPPORTER', 'VIP', 'VERIFIED', 'PARTNER', 'MODERATOR', 'FEATURED', 'ADMIN',
];

/** Role weight for streamer sorting */
export function roleWeight(role: string): number {
  return ROLE_META[role as RoleKey]?.weight ?? 99;
}
