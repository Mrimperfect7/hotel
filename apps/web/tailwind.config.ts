import type { Config } from 'tailwindcss';

/**
 * Namma Guruvayoor design tokens.
 * Deep temple blue · warm gold · ivory · subtle Kerala green.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        temple: {
          50: '#eef3fb',
          100: '#d9e4f5',
          200: '#b3c9ea',
          300: '#7fa3d9',
          400: '#4d76b8',
          500: '#2b5597',
          600: '#1e3a6e', // primary deep temple blue
          700: '#172d57',
          800: '#111f3c',
          900: '#0b1526',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9ecc8',
          200: '#f2d88a',
          300: '#e8bf4f',
          400: '#dfa92c',
          500: '#c98d1a', // warm gold
          600: '#a86d12',
          700: '#865112',
          800: '#6e4017',
          900: '#5e3516',
        },
        ivory: '#faf6ec',
        kerala: {
          100: '#dcf2e3',
          300: '#8fd3a8',
          500: '#3f9d63',
          600: '#2f7f4e',
          700: '#26653f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(17, 31, 60, 0.08)',
        lift: '0 8px 28px rgba(17, 31, 60, 0.14)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
export default config;
