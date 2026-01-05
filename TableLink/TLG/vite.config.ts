import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/widgets': path.resolve(__dirname, './src/widgets'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/entities': path.resolve(__dirname, './src/entities'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      'TLG': path.resolve(__dirname, '../TLG'),
      'shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5170,
    fs: {
      // Vite가 server 폴더와 부모 디렉토리의 파일을 읽을 수 있도록 허용
      strict: false,
      allow: ['..']
    },
    proxy: {
      // API 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev',
        changeOrigin: true,
      },
    },
  },
})
