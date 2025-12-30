/**
 * StorePage - 매장 상세 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// UI Components (페이지 전용)
import {
  StoreHeader,
  StoreHero,
  TabNavigation,
  BottomActions,
  PhotoModal,
  LoadingState,
  ErrorState,
} from './ui'

// Features (FSD Layer)
import { useStoreView } from '@/features/store-view'
import { InfoTab } from '@/features/store-info'
import { MenuTab, type MenuItemData } from '@/features/store-menu'
import { ReviewTab, type ReviewData } from '@/features/store-review'
import { RegularTab } from '@/features/regular-benefits'
import { StoreInfoTab, StoreInfo } from '@/features/store-details'

// Constants
import { DUMMY_PHOTOS, DUMMY_HOURS } from './model/constants'

import styles from './StorePage.module.css'

export const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Feature Hook에서 모든 상태와 로직을 가져옴
  const {
    store,
    loading,
    error,
    isFavorite,
    activeTab,
    selectedPhoto,
    switchTab,
    toggleFavorite,
    selectPhoto,
  } = useStoreView(storeId)

  // 스크롤 이벤트 감지 (UI 관련 로직)
  useEffect(() => {
    const contentElement = contentRef.current
    if (!contentElement) {
      console.log('❌ contentRef 요소를 찾지 못했습니다')
      return
    }

    const handleScroll = () => {
      const scrollThreshold = 180 // 스크롤 임계값 (픽셀)
      const scrolled = contentElement.scrollTop > scrollThreshold
      setIsScrolled(scrolled)
    }

    contentElement.addEventListener('scroll', handleScroll)
    
    return () => {
      contentElement.removeEventListener('scroll', handleScroll)
    }
  }, [store]) // store가 로드된 후에 실행되도록 의존성 추가

  if (loading) return <LoadingState />
  if (error || !store) return <ErrorState error={error || '매장 정보를 찾을 수 없습니다.'} />

  const handleStoryClick = () => {
    navigate(`/rs/${storeId}/sf`)
  }

  const handleReviewClick = () => {
    switchTab('review')
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content" ref={contentRef}>
        <div  className={styles.storeSection}>
        <StoreHeader 
          onFavoriteClick={toggleFavorite} 
          isFavorite={isFavorite} 
          isScrolled={isScrolled}
        />
        <StoreHero 
          name={store.name} 
          category={store.category}
          region={store.region}
          image={store.image}
        />
        
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

        <div className={styles.tabContent} id="storeTabContent">
          {activeTab === 'main' && (
            <InfoTab 
              store={store} 
              photos={DUMMY_PHOTOS} 
              hours={DUMMY_HOURS}
              onPhotoClick={selectPhoto}
            />
          )}
          {activeTab === 'menu' && (
            <MenuTab 
              menu={(store.menu || []).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                description: item.description,
                cookStation: item.cook_station,
              })) as MenuItemData[]} 
            />
          )}
          {activeTab === 'review' && (
            <ReviewTab 
              reviews={(store.reviews || []) as ReviewData[]} 
            />
          )}
          {activeTab === 'regular' && <RegularTab storeId={parseInt(store.id)}/>}
          {activeTab === 'info' && <StoreInfoTab store={store} />}
        </div>

        <BottomActions storeId={parseInt(store.id)} storeName={store.name} />
        {selectedPhoto && (
          <PhotoModal photoUrl={selectedPhoto} onClose={() => selectPhoto(null)} />
        )}
      </div>
    </div>
    </div>
  )
}

