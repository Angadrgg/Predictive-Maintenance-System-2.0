// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This line is the important one
  ],
  theme: {
    extend: {
      // Let's add the custom dark-mode colors here
      colors: {
        'dark-bg': '#1e293b',    // slate-800
        'dark-card': '#334155',  // slate-700
        'dark-nav': '#0f172a',   // slate-900
        'dark-text': '#e2e8f0',  // slate-200
        'dark-accent': '#38bdf8', // sky-400
      },
    },
  },
  plugins: [],
}