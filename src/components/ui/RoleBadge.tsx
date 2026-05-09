// src/components/ui/RoleBadge.tsx
// Rich role badge with pirate name, lucide icon, and per-role glow effects.
import type { LucideIcon } from 'lucide-react';
import {
  Crown, Sparkles, Shield, Compass,
  BadgeCheck, Gem, Coins, Trophy, Anchor,
} from 'lucide-react';
import { ROLE_META } from '@/modules/auth/auth.roles';
import type { RoleKey } from '@/modules/auth/auth.roles';

// ── Icon map ──────────────────────────────────────────────────────────────────

const ROLE_ICONS: Record<RoleKey, LucideIcon> = {
  ADMIN:       Crown,
  FEATURED:    Sparkles,
  MODERATOR:   Shield,
  PARTNER:     Compass,
  VERIFIED:    BadgeCheck,
  VIP:         Gem,
  SUPPORTER:   Coins,
  CONTRIBUTOR: Trophy,
  USER:        Anchor,
};

// ── Size variants ─────────────────────────────────────────────────────────────

const SIZES = {
  xs: { wrap: 'gap-0.5 px-1.5 py-0.5 text-[9px]',  icon: 'w-2.5 h-2.5' },
  sm: { wrap: 'gap-1   px-2   py-0.5 text-[10px]',  icon: 'w-3   h-3' },
  md: { wrap: 'gap-1   px-2.5 py-1   text-xs',       icon: 'w-3.5 h-3.5' },
  lg: { wrap: 'gap-1.5 px-3   py-1.5 text-sm',       icon: 'w-4   h-4' },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role:     string;
  size?:    keyof typeof SIZES;
  /** Show role key in parentheses after the name — useful in admin contexts */
  showKey?: boolean;
}

export function RoleBadge({ role, size = 'sm', showKey = false }: RoleBadgeProps) {
  const key  = role as RoleKey;
  const meta = ROLE_META[key] ?? ROLE_META.USER;
  const Icon = ROLE_ICONS[key] ?? ROLE_ICONS.USER;
  const sz   = SIZES[size];

  return (
    <span
      className={`
        inline-flex items-center font-display tracking-wider border rounded-sm
        flex-shrink-0 relative
        ${sz.wrap} ${meta.cls} ${meta.cssClass}
      `}
    >
      <Icon className={`${sz.icon} flex-shrink-0`} />
      {meta.label}
      {showKey && (
        <span className="opacity-50 font-mono normal-case tracking-normal ml-0.5">
          ({role})
        </span>
      )}
    </span>
  );
}

// ── Tooltip variant — shows role description on hover ────────────────────────

export function RoleBadgeWithTooltip({ role, size = 'sm' }: { role: string; size?: keyof typeof SIZES }) {
  const key  = role as RoleKey;
  const meta = ROLE_META[key] ?? ROLE_META.USER;

  return (
    <span className="relative group/role inline-flex">
      <RoleBadge role={role} size={size} />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[var(--bg-card2)] border border-white/10 rounded text-[10px] font-mono text-white/60 whitespace-nowrap opacity-0 group-hover/role:opacity-100 transition-opacity pointer-events-none z-10">
        {meta.badge}
      </span>
    </span>
  );
}
