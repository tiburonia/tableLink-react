import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '@/shared/api/authApi'
import * as storeApi from '@/shared/api/storeApi'
import type { StoreInfo } from '@/shared/api/storeApi'
import styles from './StoreDashboardPage.module.css'

interface StoreDashboardPageProps {
  storeId?: number
}

export function StoreDashboardPage({ storeId }: StoreDashboardPageProps) {
  const navigate = useNavigate()
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

  const handleLogout = () => {
    authApi.logout()
    localStorage.removeItem('tlm_stores')
    localStorage.removeItem('tlm_current_store_id')
    localStorage.removeItem('tlm_current_store')
    window.location.reload()
  }

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

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.storeInfo}>
                <h1 className={styles.storeName}>{store.name}</h1>
                <span className={`${styles.storeStatus} ${store.is_open ? styles.open : styles.closed}`}>
                  {store.is_open ? '영업중' : '영업종료'}
                </span>
              </div>
              <button className={styles.menuBtn}>☰</button>
            </div>
            <p className={styles.storeAddress}>{store.full_address}</p>
          </header>

          {/* 메인 콘텐츠 영역 */}
          <main className={styles.main}>
            {/* 매장 통계 카드 */}
            <div className={styles.statsGrid}>
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
                <span className={styles.statIcon}>🍽️</span>
                <span className={styles.statValue}>{store.menuCount}</span>
                <span className={styles.statLabel}>메뉴</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🪑</span>
                <span className={styles.statValue}>{store.tableStatusSummary.available}/{store.tableCount}</span>
                <span className={styles.statLabel}>빈 테이블</span>
              </div>
            </div>

            {/* 빠른 설정 섹션 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>빠른 설정</h3>
              <div className={styles.quickActions}>
                <button className={styles.actionCard}>
                  <span className={styles.actionIcon}>📋</span>
                  <span className={styles.actionTitle}>메뉴 관리</span>
                  <span className={styles.actionDesc}>{store.menuCount}개 메뉴</span>
                </button>
                
                <button className={styles.actionCard}>
                  <span className={styles.actionIcon}>🪑</span>
                  <span className={styles.actionTitle}>테이블 설정</span>
                  <span className={styles.actionDesc}>{store.tableCount}개 테이블</span>
                </button>
                
                <button className={styles.actionCard}>
                  <span className={styles.actionIcon}>🏆</span>
                  <span className={styles.actionTitle}>단골 등급</span>
                  <span className={styles.actionDesc}>{store.promotionCount}개 등급</span>
                </button>
                
                <button className={styles.actionCard}>
                  <span className={styles.actionIcon}>📸</span>
                  <span className={styles.actionTitle}>사진 관리</span>
                  <span className={styles.actionDesc}>매장 사진</span>
                </button>
              </div>
            </section>

            {/* 매장 정보 요약 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>매장 정보</h3>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📞 전화번호</span>
                  <span className={styles.infoValue}>{store.store_tel_number}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>📍 주소</span>
                  <span className={styles.infoValue}>{store.full_address}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>🌍 지역</span>
                  <span className={styles.infoValue}>{store.sido} {store.sigungu}</span>
                </div>
              </div>
            </section>

            {/* 최근 리뷰 */}
            {store.reviews.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>최근 리뷰</h3>
                <div className={styles.reviewList}>
                  {store.reviews.slice(0, 2).map(review => (
                    <div key={review.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewUser}>{review.user}</span>
                        <span className={styles.reviewScore}>{'⭐'.repeat(review.score)}</span>
                      </div>
                      <p className={styles.reviewContent}>{review.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 편의시설 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>편의시설</h3>
              <div className={styles.amenitiesList}>
                <span className={`${styles.amenityTag} ${store.amenities.wifi ? styles.active : ''}`}>
                  📶 Wi-Fi
                </span>
                <span className={`${styles.amenityTag} ${store.amenities.parking ? styles.active : ''}`}>
                  🅿️ 주차장
                </span>
                <span className={`${styles.amenityTag} ${store.amenities.pet_friendly ? styles.active : ''}`}>
                  🐕 반려동물
                </span>
                <span className={`${styles.amenityTag} ${store.amenities.power_outlet ? styles.active : ''}`}>
                  🔌 콘센트
                </span>
                <span className={`${styles.amenityTag} ${store.amenities.smoking_area ? styles.active : ''}`}>
                  🚬 흡연구역
                </span>
              </div>
            </section>

            {/* 단골 등급 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>단골 등급 설정</h3>
              <div className={styles.promotionList}>
                {store.promotions
                  .sort((a, b) => a.min_orders - b.min_orders)
                  .map(promo => (
                    <div key={promo.id} className={styles.promotionCard}>
                      <span className={styles.promotionLevel}>{promo.level}</span>
                      <span className={styles.promotionReq}>
                        {promo.min_orders}회 이상 / {promo.min_spent.toLocaleString()}원 이상
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </main>

          {/* 하단 네비게이션 */}
          <nav className={styles.bottomNav}>
            <button className={`${styles.navItem} ${styles.active}`}>
              <span>🏠</span>
              <span>홈</span>
            </button>
            <button className={styles.navItem}>
              <span>📋</span>
              <span>주문</span>
            </button>
            <button className={styles.navItem} onClick={() => navigate('/preview')}>
              <span>👁️</span>
              <span>미리보기</span>
            </button>
            <button className={styles.navItem}>
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
