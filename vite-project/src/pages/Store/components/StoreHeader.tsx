import { useNavigate } from 'react-router-dom'

interface StoreHeaderProps {
  onFavoriteClick?: () => void
  isFavorite?: boolean
}

export const StoreHeader = ({ onFavoriteClick, isFavorite }: StoreHeaderProps) => {
  const navigate = useNavigate()
  
  return (
    <header className="store-header">
      <button onClick={() => navigate(-1)} className="back-btn" aria-label="뒤로가기">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <h1>매장 상세</h1>
      <button 
        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={onFavoriteClick}
        aria-label="즐겨찾기"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </header>
  )
}
