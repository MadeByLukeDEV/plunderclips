import type { LucideIcon } from 'lucide-react';
import {
  Laugh, Hash, Zap, ThumbsDown,
  Star, Flame, Sparkles, Trophy,
  Swords, Shield, Hourglass,
  Anchor, Sword, Skull, Waves,
  EyeOff, Package, Lock, Ghost,
  Users, User, UserPlus, Compass,
  Octagon, Fish, Music, Castle, Ship, Crown,
  Navigation, Gem, Map,
  Mic, Heart, Shuffle,
} from 'lucide-react';

// ── Labels ────────────────────────────────────────────────────────────────────

export const TAG_LABELS: Record<string, string> = {
  // Humor
  FUNNY:      'Funny',
  MEME:       'Meme',
  CHAOS:      'Chaos',
  EPIC_FAIL:  'Epic Fail',
  // Skill
  HIGHLIGHT:  'Highlight',
  CLUTCH:     'Clutch',
  INSANE:     'Insane',
  SKILLFUL:   'Skillful',
  // Combat type
  PVP:        'PvP',
  PVE:        'PvE',
  HOURGLASS:  'Hourglass',
  // Ship combat
  SHIP_BATTLE: 'Ship Battle',
  BOARDING:   'Boarding',
  KILL:       'Kill',
  SINK:       'Sink',
  // Stealth
  TUCK:       'Tuck',
  STEAL:      'Steal',
  HEIST:      'Heist',
  SNEAKY:     'Sneaky',
  // Team size
  TEAM_PLAY:  'Team Play',
  SOLO:       'Solo',
  DUO:        'Duo',
  CREW:       'Crew',
  // PvE encounters
  KRAKEN:     'Kraken',
  MEGALODON:  'Megalodon',
  SIREN:      'Siren',
  FORT:       'Fort',
  FLEET:      'Fleet',
  BOSS_FIGHT: 'Boss Fight',
  // Exploration
  SAILING:    'Sailing',
  TREASURE:   'Treasure',
  ADVENTURE:  'Adventure',
  // Misc
  VOICE_CHAT: 'Voice Chat',
  WHOLESOME:  'Wholesome',
  UNEXPECTED: 'Unexpected',
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const TAG_ICONS: Record<string, LucideIcon> = {
  FUNNY:       Laugh,
  MEME:        Hash,
  CHAOS:       Zap,
  EPIC_FAIL:   ThumbsDown,
  HIGHLIGHT:   Star,
  CLUTCH:      Flame,
  INSANE:      Sparkles,
  SKILLFUL:    Trophy,
  PVP:         Swords,
  PVE:         Shield,
  HOURGLASS:   Hourglass,
  SHIP_BATTLE: Anchor,
  BOARDING:    Sword,
  KILL:        Skull,
  SINK:        Waves,
  TUCK:        EyeOff,
  STEAL:       Package,
  HEIST:       Lock,
  SNEAKY:      Ghost,
  TEAM_PLAY:   Users,
  SOLO:        User,
  DUO:         UserPlus,
  CREW:        Compass,
  KRAKEN:      Octagon,
  MEGALODON:   Fish,
  SIREN:       Music,
  FORT:        Castle,
  FLEET:       Ship,
  BOSS_FIGHT:  Crown,
  SAILING:     Navigation,
  TREASURE:    Gem,
  ADVENTURE:   Map,
  VOICE_CHAT:  Mic,
  WHOLESOME:   Heart,
  UNEXPECTED:  Shuffle,
};

// ── Category grouping (for structured pickers) ────────────────────────────────

export const TAG_CATEGORIES: { label: string; tags: string[] }[] = [
  { label: 'Humor',        tags: ['FUNNY', 'MEME', 'CHAOS', 'EPIC_FAIL'] },
  { label: 'Skill',        tags: ['HIGHLIGHT', 'CLUTCH', 'INSANE', 'SKILLFUL'] },
  { label: 'Combat',       tags: ['PVP', 'PVE', 'HOURGLASS'] },
  { label: 'Ship Combat',  tags: ['SHIP_BATTLE', 'BOARDING', 'KILL', 'SINK'] },
  { label: 'Stealth',      tags: ['TUCK', 'STEAL', 'HEIST', 'SNEAKY'] },
  { label: 'Team',         tags: ['TEAM_PLAY', 'SOLO', 'DUO', 'CREW'] },
  { label: 'PvE',          tags: ['KRAKEN', 'MEGALODON', 'SIREN', 'FORT', 'FLEET', 'BOSS_FIGHT'] },
  { label: 'Exploration',  tags: ['SAILING', 'TREASURE', 'ADVENTURE'] },
  { label: 'Misc',         tags: ['VOICE_CHAT', 'WHOLESOME', 'UNEXPECTED'] },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface TagBadgeProps { tag: string; small?: boolean; }

export function TagBadge({ tag, small }: TagBadgeProps) {
  const Icon = TAG_ICONS[tag];

  return (
    <span className={`inline-flex items-center border rounded-sm font-mono tag-${tag} ${
      small
        ? 'gap-0.5 text-[10px] px-1.5 py-0 leading-4'
        : 'gap-1 text-xs px-2 py-0.5'
    }`}>
      {Icon && <Icon className={small ? 'w-2.5 h-2.5 flex-shrink-0' : 'w-3 h-3 flex-shrink-0'} />}
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}
