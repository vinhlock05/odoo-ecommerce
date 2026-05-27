import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fashionos: {
          // Core palette
          black: '#0A0A0A',
          white: '#FAFAFA',
          accent: '#C8A96E',   // gold
          muted: '#6B7280',
          surface: '#F4F4F4',
          border: '#E5E5E5',
          // CoolClub tiers
          bronze: '#CD7F32',
          silver: '#A8A9AD',
          gold: '#FFD700',
          diamond: '#B9F2FF',
          // Semantic
          success: '#16A34A',
          danger: '#DC2626',
          warning: '#D97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      animation: {
        'marquee': 'marquee 32s linear infinite',
        'fade-up': 'fade-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.45s ease both',
        'slide-right': 'slide-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
