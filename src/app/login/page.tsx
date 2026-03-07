'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERRORS: Record<string, string> = {
  oauth_error:  'Authorization was denied by Twitch',
  token_error:  'Failed to exchange authorization code',
  user_error:   'Could not retrieve Twitch user info',
  server_error: 'A server error occurred — please try again',
};

function LoginContent() {
  const params = useSearchParams();
  const error = params.get('error');
  const detail = params.get('detail');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-900 text-white leading-none">
            PLUNDER<span className="teal-heading">CLIPS</span>
          </h1>
          <div className="teal-divider max-w-[120px] mx-auto mt-3 mb-4" />
          <p className="text-white/40 text-sm font-body">Community clip showcase for Sea of Thieves streamers</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm font-display tracking-wide">
            {ERRORS[error] || 'An error occurred'}
            {detail && <div className="mt-1 text-xs opacity-60 font-mono normal-case">{detail}</div>}
          </div>
        )}

        <a href="/api/auth/login" className="btn-teal-solid w-full py-3.5 rounded flex items-center justify-center gap-3 text-base mb-6">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          Sign in with Twitch
        </a>

        <div className="sot-card rounded p-4">
          <p className="font-display text-xs text-teal tracking-widest mb-3">CREW BENEFITS</p>
          <ul className="space-y-2 text-sm text-white/40 font-body">
            <li className="flex gap-2"><span className="text-teal">→</span> Submit Sea of Thieves clips</li>
            <li className="flex gap-2"><span className="text-teal">→</span> Browse the community gallery</li>
            <li className="flex gap-2"><span className="text-teal">→</span> Tag and categorize moments</li>
            <li className="flex gap-2"><span className="text-teal">→</span> Track your submission status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-display text-white/20 text-2xl">LOADING...</div>}>
      <LoginContent />
    </Suspense>
  );
}