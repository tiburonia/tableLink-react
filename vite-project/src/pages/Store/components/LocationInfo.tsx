import './LocationInfo.css'

interface LocationInfoProps {
  address: string
  lat?: number
  lng?: number
}

export const LocationInfo = ({ address, lat = 37.5665, lng = 126.9780 }: LocationInfoProps) => {
  // 백엔드 프록시를 통한 Static Map 이미지 URL
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/db', '') || 'https://stunning-broccoli-7vwxrrpqr7vj29pj-5000.app.github.dev'
  const mapImageUrl = `${apiBaseUrl}/map/static?lat=${lat}&lng=${lng}&w=570&h=200&level=16`




  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      alert('주소가 복사되었습니다')
    } catch (err) {
      console.error('주소 복사 실패:', err)
    }
  }

  const handleOpenMap = () => {
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(address)}`, '_blank')
  }

  return (
    <section className="location-info-section">
      <div className="section-header">
        <h3 className="section-title">
          <span className="section-icon">📍</span> 위치정보
        </h3>
      </div>

      <div className="location-map-container">
        <div className="naver-map-wrapper">
          <img src={mapImageUrl} alt="매장 위치" className="location-map-image" />
          <div className="map-overlay">
            <button 
              className="map-expand-btn"
              onClick={handleOpenMap}
              aria-label="지도 크게 보기"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="location-address-section">
        <div className="address-text">{address}</div>
        <button 
          className="address-copy-btn"
          onClick={handleCopyAddress}
          aria-label="주소 복사"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          주소복사
        </button>
      </div>
    </section>
  )
}
