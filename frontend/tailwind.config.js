/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
          '1000': 'hsl(208, 68%, 7%)'
        }
      }
    },
  },
  plugins: [],
}

