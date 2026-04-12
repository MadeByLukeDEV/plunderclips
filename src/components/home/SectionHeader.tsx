// src/components/home/SectionHeader.tsx
export function SectionHeader({ icon, label, sub }: {
  icon: React.ReactNode; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="text-teal">{icon}</div>
      <div>
        <h2 className="font-display text-xl md:text-2xl font-900 text-white tracking-wide">{label}</h2>
        {sub && <p className="text-white/30 text-xs font-body mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 teal-divider" />
    </div>
  );
}