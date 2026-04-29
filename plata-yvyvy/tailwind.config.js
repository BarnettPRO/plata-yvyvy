/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF9E6',
          100: '#FFEDB3',
          200: '#FFD966',
          300: '#FFC61A',
          400: '#E6AC00',
          500: '#B38600',
          600: '#806000',
          700: '#4D3A00',
          800: '#1A1300',
        },
        jungle: {
          50:  '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'coin-pop':    'coinPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'float':       'float 3s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.3s ease-out',
      },
      keyframes: {
        coinPop: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.4) rotate(10deg)' },
          '100%': { transform: 'scale(0) translateY(-40px)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,198,26,0.4)' },
          '50%':      { boxShadow: '0 0 24px rgba(255,198,26,0.8)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
