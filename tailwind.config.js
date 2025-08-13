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
        'light-primary': '#0284c7', // Sky-600 (Primary Accent)
        'light-secondary': '#475569', // Slate-600 (Secondary Actions)
        'light-accent': '#f97316', // Orange-500 (for specific highlights like warnings)
        'light-background': '#f1f5f9', // Slate-100
        'light-card': '#ffffff',
        'light-text': '#1e293b', // Slate-800
        'light-subtle-text': '#64748b', // Slate-500
        'light-border': '#e2e8f0', // Slate-200
        status: {
          success: '#16a34a',
          warning: '#f59e0b',
          danger: '#dc2626',
        },

        // Dark Theme
        'dark-primary': '#38bdf8', // Sky-400 (Primary Accent)
        'dark-secondary': '#94a3b8', // Slate-400 (Secondary Actions)
        'dark-accent': '#fb923c', // Orange-400
        'dark-background': '#0f172a', // Slate-900
        'dark-card': '#1e293b', // Slate-800
        'dark-text': '#e2e8f0', // Slate-200
        'dark-subtle-text': '#94a3b8', // Slate-400
        'dark-border': '#334155', // Slate-700
        status: {
          success: '#4ade80',
          warning: '#fcd34d',
          danger: '#f87171',
        },
      },
      // CRITICAL FIX: Added the chart object
      chart: {
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        orange: '#f97316',
        purple: '#8b5cf6',
        red: '#ef4444',
      }
    },
  },
  plugins: [],
}
