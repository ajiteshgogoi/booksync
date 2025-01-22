/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        success: '#10b981',
        error: '#ef4444'
      },
      animation: {
        slide: 'slide 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        slide: {
          '0%, 100%': { transform: 'translateX(-10%)' },
          '50%': { transform: 'translateX(10%)' }
        }
      }
    },
  },
  plugins: [],
}
