import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as storeApi from '@/shared/api/storeApi'
import type { StoreInfo } from '@/shared/api/storeApi'
import styles from './StorePreviewPage.module.css'

type TabType = 'main' | 'menu' | 'review' | 'regular'

export function StorePreviewPage() {
  const navigate = useNavigate()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('main')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadStore = async () => {
      try {
        const response = await storeApi.getStoreById(2)
        if (response.success && response.store) {
          setStore(response.store)
        } else {
          setStore(storeApi.getDummyStore(2))
        }
      } catch (error) {
        console.error('매장 정보 로드 실패:', error)
        setStore(storeApi.getDummyStore(2))
      } finally {
        setIsLoading(false)
      }
    }
    loadStore()
  }, [])

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>미리보기 로딩 중...</p>
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
            <button onClick={() => navigate('/')}>돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 미리보기 배너 */}
          <div className={styles.previewBanner}>
            <span>👁️ 미리보기 모드</span>
            <button onClick={() => navigate('/')}>닫기</button>
          </div>

          {/* 헤더 */}
          <header className={styles.header}>
            <button className={styles.headerBtn} onClick={() => navigate('/')}>
              ←
            </button>
            <div className={styles.headerActions}>
              <button className={styles.headerBtn}>↗</button>
              <button 
                className={`${styles.headerBtn} ${isFavorite ? styles.active : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
          </header>

          {/* 히어로 이미지 */}
          <div className={styles.hero}>
            <img 
              src="https://picsum.photos/800/400?random=1" 
              alt={store.name}
              className={styles.heroImage}
            />
          </div>

          {/* 매장 정보 */}
          <div className={styles.storeInfo}>
            <div className={styles.storeMain}>
              <h1 className={styles.storeName}>{store.name}</h1>
              <span className={`${styles.storeStatus} ${store.is_open ? styles.open : styles.closed}`}>
                {store.is_open ? '영업중' : '영업종료'}
              </span>
            </div>
            
            <div className={styles.storeStats}>
              <span className={styles.rating}>
                ⭐ {store.rating_average.toFixed(1)}
              </span>
              <span className={styles.separator}>·</span>
              <span>리뷰 {store.reviewCount}개</span>
              <span className={styles.separator}>·</span>
              <span>{store.sigungu}</span>
            </div>

            <p className={styles.storeDescription}>
              신선한 재료로 만든 정성 가득한 요리를 제공합니다.
            </p>

            <div className={styles.actionButtons}>
              <button className={styles.storyBtn}>
                📖 스토리 보기
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <nav className={styles.tabNav}>
            <button 
              className={`${styles.tab} ${activeTab === 'main' ? styles.active : ''}`}
              onClick={() => setActiveTab('main')}
            >
              홈
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'menu' ? styles.active : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              메뉴
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
              onClick={() => setActiveTab('review')}
            >
              리뷰
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'regular' ? styles.active : ''}`}
              onClick={() => setActiveTab('regular')}
            >
              단골
            </button>
          </nav>

          {/* 탭 콘텐츠 */}
          <div className={styles.tabContent}>
            {/* 홈 탭 */}
            {activeTab === 'main' && (
              <div className={styles.mainTab}>
                {/* 대표 메뉴 */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>대표 메뉴</h3>
                  <div className={styles.featuredMenu}>
                    {store.menu.slice(0, 3).map(item => (
                      <div key={item.id} className={styles.featuredItem}>
                        <img 
                          src={`https://picsum.photos/200/200?random=${item.id}`} 
                          alt={item.name}
                        />
                        <span className={styles.featuredName}>{item.name}</span>
                        <span className={styles.featuredPrice}>{item.price.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 매장 정보 */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>매장 정보</h3>
                  <div className={styles.infoList}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>📍</span>
                      <span>{store.full_address}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>📞</span>
                      <span>{store.store_tel_number}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoIcon}>🪑</span>
                      <span>테이블 {store.tableCount}개 (빈 테이블 {store.tableStatusSummary.available}개)</span>
                    </div>
                  </div>
                </section>

                {/* 편의시설 */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>편의시설</h3>
                  <div className={styles.amenities}>
                    <span className={`${styles.amenity} ${store.amenities.wifi ? styles.active : ''}`}>
                      📶 Wi-Fi
                    </span>
                    <span className={`${styles.amenity} ${store.amenities.parking ? styles.active : ''}`}>
                      🅿️ 주차
                    </span>
                    <span className={`${styles.amenity} ${store.amenities.pet_friendly ? styles.active : ''}`}>
                      🐕 반려동물
                    </span>
                    <span className={`${styles.amenity} ${store.amenities.power_outlet ? styles.active : ''}`}>
                      🔌 콘센트
                    </span>
                  </div>
                </section>
              </div>
            )}

            {/* 메뉴 탭 */}
            {activeTab === 'menu' && (
              <div className={styles.menuTab}>
                {store.menu.map(item => (
                  <div key={item.id} className={styles.menuItem}>
                    <div className={styles.menuInfo}>
                      <h4 className={styles.menuName}>{item.name}</h4>
                      <p className={styles.menuDesc}>{item.description}</p>
                      <span className={styles.menuPrice}>{item.price.toLocaleString()}원</span>
                    </div>
                    <img 
                      src={`https://picsum.photos/100/100?random=${item.id + 10}`}
                      alt={item.name}
                      className={styles.menuImage}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 리뷰 탭 */}
            {activeTab === 'review' && (
              <div className={styles.reviewTab}>
                <div className={styles.reviewSummary}>
                  <span className={styles.reviewAvg}>⭐ {store.rating_average.toFixed(1)}</span>
                  <span className={styles.reviewCount}>{store.reviewCount}개의 리뷰</span>
                </div>
                
                {store.reviews.map(review => (
                  <div key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewUser}>{review.user}</span>
                      <span className={styles.reviewScore}>{'⭐'.repeat(review.score)}</span>
                    </div>
                    <p className={styles.reviewContent}>{review.content}</p>
                    {review.images.length > 0 && (
                      <div className={styles.reviewImages}>
                        {review.images.map((img, idx) => (
                          <img key={idx} src={img} alt="리뷰 이미지" />
                        ))}
                      </div>
                    )}
                    <span className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 단골 탭 */}
            {activeTab === 'regular' && (
              <div className={styles.regularTab}>
                <div className={styles.regularBanner}>
                  <h3>🏆 단골 등급 혜택</h3>
                  <p>방문할수록 더 많은 혜택을 받으세요!</p>
                </div>

                {store.promotions
                  .sort((a, b) => a.min_orders - b.min_orders)
                  .map(promo => (
                    <div key={promo.id} className={styles.regularCard}>
                      <div className={styles.regularLevel}>
                        <span className={styles.levelBadge}>{promo.level}</span>
                      </div>
                      <div className={styles.regularReq}>
                        <span>📌 조건</span>
                        <p>{promo.min_orders}회 이상 방문 또는 {promo.min_spent.toLocaleString()}원 이상 결제</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 하단 액션 */}
          <div className={styles.bottomActions}>
            <button className={styles.reserveBtn}>
              예약하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
