interface TagBadgeProps { tag: string; small?: boolean; }

const TAG_LABELS: Record<string, string> = {
  FUNNY: '😂 Funny', KILL: '⚔️ Kill', TUCK: '🐢 Tuck', HIGHLIGHT: '⭐ Highlight',
  PVP: '🏴‍☠️ PvP', PVE: '🐉 PvE', SAILING: '⛵ Sailing', TREASURE: '💰 Treasure', KEG: '💥 Keg',
  KRAKEN: '🐙 Kraken', MEGALODON: '🦈 Megalodon', EPIC_FAIL: '🤦 Epic Fail', TEAM_PLAY: '🤝 Team Play', SOLO: '🦅 Solo',
};

export function TagBadge({ tag, small }: TagBadgeProps) {
  return (
    <span className={`inline-flex items-center border rounded-sm font-mono tag-${tag} ${
      small ? 'text-xs px-1.5 py-0' : 'text-xs px-2.5 py-0.5'
    }`}>
      {TAG_LABELS[tag] || tag}
    </span>
  );
}

export { TAG_LABELS };