// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL || 'https://plunderclips.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/submit',
          '/settings',
          '/api/',
          '/login',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}