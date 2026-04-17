/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization — whitelist all external domains used
  images: {
    // loader: "custom",
    // loaderFile: "./src/lib/imageLoader.ts",
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Twitch profile images + clip thumbnails
      {
        protocol: 'https',
        hostname: 'static-cdn.jtvnw.net',
      },
      {
        protocol: 'https',
        hostname: '**.jtvnw.net',
      },
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      // Google user content (YouTube channel avatars)
      {
        protocol: 'https',
        hostname: '**.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      // Medal.tv thumbnails
      {
        protocol: 'https',
        hostname: '**.medal.tv',
      },
      {
        protocol: 'https',
        hostname: 'medal.tv',
      },
    ],
  },

  // Security headers — applied to all routes
  async headers() {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer info sent to external sites
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Basic XSS protection for older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions policy — disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|svg|webp|woff|woff2)',
        
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(', ') || process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;