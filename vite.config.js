
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src',
  publicDir: '../public',
  base: '/react/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/TLG': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@TLG': path.resolve(__dirname, './TLG')
    }
  }
});
