import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  StoreHeader,
  StoreHero,
  RatingSummary,
  TabNavigation,
  InfoTab,
  MenuTab,
  ReviewTab,
  BottomActions,
  PhotoModal,
  LoadingState,
  ErrorState,
  PromotionCard,
  TopUsersCard
} from './components'
import { useStoreData, useStoreTabs } from './hooks'
import { DUMMY_REVIEWS, DUMMY_MENU, DUMMY_PHOTOS, DUMMY_HOURS } from './constants'
import './StorePage.css'

export const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const { store, loading, error, isFavorite, toggleFavorite } = useStoreData(storeId)
  const { activeTab, switchTab } = useStoreTabs('info')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (loading) return <LoadingState />
  if (error || !store) return <ErrorState error={error || '매장 정보를 찾을 수 없습니다.'} />

  return (
    <div className="mobile-app">
      <div className="store-page">
        <StoreHeader onFavoriteClick={toggleFavorite} isFavorite={isFavorite} />
        <StoreHero 
          name={store.name} 
          category={store.category}
          region={store.region}
        />
        <RatingSummary 
          rating={store.rating || 4.5} 
          reviewCount={store.reviewCount || 0}
          favoriteCount={store.favoriteCount || 0}
        />
        
        {/* 레거시 시스템의 프로모션 카드 */}
        <PromotionCard storeId={parseInt(store.id)} />
        
        {/* 레거시 시스템의 단골 고객 카드 */}
        <TopUsersCard storeId={parseInt(store.id)} />

        <TabNavigation activeTab={activeTab} onTabChange={switchTab} />

        <div className="tab-content" id="storeTabContent">
          {activeTab === 'info' && (
            <InfoTab 
              store={store} 
              photos={DUMMY_PHOTOS} 
              hours={DUMMY_HOURS}
              onPhotoClick={setSelectedPhoto}
            />
          )}
          {activeTab === 'menu' && <MenuTab menu={DUMMY_MENU} />}
          {activeTab === 'review' && <ReviewTab reviews={DUMMY_REVIEWS} />}
        </div>

        <BottomActions storeId={parseInt(store.id)} storeName={store.name} />
        {selectedPhoto && (
          <PhotoModal photoUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </div>
    </div>
  )
}

