// src/app/not-found.tsx
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-teal" />
        </div>
        <p className="font-display text-xs tracking-[0.3em] text-teal mb-3">404 — UNCHARTED WATERS</p>
        <h1 className="font-display text-5xl font-900 text-white mb-3">LOST AT SEA</h1>
        <div className="teal-divider max-w-xs mx-auto my-4" />
        <p className="text-white/40 font-body text-sm mb-8 leading-relaxed">
          This page doesn't exist or has drifted away. Let's get you back on course.
        </p>
        <Link href="/" className="btn-teal-solid px-8 py-3 rounded text-base inline-block">
          Back to PlunderClips
        </Link>
      </div>
    </div>
  );
}