
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
    emptyOutDir: true,
    rollupOptions: {
      external: [/^\/TLG\//, /^\/KDS\//, /^\/pos\//, /^\/shared\//, /^\/tlm-components\//]
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
