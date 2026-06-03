/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        genesis: {
          copper: '#C4956A',
          gold: '#D4AF37',
          silver: '#C0C0C0',
          black: '#0D0D0D',
          charcoal: '#1A1A1A',
          dark: '#111111',
          panel: '#1E1E1E',
          border: '#2A2A2A',
          muted: '#6B6B6B',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'orb-pulse': 'orbPulse 1.5s ease-in-out infinite',
        'waveform': 'waveform 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(196, 149, 106, 0.4)' },
          '50%': { transform: 'scale(1.12)', boxShadow: '0 0 60px rgba(196, 149, 106, 0.8)' },
        },
        waveform: {
          '0%, 100%': { scaleY: 0.3 },
          '50%': { scaleY: 1 },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
