import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  StoreHeader,
  StoreHero,
  StoreInfo,
  TabNavigation,
  InfoTab,
  MenuTab,
  ReviewTab,
  BottomActions,
  PhotoModal,
  LoadingState,
  ErrorState,
  RegularTab,
  StoreInfoTab,
} from './components'
import { useStoreData, useStoreTabs } from './hooks'
import { DUMMY_REVIEWS, DUMMY_MENU, DUMMY_PHOTOS, DUMMY_HOURS } from './constants'
import './StorePage.css'

export const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const { store, loading, error, isFavorite, toggleFavorite } = useStoreData(storeId)
  const { activeTab, switchTab } = useStoreTabs('main')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (loading) return <LoadingState />
  if (error || !store) return <ErrorState error={error || '매장 정보를 찾을 수 없습니다.'} />

  const handleStoryClick = () => {
    // TODO: 매장 스토리 페이지로 이동
    console.log('매장 스토리:', store.name)
    alert('매장 스토리 페이지 준비 중')
  }

  const handleReviewClick = () => {
    switchTab('review')
  }

  return (
    <div className="mobile-app">
      <div className="store-page">
        <StoreHeader onFavoriteClick={toggleFavorite} isFavorite={isFavorite} />
        <StoreHero 
          name={store.name} 
          category={store.category}
          region={store.region}
          image={store.image}
        />
        
        {/* 레거시 시스템의 StoreInfo 섹션 */}
        <StoreInfo
          name={store.name}
          rating={store.rating || 4.5}
          reviewCount={store.reviewCount || 0}
          description={store.description}
          hasPromotion={true}
          isNew={false}
          category={store.category}
          region={store.region}
          isFavorite={isFavorite}
          onFavoriteClick={toggleFavorite}
          onStoryClick={handleStoryClick}
          onReviewClick={handleReviewClick}
        />
        
        

        <TabNavigation activeTab={activeTab} onTabChange={switchTab} />

        <div className="tab-content" id="storeTabContent">
          {activeTab === 'main' && (
            <InfoTab 
              store={store} 
              photos={DUMMY_PHOTOS} 
              hours={DUMMY_HOURS}
              onPhotoClick={setSelectedPhoto}
            />
          )}
          {activeTab === 'menu' && <MenuTab menu={store.menu} />}
          {activeTab === 'review' && <ReviewTab reviews={DUMMY_REVIEWS} />}
          {activeTab === 'regular' && <RegularTab storeId={parseInt(store.id)}/>}
          {activeTab === 'info' && <StoreInfoTab store={store} />}
        </div>

        <BottomActions storeId={parseInt(store.id)} storeName={store.name} />
        {selectedPhoto && (
          <PhotoModal photoUrl={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        )}
      </div>
    </div>
  )
}

