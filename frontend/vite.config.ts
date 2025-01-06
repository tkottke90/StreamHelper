import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from 'tailwindcss';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  server: {
    host: true,
    cors: {
      origin: '*'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  },
})
