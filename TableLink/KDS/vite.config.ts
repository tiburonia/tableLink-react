import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5190,
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
