import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'

// 네이버맵 API 스크립트 동적 로딩
function loadNaverMapAPI() {
  const apiKey = import.meta.env.VITE_NAVER_MAP_API_KEY
  if (apiKey) {
    const script = document.getElementById('naver-map-script') as HTMLScriptElement | null
    if (script) {
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${apiKey}`
    }
  } else {
    console.warn(
      '⚠️ 네이버맵 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.'
    )
  }
}

// API 로드 후 앱 시작
loadNaverMapAPI()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
