/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#faf9f5',
          raised:  '#ffffff',
          overlay: '#ede9de',
          border:  '#dad9d4',
          hover:   '#f5f4ee',
        },
        accent: {
          50:  '#fdf2ed',
          100: '#fce0d4',
          200: '#f5c4a8',
          300: '#e9a07a',
          400: '#d97757',
          500: '#c96442',
          600: '#b05730',
          700: '#9a4a28',
          800: '#7d3d22',
          900: '#66321c',
        },
        text: {
          primary:   '#3d3929',
          secondary: '#535146',
          muted:     '#83827d',
        },
        sidebar: {
          DEFAULT: '#f5f4ee',
          light:   '#faf9f5',
          border:  '#dad9d4',
          text:    '#3d3929',
          muted:   '#83827d',
          active:  '#c96442',
        },
        success: {
          50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
        },
        danger: {
          50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
        },
        chart: {
          gain:    '#10B981',
          loss:    '#EF4444',
          neutral: '#dad9d4',
        },
      },
      fontFamily: {
        sans: ['"Aptos Display"', 'Aptos', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Aptos Display"', 'Aptos', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.8125rem', { lineHeight: '1.25rem' }],
        sm:   ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1rem',      { lineHeight: '1.625rem' }],
        lg:   ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:   ['1.3125rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'glow':    '0 0 20px rgba(201,100,66,0.1)',
        'glass':   '0 1px 3px rgba(0,0,0,0.06)',
        'mercury': '0 1px 2px rgba(0,0,0,0.04)',
        'mercury-lg': '0 4px 16px rgba(0,0,0,0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleInBounce: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '60%':  { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%':   { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '2000px' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInOverlay: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progressBar: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--progress-width, 100%)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-2deg)' },
          '75%':      { transform: 'rotate(2deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        drawLine: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in':         'fadeIn 0.25s ease-out both',
        'fade-in-fast':    'fadeIn 0.15s ease-out both',
        'fade-in-down':    'fadeInDown 0.25s ease-out both',
        'slide-in-left':   'slideInLeft 0.25s ease-out both',
        'slide-in-right':  'slideInRight 0.25s ease-out both',
        'slide-up':        'slideUp 0.3s ease-out both',
        'scale-in':        'scaleIn 0.2s ease-out both',
        'scale-in-bounce': 'scaleInBounce 0.3s ease-out both',
        'slide-down':      'slideDown 0.25s ease-out both',
        'shimmer':         'shimmer 1.5s infinite linear',
        'fade-overlay':    'fadeInOverlay 0.15s ease-out both',
        'count-up':        'countUp 0.3s ease-out both',
        'progress-bar':    'progressBar 0.6s ease-out both',
        'wiggle':          'wiggle 0.3s ease-in-out',
        'float':           'float 3s ease-in-out infinite',
        'draw-line':       'drawLine 1s ease-out both',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
