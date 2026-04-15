import type { Metadata } from 'next';
import './globals.css'
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';
const GOOGLE_VERIFICATION_ID = process.env.GOOGLE_VERIFICATION_ID || '';
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PlunderClips — Sea of Thieves Community Clips',
    template: '%s — PlunderClips',
  },
  description: 'The finest Sea of Thieves moments from the seven seas. Discover, submit and showcase the best Twitch clips from the SoT streaming community.',
  keywords: ['Sea of Thieves', 'SoT', 'Twitch clips', 'streaming', 'community', 'PlunderClips', 'gaming clips'],
  authors: [{ name: 'PlunderClips' }],
  creator: 'MadeByLuke',

  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'PlunderClips',
    title: 'PlunderClips — Sea of Thieves Community Clips',
    description: 'The finest Sea of Thieves moments from the seven seas — battles, blunders, and brilliance.',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'PlunderClips' }],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PlunderClips — Sea of Thieves Community Clips',
    description: 'The finest Sea of Thieves moments from the seven seas — battles, blunders, and brilliance.',
    images: ['/android-chrome-512x512.png'],
  },

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },

  manifest: '/site.webmanifest',

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },

  alternates: {
    canonical: BASE_URL,
  },

  // Verification — add your Google Search Console verification token here
  verification: {
    google: GOOGLE_VERIFICATION_ID,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-white/5 py-8 text-center">
                <p className="font-display text-sm text-white/20 tracking-widest mb-3">
                  PLUNDERCLIPS — SAIL. PLUNDER. CLIP.
                </p>
                <div className="flex items-center justify-center gap-6 mb-3">
                  <Link href="/privacy" className="text-xs text-white/20 hover:text-teal font-display tracking-widest transition-colors">PRIVACY POLICY</Link>
                </div>
                <p className="text-xs text-white/10 font-body">Not affiliated with Rare or Xbox Game Studios</p>
              </footer>
            </div>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#161b20',
            color: '#d4dde6',
            border: '1px solid rgba(0,229,192,0.2)',
            fontFamily: 'Barlow Condensed, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          success: { iconTheme: { primary: '#00e5c0', secondary: '#161b20' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#161b20' } },
        }} />
      </body>
    </html>
  );
}