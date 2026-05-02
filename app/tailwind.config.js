module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.9rem' }],
      },
      colors: {
        // Semantic surface tokens
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f9fafb',
          overlay: '#f3f4f6',
        },
        'surface-dark': {
          DEFAULT: '#0f1117',
          raised: '#161b22',
          overlay: '#1c2128',
        },
        // Brand blue
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8f',
          950: '#172554',
        },
      },
      boxShadow: {
        card:       '0 1px 2px 0 rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
        'card-md':  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg':  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'glow-blue':'0 0 0 3px rgba(59,130,246,0.25)',
        'glow-purple':'0 0 0 3px rgba(139,92,246,0.25)',
        nav:        '0 1px 0 0 rgba(0,0,0,0.08)',
      },
      animation: {
        spin:        'spin 1s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
        'fade-in':   'fadeIn 0.35s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        shimmer:     'shimmer 1.6s linear infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
