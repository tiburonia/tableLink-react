import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as storeApi from '@/shared/api/storeApi'
import type { StoreInfo, MenuItem, TableInfo } from '@/shared/api/storeApi'
import styles from './StorePreviewPage.module.css'

type TabType = 'main' | 'menu' | 'review' | 'regular'

export function StorePreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('main')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadStoreData = async () => {
      // localStorage에서 현재 매장 ID 가져오기
      const storeId = parseInt(localStorage.getItem('tlm_current_store_id') || '0')
      
      if (!storeId) {
        console.log('❌ storeId가 없음')
        setIsLoading(false)
        return
      }

      try {
        console.log('👁️ 미리보기 데이터 로드:', storeId)
        
        // 매장 기본 정보, 메뉴, 테이블 병렬 로드
        const [storeRes, menuRes, tableRes] = await Promise.all([
          storeApi.getStoreById(storeId),
          storeApi.getMenuItems(storeId),
          storeApi.getTables(storeId)
        ])

        if (storeRes.success && storeRes.store) {
          setStore(storeRes.store)
        } else {
          // API 실패 시 더미 데이터 사용
          console.log('매장 API 실패, 더미 데이터 사용')
          setStore(storeApi.getDummyStore(storeId))
        }

        // 메뉴 데이터
        if (menuRes.success && menuRes.menus) {
          console.log('✅ 메뉴 로드:', menuRes.menus.length, '개')
          setMenus(menuRes.menus)
        } else if (storeRes.store?.menu) {
          setMenus(storeRes.store.menu)
        }

        // 테이블 데이터
        if (tableRes.success && tableRes.tables) {
          console.log('✅ 테이블 로드:', tableRes.tables.length, '개')
          setTables(tableRes.tables)
        } else if (storeRes.store?.tables) {
          setTables(storeRes.store.tables)
        }

      } catch (error) {
        console.error('미리보기 데이터 로드 실패:', error)
        const storeId = parseInt(localStorage.getItem('tlm_current_store_id') || '0')
        setStore(storeApi.getDummyStore(storeId || 1))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStoreData()
  }, [])

  // 바텀바 활성 상태 확인
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  // 테이블 상태 계산
  const tableStats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length
  }

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
                  {menus.length > 0 ? (
                    <div className={styles.featuredMenu}>
                      {menus.slice(0, 3).map(item => (
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
                  ) : (
                    <div className={styles.emptyState}>
                      <span>🍽️</span>
                      <p>등록된 메뉴가 없습니다</p>
                    </div>
                  )}
                </section>

                {/* 테이블 현황 */}
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>테이블 현황</h3>
                  {tables.length > 0 ? (
                    <div className={styles.tableStatus}>
                      <div className={styles.tableStatCard}>
                        <span className={styles.tableStatIcon}>🪑</span>
                        <span className={styles.tableStatValue}>{tableStats.available}</span>
                        <span className={styles.tableStatLabel}>이용가능</span>
                      </div>
                      <div className={styles.tableStatCard}>
                        <span className={styles.tableStatIcon}>👥</span>
                        <span className={styles.tableStatValue}>{tableStats.occupied}</span>
                        <span className={styles.tableStatLabel}>사용중</span>
                      </div>
                      <div className={styles.tableStatCard}>
                        <span className={styles.tableStatIcon}>📅</span>
                        <span className={styles.tableStatValue}>{tableStats.reserved}</span>
                        <span className={styles.tableStatLabel}>예약됨</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <span>🪑</span>
                      <p>등록된 테이블이 없습니다</p>
                    </div>
                  )}
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
                      <span>
                        테이블 {tables.length > 0 ? tables.length : store.tableCount}개 
                        (빈 테이블 {tables.length > 0 ? tableStats.available : store.tableStatusSummary.available}개)
                      </span>
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
                {menus.length > 0 ? (
                  menus.map(item => (
                    <div key={item.id} className={styles.menuItem}>
                      <div className={styles.menuInfo}>
                        <h4 className={styles.menuName}>{item.name}</h4>
                        <p className={styles.menuDesc}>{item.description || '맛있는 메뉴입니다'}</p>
                        <span className={styles.menuPrice}>{item.price.toLocaleString()}원</span>
                      </div>
                      <img 
                        src={`https://picsum.photos/100/100?random=${item.id + 10}`}
                        alt={item.name}
                        className={styles.menuImage}
                      />
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <span>🍽️</span>
                    <p>등록된 메뉴가 없습니다</p>
                    <small>매장 관리에서 메뉴를 추가해보세요</small>
                  </div>
                )}
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

          {/* 하단 네비게이션 */}
          <nav className={styles.bottomNav}>
            <button 
              className={`${styles.navItem} ${isActive('/') && !isActive('/preview') && !isActive('/settings') && !isActive('/orders') ? styles.active : ''}`}
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
            <button className={`${styles.navItem} ${isActive('/preview') ? styles.active : ''}`}>
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
          </nav>
        </div>
      </div>
    </div>
  )
}
