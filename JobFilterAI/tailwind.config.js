/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wishlist: '#a855f7', // Purple
        applied: '#3b82f6', // Blue
        followup: '#f59e0b', // Amber
        interview: '#10b981', // Emerald
        offer: '#22c55e', // Green
        rejected: '#ef4444', // Red
      }
    },
  },
  plugins: [],
}
