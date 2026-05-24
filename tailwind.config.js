/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pastel color palette
        pastel: {
          pink: '#ffeef0',
          blue: '#eef4ff',
          green: '#eefff4',
          yellow: '#fff8ee',
          purple: '#f8eeff',
          cyan: '#eefff9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
