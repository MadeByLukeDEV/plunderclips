// src/app/loading.tsx
// Shows during page navigation transitions
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated teal ring */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal animate-spin" />
        </div>
        <p className="font-display text-xs tracking-[0.3em] text-white/20">SAILING...</p>
      </div>
    </div>
  );
}