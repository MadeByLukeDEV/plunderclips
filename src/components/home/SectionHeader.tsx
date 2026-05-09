// src/components/home/SectionHeader.tsx
export function SectionHeader({ icon, label, sub, action }: {
  icon:    React.ReactNode;
  label:   string;
  sub?:    string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-[clamp(1.25rem,3vw,2rem)]">
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-fluid-2xl font-900 text-white tracking-wide leading-none">{label}</h2>
        {sub && <p className="text-white/30 text-fluid-xs font-body mt-0.5 tracking-wide">{sub}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      <div className="hidden sm:block flex-1 teal-divider max-w-[180px]" />
    </div>
  );
}
