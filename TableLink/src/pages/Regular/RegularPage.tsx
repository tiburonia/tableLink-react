import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { regularService } from './services/regularService'
import { RegularHeader } from './components/RegularHeader'
import { SummarySection } from './components/SummarySection'
import { StoreList } from './components/StoreList'
import { FavoriteList } from './components/FavoriteList'
import { SidePanel } from './components/SidePanel'
import { FeedSection } from './components/FeedSection'
import './RegularPage.css'
import { BottomNavigation } from '../Main/components/BottomNavigation'

interface RegularSummary {
  totalPoints: number
  totalCoupons: number
  unwrittenReviews: number
  totalStores: number
}

interface RegularStore {
  storeId: number
  storeName: string
  level: string
  points: number
  visitCount: number
  lastVisit: string
  category: string
}

interface FavoriteStore {
  storeId: number
  storeName: string
  category: string
  rating: number
  distance: string
}

export const RegularPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'regular' | 'favorite' | 'feed'>('regular')
  const [summary, setSummary] = useState<RegularSummary | null>(null)
  const [stores, setStores] = useState<RegularStore[]>([])
  const [favoriteStores, setFavoriteStores] = useState<FavoriteStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await regularService.getRegularStoresData()

      if (result.success) {
        setSummary(result.summary)
        setStores(result.stores)
        setFavoriteStores(result.favoriteStores)
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다')
      console.error('Regular data load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStoreClick = (storeId: number) => {
    navigate(`/rs/${storeId}`)
  }

  const handleRemoveFavorite = async (storeId: number) => {
    if (confirm('즐겨찾기에서 삭제하시겠습니까?')) {
      // TODO: API 호출로 즐겨찾기 제거
      setFavoriteStores((prev) => prev.filter((store) => store.storeId !== storeId))
    }
  }

  if (loading) {
    return (
        <div className='mobile-app'>
        <div className='mobile-content'>
      <div className="regular-page-loading">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
      </div>
      </div>
    )
  }

  if (error) {
    return (
    <div className='mobile-app'>
    <div className='mobile-content'>
      <div className="regular-page-error">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={loadData} className="retry-button">
          다시 시도
        </button>
      </div>
      </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <RegularHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuClick={() => setIsSidePanelOpen(true)}
        />

        <div className="regular-content">
          {activeTab === 'feed' ? (
            <FeedSection userId={parseInt(localStorage.getItem('userId') || '1')} />
          ) : (
            <>
              {summary && <SummarySection summary={summary} />}

              {activeTab === 'regular' ? (
                <StoreList stores={stores} onStoreClick={handleStoreClick} />
              ) : (
                <FavoriteList
                  stores={favoriteStores}
                  onStoreClick={handleStoreClick}
                  onRemove={handleRemoveFavorite}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} />

      <BottomNavigation />
    </div>
  )
}
