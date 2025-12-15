import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  server: {
    host: true,
    cors: {
      origin: '*'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:6060',
        changeOrigin: true
      }
    }
  },
})
