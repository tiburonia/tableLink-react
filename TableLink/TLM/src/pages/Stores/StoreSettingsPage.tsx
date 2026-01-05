import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as storeApi from '@/shared/api/storeApi'
import * as authApi from '@/shared/api/authApi'
import type { StoreInfo } from '@/shared/api/storeApi'
import styles from './StoreSettingsPage.module.css'

export function StoreSettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    store_tel_number: '',
    full_address: ''
  })

  useEffect(() => {
    const loadStore = async () => {
      const storeId = parseInt(localStorage.getItem('tlm_current_store_id') || '0')
      if (!storeId) {
        navigate('/')
        return
      }

      try {
        const response = await storeApi.getStoreById(storeId)
        if (response.success && response.store) {
          setStore(response.store)
          setEditForm({
            store_tel_number: String(response.store.store_tel_number),
            full_address: response.store.full_address
          })
        } else {
          setStore(storeApi.getDummyStore(storeId))
        }
      } catch (error) {
        console.error('매장 정보 로드 실패:', error)
        setStore(storeApi.getDummyStore(storeId))
      } finally {
        setIsLoading(false)
      }
    }
    loadStore()
  }, [navigate])

  const handleLogout = () => {
    authApi.logout()
    localStorage.removeItem('tlm_stores')
    localStorage.removeItem('tlm_current_store_id')
    localStorage.removeItem('tlm_current_store')
    window.location.reload()
  }

  const handleAmenityToggle = (key: 'wifi' | 'parking' | 'pet_friendly' | 'power_outlet' | 'smoking_area') => {
    if (!store) return
    setStore({
      ...store,
      amenities: {
        ...store.amenities,
        [key]: !store.amenities[key]
      }
    })
    // TODO: API 호출로 편의시설 상태 저장
  }

  const handleSaveInfo = () => {
    // TODO: API 호출로 매장 정보 저장
    if (store) {
      setStore({
        ...store,
        store_tel_number: editForm.store_tel_number,
        full_address: editForm.full_address
      })
    }
    setIsEditing(false)
  }

  // 바텀바 활성 상태 확인
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.loading}>
            <span>⚙️</span>
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
            <button className={styles.backBtn} onClick={() => navigate('/')}>
              ← 
            </button>
            <h1 className={styles.title}>매장 설정</h1>
            <div className={styles.headerSpacer}></div>
          </header>

          {/* 메인 콘텐츠 */}
          <main className={styles.main}>
            {/* 매장 기본 정보 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'info' ? null : 'info')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>📍</span>
                  <h3 className={styles.sectionTitle}>매장 정보</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'info' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'info' && (
                <div className={styles.sectionContent}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label>매장명</label>
                        <input 
                          type="text" 
                          value={store.name} 
                          disabled 
                          className={styles.disabledInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>전화번호</label>
                        <input 
                          type="tel" 
                          value={editForm.store_tel_number}
                          onChange={(e) => setEditForm({...editForm, store_tel_number: e.target.value})}
                          placeholder="000-0000-0000"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>주소</label>
                        <input 
                          type="text" 
                          value={editForm.full_address}
                          onChange={(e) => setEditForm({...editForm, full_address: e.target.value})}
                        />
                      </div>
                      <div className={styles.formActions}>
                        <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
                          취소
                        </button>
                        <button className={styles.saveBtn} onClick={handleSaveInfo}>
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.infoDisplay}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>매장명</span>
                        <span className={styles.infoValue}>{store.name}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>전화번호</span>
                        <span className={styles.infoValue}>{store.store_tel_number}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>주소</span>
                        <span className={styles.infoValue}>{store.full_address}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>지역</span>
                        <span className={styles.infoValue}>{store.sido} {store.sigungu}</span>
                      </div>
                      <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                        정보 수정
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 편의시설 설정 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'amenities' ? null : 'amenities')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>🛎️</span>
                  <h3 className={styles.sectionTitle}>편의시설</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'amenities' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'amenities' && (
                <div className={styles.sectionContent}>
                  <div className={styles.toggleList}>
                    <div className={styles.toggleItem}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>📶</span>
                        <span>Wi-Fi</span>
                      </div>
                      <button 
                        className={`${styles.toggle} ${store.amenities.wifi ? styles.on : ''}`}
                        onClick={() => handleAmenityToggle('wifi')}
                      >
                        <span className={styles.toggleKnob}></span>
                      </button>
                    </div>
                    <div className={styles.toggleItem}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>🅿️</span>
                        <span>주차장</span>
                      </div>
                      <button 
                        className={`${styles.toggle} ${store.amenities.parking ? styles.on : ''}`}
                        onClick={() => handleAmenityToggle('parking')}
                      >
                        <span className={styles.toggleKnob}></span>
                      </button>
                    </div>
                    <div className={styles.toggleItem}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>🐕</span>
                        <span>반려동물 동반</span>
                      </div>
                      <button 
                        className={`${styles.toggle} ${store.amenities.pet_friendly ? styles.on : ''}`}
                        onClick={() => handleAmenityToggle('pet_friendly')}
                      >
                        <span className={styles.toggleKnob}></span>
                      </button>
                    </div>
                    <div className={styles.toggleItem}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>🔌</span>
                        <span>콘센트</span>
                      </div>
                      <button 
                        className={`${styles.toggle} ${store.amenities.power_outlet ? styles.on : ''}`}
                        onClick={() => handleAmenityToggle('power_outlet')}
                      >
                        <span className={styles.toggleKnob}></span>
                      </button>
                    </div>
                    <div className={styles.toggleItem}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>🚬</span>
                        <span>흡연구역</span>
                      </div>
                      <button 
                        className={`${styles.toggle} ${store.amenities.smoking_area ? styles.on : ''}`}
                        onClick={() => handleAmenityToggle('smoking_area')}
                      >
                        <span className={styles.toggleKnob}></span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 단골 등급 관리 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'promotions' ? null : 'promotions')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>🏆</span>
                  <h3 className={styles.sectionTitle}>단골 등급</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'promotions' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'promotions' && (
                <div className={styles.sectionContent}>
                  <div className={styles.promotionList}>
                    {store.promotions
                      .sort((a, b) => a.min_orders - b.min_orders)
                      .map(promo => (
                        <div key={promo.id} className={styles.promotionCard}>
                          <div className={styles.promotionInfo}>
                            <span className={styles.promotionLevel}>{promo.level}</span>
                            <span className={styles.promotionReq}>
                              {promo.min_orders}회 이상 / {promo.min_spent.toLocaleString()}원 이상
                            </span>
                          </div>
                          <button className={styles.promotionEditBtn}>수정</button>
                        </div>
                      ))}
                  </div>
                  <button 
                    className={styles.addPromotionBtn}
                    onClick={() => navigate(`/stores/${store.id}/promotions`)}
                  >
                    + 등급 관리 페이지로 이동
                  </button>
                </div>
              )}
            </section>

            {/* 사진 관리 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'photos' ? null : 'photos')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>📸</span>
                  <h3 className={styles.sectionTitle}>매장 사진</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'photos' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'photos' && (
                <div className={styles.sectionContent}>
                  <div className={styles.photoGrid}>
                    <div className={styles.addPhotoCard}>
                      <span>📷</span>
                      <span>사진 추가</span>
                    </div>
                    {/* 실제 사진들이 여기 표시됨 */}
                  </div>
                  <p className={styles.photoHint}>
                    매장의 대표 사진을 추가해 주세요. 손님들이 매장을 쉽게 찾을 수 있습니다.
                  </p>
                </div>
              )}
            </section>

            {/* 영업 설정 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'hours' ? null : 'hours')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>🕐</span>
                  <h3 className={styles.sectionTitle}>영업 시간</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'hours' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'hours' && (
                <div className={styles.sectionContent}>
                  <div className={styles.hoursInfo}>
                    <p className={styles.comingSoon}>🚧 준비 중입니다</p>
                    <p className={styles.comingSoonDesc}>영업 시간 설정 기능이 곧 추가됩니다.</p>
                  </div>
                </div>
              )}
            </section>

            {/* 계정 관리 */}
            <section className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setActiveSection(activeSection === 'account' ? null : 'account')}
              >
                <div className={styles.sectionTitleWrapper}>
                  <span className={styles.sectionIcon}>👤</span>
                  <h3 className={styles.sectionTitle}>계정 관리</h3>
                </div>
                <span className={`${styles.chevron} ${activeSection === 'account' ? styles.open : ''}`}>
                  ▼
                </span>
              </div>
              
              {activeSection === 'account' && (
                <div className={styles.sectionContent}>
                  <button className={styles.logoutBtn} onClick={handleLogout}>
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </section>
          </main>

          {/* 하단 네비게이션 */}
          <nav className={styles.bottomNav}>
            <button 
              className={`${styles.navItem} ${isActive('/') && !isActive('/settings') && !isActive('/orders') && !isActive('/preview') ? styles.active : ''}`}
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
            <button className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}>
              <span>⚙️</span>
              <span>설정</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
