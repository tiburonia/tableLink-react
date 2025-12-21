import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'TLG': path.resolve(__dirname, '../TLG'),
      'shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Vite가 server 폴더와 부모 디렉토리의 파일을 읽을 수 있도록 허용
      strict: false,
      allow: ['..']
    },
    proxy: {
      // API 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
