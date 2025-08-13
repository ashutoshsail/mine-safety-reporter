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
        light: {
          primary: '#0284c7',
          secondary: '#475569',
          accent: '#f97316',
          background: '#f1f5f9',
          card: '#ffffff',
          text: '#1e293b',
          'subtle-text': '#64748b',
          border: '#e2e8f0',
          status: {
            success: '#16a34a',
            warning: '#f59e0b',
            danger: '#dc2626',
          },
        },
        // Dark Theme
        dark: {
          primary: '#38bdf8',
          secondary: '#94a3b8',
          accent: '#fb923c',
          background: '#0f172a',
          card: '#1e293b',
          text: '#e2e8f0',
          'subtle-text': '#94a3b8',
          border: '#334155',
          status: {
            success: '#4ade80',
            warning: '#fcd34d',
            danger: '#f87171',
          },
        },
        // Chart Colors
        chart: {
            blue: '#3b82f6',
            green: '#22c55e',
            yellow: '#eab308',
            orange: '#f97316',
            purple: '#8b5cf6',
            red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
