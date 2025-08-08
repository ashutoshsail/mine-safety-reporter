/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Light Theme
        'light-primary': '#0d9488', // teal-600
        'light-secondary': '#3b82f6', // blue-500
        'light-accent': '#f97316', // orange-500
        'light-background': '#f8fafc', // slate-50
        'light-card': '#ffffff',
        'light-text': '#334155', // slate-700
        'light-subtle-text': '#64748b', // slate-500

        // Dark Theme
        'dark-primary': '#2dd4bf', // teal-400
        'dark-secondary': '#60a5fa', // blue-400
        'dark-accent': '#fb923c', // orange-400
        'dark-background': '#1e293b', // slate-800
        'dark-card': '#334155', // slate-700
        'dark-text': '#e2e8f0', // slate-200
        'dark-subtle-text': '#94a3b8', // slate-400
      }
    },
  },
  plugins: [],
}
