import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {  // Add this section
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Optional: Add the react aliases if you're using preact/compat
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
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
