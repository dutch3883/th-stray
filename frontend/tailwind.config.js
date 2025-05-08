/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
        'bottom-bar': '64px', // Adjust this value to match your bottom bar height
      },
      padding: {
        'screen-bottom': 'calc(env(safe-area-inset-bottom, 16px) + 64px)', // Combines safe area + bottom bar
      },
    },
  },
  plugins: [],
}

