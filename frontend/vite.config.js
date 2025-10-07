
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src',
  publicDir: '../../legacy/public',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [/^\/legacy\/TLG\//, /^\/legacy\/KDS\//, /^\/legacy\/pos\//, /^\/legacy\/shared\//]
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
