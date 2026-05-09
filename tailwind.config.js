/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00e5c0',
          dark:    '#00b89a',
          dim:     '#00e5c033',
        },
        sot: {
          bg:    '#0c0e10',
          dark:  '#111418',
          card:  '#161b20',
          card2: '#1c2228',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [
    // ── Fluid typography + spacing utilities via CSS clamp() ─────────────────
    plugin(function ({ addUtilities }) {
      addUtilities({
        // Fluid font sizes — scale smoothly between mobile and desktop
        '.text-fluid-xs':   { fontSize: 'clamp(0.7rem,  1.2vw + 0.1rem, 0.75rem)' },
        '.text-fluid-sm':   { fontSize: 'clamp(0.8rem,  1.5vw + 0.1rem, 0.875rem)' },
        '.text-fluid-base': { fontSize: 'clamp(0.875rem,1.8vw + 0.1rem, 1rem)' },
        '.text-fluid-lg':   { fontSize: 'clamp(1rem,    2vw  + 0.2rem, 1.125rem)' },
        '.text-fluid-xl':   { fontSize: 'clamp(1.125rem,2.5vw + 0.2rem, 1.5rem)' },
        '.text-fluid-2xl':  { fontSize: 'clamp(1.375rem,3vw  + 0.3rem, 2rem)' },
        '.text-fluid-3xl':  { fontSize: 'clamp(1.75rem, 4vw  + 0.4rem, 3rem)' },
        '.text-fluid-4xl':  { fontSize: 'clamp(2.25rem, 5vw  + 0.5rem, 4rem)' },
        '.text-fluid-hero': { fontSize: 'clamp(3.25rem, 9vw  + 0.5rem, 7rem)' },

        // Fluid gaps
        '.gap-fluid-xs': { gap: 'clamp(0.5rem,  1.5vw, 0.75rem)' },
        '.gap-fluid-sm': { gap: 'clamp(0.75rem, 2vw,   1rem)' },
        '.gap-fluid-md': { gap: 'clamp(1rem,    2.5vw, 1.5rem)' },
        '.gap-fluid-lg': { gap: 'clamp(1.5rem,  3.5vw, 2.5rem)' },

        // Fluid section vertical padding
        '.py-fluid-section': {
          paddingTop:    'clamp(2.5rem, 6vw, 5rem)',
          paddingBottom: 'clamp(2.5rem, 6vw, 5rem)',
        },

        // Fluid container horizontal padding
        '.px-fluid': {
          paddingLeft:  'clamp(1rem, 4vw, 1.5rem)',
          paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
        },

        // Scrollbar hide
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width':    'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    }),
  ],
};
