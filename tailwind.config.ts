import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Hand-drawn display face for the sketch aesthetic
        sketch: ['var(--font-sketch)', 'Comic Sans MS', 'cursive'],
        // Clean architectural hand for body copy
        hand: ['var(--font-hand)', 'ui-sans-serif', 'sans-serif'],
        sans: ['var(--font-hand)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Monochrome graphite-on-paper scale
        ink: {
          50: '#faf8f3', // paper
          100: '#efece3', // light pencil wash
          200: '#d8d3c7', // soft graphite line
          400: '#8a8578', // mid graphite
          600: '#3f3c36', // dark pencil
          800: '#1c1a17', // charcoal
          900: '#000000',
        },
        accent: { DEFAULT: '#1c1a17', hover: '#000000' },
        success: '#3f3c36', warn: '#8a8578', danger: '#1c1a17',
      },
      letterSpacing: { tightest: '-0.022em' },
      boxShadow: {
        // Soft graphite smudge shadows
        soft: '0 1px 2px rgba(28,26,23,0.05), 0 6px 18px rgba(28,26,23,0.06)',
        glass: '0 2px 0 rgba(255,255,255,0.5) inset, 0 10px 30px rgba(28,26,23,0.08)',
        sketch: '3px 3px 0 rgba(28,26,23,0.85)',
      },
      borderRadius: {
        // Hand-drawn irregular corners
        sketch: '255px 12px 225px 14px / 12px 225px 16px 235px',
      },
    },
  },
  plugins: [],
};

export default config;
