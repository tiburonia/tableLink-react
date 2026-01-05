import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as authApi from '@/shared/api/authApi'
import * as storeApi from '@/shared/api/storeApi'
import type { StoreInfo } from '@/shared/api/storeApi'
import styles from './StoreDashboardPage.module.css'

interface StoreDashboardPageProps {
  storeId?: number
}

export function StoreDashboardPage({ storeId }: StoreDashboardPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // API에서 매장 정보 로드
    const loadStore = async () => {
      // storeId가 prop으로 전달되면 사용, 아니면 localStorage에서 가져옴
      const targetStoreId = storeId || parseInt(localStorage.getItem('tlm_current_store_id') || '0')
      
      if (!targetStoreId) {
        console.log('❌ storeId가 없음 - 매장 추가 페이지로 이동')
        navigate('/add-store')
        return
      }

      try {
        console.log('🏪 매장 정보 로드:', targetStoreId)
        const response = await storeApi.getStoreById(targetStoreId)
        if (response.success && response.store) {
          setStore(response.store)
        } else {
          // API 실패 시 더미 데이터 사용
          console.log('API 실패, 더미 데이터 사용')
          setStore(storeApi.getDummyStore(targetStoreId))
        }
      } catch (error) {
        console.error('매장 정보 로드 실패:', error)
        // 에러 시 더미 데이터 사용
        setStore(storeApi.getDummyStore(targetStoreId))
      } finally {
        setIsLoading(false)
      }
    }
    loadStore()
  }, [storeId, navigate])

  // 메뉴 관리 버튼 핸들러
  const handleMenuManagement = () => {
    if (!store) return
    navigate(`/stores/${store.id}/menu`)
  }

  // 테이블 설정 버튼 핸들러
  const handleTableSettings = () => {
    if (!store) return
    navigate(`/stores/${store.id}/tables`)
  }

  // 단골 등급 버튼 핸들러
  const handlePromotionSettings = () => {
    if (!store) return
    navigate(`/stores/${store.id}/promotions`)
  }

  // 리뷰 관리 버튼 핸들러
  const handleReviewManagement = () => {
    if (!store) return
    navigate(`/stores/${store.id}/reviews`)
  }

  const handleLogout = () => {
    authApi.logout()
    localStorage.removeItem('tlm_stores')
    localStorage.removeItem('tlm_current_store_id')
    localStorage.removeItem('tlm_current_store')
    window.location.reload()
  }

  // 바텀바 활성 상태 확인
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.loading}>
            <span>🏪</span>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.error}>
            <span>❌</span>
            <p>매장 정보를 찾을 수 없습니다</p>
            <button onClick={() => navigate('/')}>처음으로</button>
          </div>
        </div>
      </div>
    )
  }

  // 리뷰 상태 분석
  const negativeReviews = store.reviews.filter(r => r.score <= 2).length
  const noReplyReviews = store.reviews.filter(r => !r.status || r.status === 'pending').length

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 - 간소화 */}
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.storeInfo}>
                <h1 className={styles.storeName}>{store.name}</h1>
                <span className={`${styles.storeStatus} ${store.is_open ? styles.open : styles.closed}`}>
                  {store.is_open ? '영업중' : '영업종료'}
                </span>
              </div>
              <button className={styles.notificationBtn}>
                🔔
                {noReplyReviews > 0 && <span className={styles.badge}>{noReplyReviews}</span>}
              </button>
            </div>
          </header>

          {/* 메인 콘텐츠 영역 - 핵심만 */}
          <main className={styles.main}>
            {/* 매장 통계 카드 */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>💰</span>
                <span className={styles.statValue}>₩0</span>
                <span className={styles.statLabel}>오늘 매출</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>⭐</span>
                <span className={styles.statValue}>{store.rating_average.toFixed(1)}</span>
                <span className={styles.statLabel}>평점</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>💬</span>
                <span className={styles.statValue}>{store.reviewCount}</span>
                <span className={styles.statLabel}>리뷰</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🪑</span>
                <span className={styles.statValue}>{store.tableStatusSummary.available}/{store.tableCount}</span>
                <span className={styles.statLabel}>빈 테이블</span>
              </div>
            </div>

            {/* 빠른 설정 섹션 - 상태형 버튼 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>빠른 관리</h3>
              <div className={styles.quickActions}>
                <button className={styles.actionCard} onClick={handleMenuManagement}>
                  <div className={styles.actionHeader}>
                    <span className={styles.actionIcon}>📋</span>
                    <span className={styles.actionTitle}>메뉴 관리</span>
                  </div>
                  <span className={styles.actionStatus}>
                    {store.menuCount}개 등록
                  </span>
                </button>
                
                <button className={styles.actionCard} onClick={handleTableSettings}>
                  <div className={styles.actionHeader}>
                    <span className={styles.actionIcon}>🪑</span>
                    <span className={styles.actionTitle}>테이블</span>
                  </div>
                  <span className={`${styles.actionStatus} ${store.tableStatusSummary.available > 0 ? styles.positive : styles.warning}`}>
                    {store.tableStatusSummary.available}석 이용가능
                  </span>
                </button>
                
                <button className={styles.actionCard} onClick={handlePromotionSettings}>
                  <div className={styles.actionHeader}>
                    <span className={styles.actionIcon}>🏆</span>
                    <span className={styles.actionTitle}>단골 관리</span>
                  </div>
                  <span className={styles.actionStatus}>
                    {store.promotionCount}개 등급
                  </span>
                </button>
                
                <button className={styles.actionCard} onClick={handleReviewManagement}>
                  <div className={styles.actionHeader}>
                    <span className={styles.actionIcon}>⭐</span>
                    <span className={styles.actionTitle}>리뷰 관리</span>
                  </div>
                  <span className={`${styles.actionStatus} ${noReplyReviews > 0 ? styles.warning : ''}`}>
                    {noReplyReviews > 0 ? `답글 필요 ${noReplyReviews}` : `${store.reviewCount}개`}
                  </span>
                </button>
              </div>
            </section>

            {/* 최근 리뷰 - 2개만, 관리 느낌 */}
            {store.reviews.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>최근 리뷰</h3>
                  {negativeReviews > 0 && (
                    <span className={styles.alertBadge}>⚠️ 부정 {negativeReviews}</span>
                  )}
                </div>
                <div className={styles.reviewList}>
                  {store.reviews.slice(0, 2).map(review => (
                    <div 
                      key={review.id} 
                      className={`${styles.reviewCard} ${review.score <= 2 ? styles.negative : ''}`}
                    >
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewMeta}>
                          <span className={styles.reviewUser}>{review.user}</span>
                          <span className={styles.reviewScore}>
                            {'⭐'.repeat(review.score)}{'☆'.repeat(5 - review.score)}
                          </span>
                        </div>
                        {(!review.status || review.status === 'pending') && (
                          <span className={styles.replyNeeded}>답글 필요</span>
                        )}
                      </div>
                      <p className={styles.reviewContent}>{review.content}</p>
                    </div>
                  ))}
                </div>
                <button className={styles.viewAllBtn} onClick={handleReviewManagement}>
                  전체 리뷰 보기 →
                </button>
              </section>
            )}
          </main>

          {/* 하단 네비게이션 - 5개 유지 */}
          <nav className={styles.bottomNav}>
            <button 
              className={`${styles.navItem} ${isActive('/') || isActive('/store') ? styles.active : ''}`}
              onClick={() => navigate('/')}
            >
              <span>🏠</span>
              <span>홈</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/orders') ? styles.active : ''}`}
              onClick={() => navigate('/orders')}
            >
              <span>📋</span>
              <span>주문</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/preview') ? styles.active : ''}`}
              onClick={() => navigate('/preview')}
            >
              <span>👁️</span>
              <span>미리보기</span>
            </button>
            <button 
              className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
              onClick={() => navigate('/settings')}
            >
              <span>⚙️</span>
              <span>설정</span>
            </button>
            <button className={styles.navItem} onClick={handleLogout}>
              <span>🚪</span>
              <span>로그아웃</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
