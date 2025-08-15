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
        light: {
          primary: '#0284c7', // Sky-600
          secondary: '#475569', // Slate-600
          accent: '#f97316', // Orange-500
          background: '#f1f5f9', // Slate-100
          card: '#ffffff',
          text: '#1e293b', // Slate-800
          'subtle-text': '#64748b', // Slate-500
          border: '#e2e8f0', // Slate-200
          status: {
            success: '#16a34a',
            warning: '#f59e0b',
            danger: '#dc2626',
          },
        },
        dark: {
          primary: '#38bdf8', // Sky-400
          secondary: '#94a3b8', // Slate-400
          accent: '#fb923c', // Orange-400
          background: '#0f172a', // Slate-900
          card: '#1e293b', // Slate-800
          text: '#e2e8f0', // Slate-200
          'subtle-text': '#94a3b8', // Slate-400
          border: '#334155', // Slate-700
          status: {
            success: '#4ade80',
            warning: '#fcd34d',
            danger: '#f87171',
          },
        },
      },
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
