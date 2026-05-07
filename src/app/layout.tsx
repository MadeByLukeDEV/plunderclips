import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import Navbar from '@/components/layout/Navbar';
import { Barlow_Condensed, Barlow } from 'next/font/google';

// Load fonts via next/font — zero render blocking, automatic self-hosting
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  preload: true,
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-barlow',
  display: 'swap',
  preload: true,
});

const BASE_URL = process.env.NEXTAUTH_URL || 'https://plunderclips.gg';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'PlunderClips — Sea of Thieves Community Clips',
    template: '%s — PlunderClips',
  },
  description: 'PlunderClips is a Sea of Thieves community clip platform. Watch, submit, and discover the best Twitch, YouTube, and Medal.tv moments — PvP battles, kraken fights, treasure heists, and more from SoT streamers.',
  keywords: [
    'Sea of Thieves', 'SoT clips', 'SoT highlights', 'Sea of Thieves Twitch clips',
    'Sea of Thieves YouTube', 'PlunderClips', 'gaming clips', 'Sea of Thieves community',
    'SoT streamers', 'Sea of Thieves moments', 'pirate game clips',
  ],
  authors: [{ name: 'PlunderClips', url: BASE_URL }],
  creator: 'MadeByLuke',

  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'PlunderClips',
    title: 'PlunderClips — Sea of Thieves Community Clips',
    description: 'The finest Sea of Thieves moments from the seven seas — PvP battles, kraken fights, treasure heists, blunders, and brilliance.',
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'PlunderClips — Sea of Thieves Community Clips',
    }],
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PlunderClips — Sea of Thieves Community Clips',
    description: 'The finest Sea of Thieves moments from the seven seas — PvP battles, kraken fights, treasure heists, blunders, and brilliance.',
    images: ['/opengraph-image.png'],
    site: '@plunderclips',
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
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  alternates: { canonical: BASE_URL },

  category: 'gaming',
};

// Site-level JSON-LD injected once in the root layout
const siteJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PlunderClips',
    url: BASE_URL,
    logo: `${BASE_URL}/android-chrome-512x512.png`,
    description: 'PlunderClips is a community platform for Sea of Thieves clip discovery, submission, and sharing. Streamers and fans submit clips from Twitch, YouTube, and Medal.tv.',
    sameAs: [],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PlunderClips',
    url: BASE_URL,
    description: 'Community clip showcase for Sea of Thieves. Discover the best PvP battles, treasure heists, kraken fights, and funny moments from SoT streamers.',
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/streamers?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <head>
        {/* Preconnect to image CDNs — browser starts DNS+TLS early */}
        <link rel="preconnect" href="https://static-cdn.jtvnw.net" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://static-cdn.jtvnw.net" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://clips.twitch.tv" />
        {/* Site-level structured data — Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
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
                  <a href="/datenschutz" className="text-xs text-white/20 hover:text-teal font-display tracking-widest transition-colors">PRIVACY POLICY</a>
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
            fontFamily: 'var(--font-barlow-condensed), sans-serif',
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