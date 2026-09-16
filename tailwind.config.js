/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#050608',
          50: '#1a1d24',
          100: '#14171c',
          200: '#0f1217',
          300: '#0b0d11',
          400: '#08090d',
          500: '#050608',
          900: '#020304',
        },
        luxury: {
          emerald: '#112E24',
          'emerald-light': '#183F32',
          'emerald-dark': '#0B1F18',
          gold: '#C5A880',
          'gold-light': '#D6BF9F',
          'gold-dark': '#A8895E',
          cream: '#FAF8F5',
          sand: '#F3EFEA',
          linen: '#EBE5DC',
          charcoal: '#1A221E',
          taupe: '#627068',
          border: '#E8E2D8',
        },
        medical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#112E24',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          800: '#102a43',
          900: '#0b1d3a',
        }
      },
      boxShadow: {
        // Shadows BRRR - 3-layer soft ambient blur standard
        'luxury-sm': '0 1px 2px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.04)',
        'luxury-md': '0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.05)',
        'luxury-lg': '0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.06)',
        'glow-gold': '0 0 20px rgba(197, 168, 128, 0.25)',
        'glow-emerald': '0 0 24px rgba(17, 46, 36, 0.35)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-beam': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.92', transform: 'scale(1.02)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2.2s infinite linear',
        'border-beam': 'border-beam 6s linear infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
