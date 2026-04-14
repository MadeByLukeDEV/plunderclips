// src/app/error.tsx
'use client';
import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in future
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="font-display text-xs tracking-[0.3em] text-red-400/60 mb-3">SOMETHING WENT WRONG</p>
        <h1 className="font-display text-4xl font-900 text-white mb-3">TROUBLED WATERS</h1>
        <div className="teal-divider max-w-xs mx-auto my-4" />
        <p className="text-white/40 font-body text-sm mb-8 leading-relaxed">
          An unexpected error occurred. The crew has been notified.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-teal px-6 py-2.5 rounded text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />Try Again
          </button>
          <a href="/" className="btn-teal-solid px-6 py-2.5 rounded text-sm inline-block">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}