/**
 * MainPage - 메인 페이지
 * 
 * 역할: "가볼 만한 가게를 발견"
 * 
 * 최적화 전략:
 * - 각 섹션이 자체 상태 관리 → 리렌더링 격리
 * - 초기 로딩 시에만 전체 로딩 화면 표시
 * - onLoaded 콜백으로 로딩 완료 추적
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNavigation } from '@/widgets/Layout'
import { LocationSearch, type Location } from '@/widgets/Map/components/LocationSearch'
import { TodaySection, CategorySection, LocationSection } from './sections'
import styles from './MainPage.module.css'

export const MainPage = () => {
  const navigate = useNavigate()
  
  // 위치 선택 상태
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false)

  // 각 섹션의 초기 로딩 완료 상태
  const [loadedSections, setLoadedSections] = useState({
    today: false,
    category: false,
    location: false,
  })

  // 섹션 로딩 완료 핸들러 (메모이제이션으로 불필요한 리렌더 방지)
  const handleTodayLoaded = useCallback(() => {
    setLoadedSections(prev => ({ ...prev, today: true }))
  }, [])
  
  const handleCategoryLoaded = useCallback(() => {
    setLoadedSections(prev => ({ ...prev, category: true }))
  }, [])
  
  const handleLocationLoaded = useCallback(() => {
    setLoadedSections(prev => ({ ...prev, location: true }))
  }, [])

  const isAllLoaded = loadedSections.today && loadedSections.category && loadedSections.location

  const handleNotificationClick = () => {
    navigate('/notifications')
  }

  // 위치 선택 핸들러
  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location)
    setIsLocationSearchOpen(false)
    console.log('📍 위치 선택:', location.address)
  }, [])

  // 위치 표시 텍스트
  const locationDisplayText = selectedLocation?.name || selectedLocation?.address || '위치 선택'

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        {/* 초기 로딩 화면 (모든 섹션 로딩 완료 전) */}
        {!isAllLoaded && (
          <div className={styles.loadingScreen}>
            <div className={styles.loadingContent}>
              <span className={styles.loadingIcon}>🍽️</span>
              <h2 className={styles.loadingTitle}>TableLink</h2>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>맛집을 찾고 있어요...</p>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 (로딩 중에도 렌더링하되 숨김) */}
        <div style={{ display: isAllLoaded ? 'contents' : 'none' }}>
          {/* 헤더 */}
          <header className={styles.header}>
            {/* 위치 선택 버튼 */}
            <button 
              className={styles.locationSelector}
              onClick={() => setIsLocationSearchOpen(true)}
            >
              <span className={styles.locationPin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                    fill="currentColor"
                  />
                  <circle cx="12" cy="9" r="2" fill="white"/>
                </svg>
              </span>
              <span className={styles.locationText}>{locationDisplayText}</span>
              <span className={styles.locationArrow}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            <div className={styles.headerTop}>
              <div className={styles.headerLeft}>
                <div className={styles.logo}>
                  <span className={styles.logoIcon}>🍽️</span>
                  <h1 className={styles.logoText}>TableLink</h1>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button 
                  className={styles.notificationBtn}
                  onClick={handleNotificationClick}
                  aria-label="알림"
                >
                  <span className={styles.notificationIcon}>🔔</span>
                </button>
              </div>
            </div>
            
          </header>

          {/* 위치 검색 모달 */}
          <LocationSearch
            isOpen={isLocationSearchOpen}
            onClose={() => setIsLocationSearchOpen(false)}
            onSelectLocation={handleLocationSelect}
            currentLocation={selectedLocation}
          />

          {/* 메인 컨텐츠 - 스크롤 영역 */}
          <main className={styles.main}>

            {/* ③ 위치 기준 추천 - 자체 상태 관리 */}
            <LocationSection onLoaded={handleLocationLoaded} />

            {/* ② 카테고리 기준 추천 - 자체 상태 관리 */}
            <CategorySection onLoaded={handleCategoryLoaded} />


            {/* ① 오늘의 가게 - 자체 상태 관리 */}
            <TodaySection onLoaded={handleTodayLoaded} />

            

           
          </main>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
