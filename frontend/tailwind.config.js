const { addIconSelectors } = require('@iconify/tailwind');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oxford-blue': {
          '50': '#f6f7f9',
          '100': '#eceff2',
          '200': '#d4dbe3',
          '300': '#afbbca',
          '400': '#8497ac',
          '500': '#657a92',
          '600': '#506279',
          '700': '#414f63',
          '800': '#384352',
          '900': '#333b47',
          '950': '#22272f',
        },
        'matisse': {
          '50': '#f1f8fe',
          '100': '#e2f0fc',
          '200': '#bfdff8',
          '300': '#87c6f2',
          '400': '#46a8ea',
          '500': '#1e8dd9',
          '600': '#106aaf',
          '700': '#0f5995',
          '800': '#104c7c',
          '900': '#134067',
          '950': '#0d2944',
          '1000': 'hsl(210, 41.7%, 4.7%)'
        }
      }
    },
  },
  plugins: [
    addIconSelectors(['mdi']),
  ],
}

