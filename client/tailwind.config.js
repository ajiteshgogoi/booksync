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
      }
    },
  },
  plugins: [],
}
