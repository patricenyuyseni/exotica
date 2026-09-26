/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#09090f',
          panel: '#111827',
          card: '#151821',
          accent: '#cfae6d',
          accentSoft: '#e8d3a4',
          text: '#f8f7f3',
          muted: '#a8a8b3',
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#f87171',
        },
      },
      boxShadow: {
        luxury: '0 20px 60px rgba(15, 14, 18, 0.6)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top, rgba(207,174,109,0.18), transparent 45%)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
