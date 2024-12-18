const { addIconSelectors } = require('@iconify/tailwind');
import createTailwindConfig from 'stream-helper-styles/tailwind';

/** @type {import('tailwindcss').Config} */
export default createTailwindConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [
    addIconSelectors(['mdi']),
  ],
})

