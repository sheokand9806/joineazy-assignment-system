/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0E1220',
        canvas: '#F4F5F8',
        brand: {
          50: '#EFF3FF',
          100: '#DCE5FF',
          200: '#B9CBFF',
          500: '#3B67FF',
          600: '#2F55F0',
          700: '#2444CF',
        },
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(14,18,32,.04), 0 8px 24px -12px rgba(14,18,32,.10)',
        pop: '0 24px 60px -20px rgba(14,18,32,.35)',
        glow: '0 8px 24px -8px rgba(47,85,240,.55)',
      },
      keyframes: {
        pop: { '0%': { opacity: 0, transform: 'translateY(8px) scale(.98)' }, '100%': { opacity: 1, transform: 'none' } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: { pop: 'pop .22s ease-out', fade: 'fade .2s ease-out' },
    },
  },
  plugins: [],
};
