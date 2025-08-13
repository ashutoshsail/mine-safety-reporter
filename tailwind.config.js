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
        'light-primary': '#4f46e5', // Indigo-600 (Primary Accent)
        'light-secondary': '#3b82f6', // Blue-500 (Secondary Actions)
        'light-accent': '#f97316', // Orange-500 (Still available for specific highlights)
        'light-background': '#f1f5f9', // Slate-100 (Slightly darker background)
        'light-card': '#ffffff',
        'light-text': '#1e293b', // Slate-800
        'light-subtle-text': '#64748b', // Slate-500

        // Dark Theme
        'dark-primary': '#818cf8', // Indigo-400 (Primary Accent)
        'dark-secondary': '#60a5fa', // Blue-400 (Secondary Actions)
        'dark-accent': '#fb923c', // Orange-400
        'dark-background': '#0f172a', // Slate-900 (Darker background)
        'dark-card': '#1e293b', // Slate-800
        'dark-text': '#e2e8f0', // Slate-200
        'dark-subtle-text': '#94a3b8', // Slate-400
      }
    },
  },
  plugins: [],
}
