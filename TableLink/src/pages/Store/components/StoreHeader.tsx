import { useNavigate } from 'react-router-dom'

interface StoreHeaderProps {
  onFavoriteClick?: () => void
  isFavorite?: boolean
  onQRClick?: () => void
}

export const StoreHeader = ({ onFavoriteClick, isFavorite, onQRClick }: StoreHeaderProps) => {
  const navigate = useNavigate()

  const handleQRClick = () => {
    if (onQRClick) {
      onQRClick()
    } else {
      // TODO: QR 결제 페이지로 이동
      console.log('QR 결제')
      alert('QR 결제 기능 준비 중')
    }
  }
  
  return (
    <header className="store-fixed-header">
      <button 
        onClick={() => navigate("/map")} 
        className="header-btn" 
        aria-label="뒤로가기"
      >
        <span className="header-btn-ico">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      
      <button 
        className="header-btn" 
        onClick={handleQRClick}
        aria-label="QR결제"
      >
        <span className="header-btn-ico">
          <img 
            width="24" 
            height="24" 
            src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/30/ffffff/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" 
            alt="QR"
            style={{ filter: 'invert(1)' }}
          />
        </span>
      </button>
    </header>
  )
}
