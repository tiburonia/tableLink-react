/**
 * LocationSection - 위치 기준 추천 섹션
 * 
 * 자체 상태 관리 → MainPage 리렌더링 격리
 * 위치 변경 시 이 컴포넌트만 리렌더
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNearbyStores } from '../../hooks/useNearbyStores'
import styles from './LocationSection.module.css'

interface LocationSectionProps {
  onLoaded?: () => void
}

// 프리셋 위치 목록
const PRESET_LOCATIONS = [
  { id: 'current', name: '현재 위치', lat: 37.5665, lng: 126.978, emoji: '📍' },
  { id: 'seoul-station', name: '서울역', lat: 37.5547, lng: 126.9707, emoji: '🚉' },
  { id: 'gangnam', name: '강남역', lat: 37.4979, lng: 127.0276, emoji: '🏙️' },
  { id: 'hongdae', name: '홍대입구', lat: 37.5563, lng: 126.9236, emoji: '🎸' },
  { id: 'jamsil', name: '잠실', lat: 37.5133, lng: 127.1001, emoji: '🏟️' },
] as const

export const LocationSection = ({ onLoaded }: LocationSectionProps) => {
  const navigate = useNavigate()
  const [selectedLocationId, setSelectedLocationId] = useState('seoul-station')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedLocation = PRESET_LOCATIONS.find(l => l.id === selectedLocationId) || PRESET_LOCATIONS[1]
  const { stores, isLoading } = useNearbyStores(selectedLocation.lat, selectedLocation.lng)
  const hasNotifiedRef = useRef(false)

  // 초기 로딩 완료 시 부모에게 알림 (한 번만)
  useEffect(() => {
    if (!isLoading && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onLoaded?.()
    }
  }, [isLoading, onLoaded])

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId)
    setIsDropdownOpen(false)
  }

  const handleStoreClick = (storeId: string) => {
    navigate(`/rs/${storeId}`)
  }

  const handleMapClick = () => {
    navigate('/map', {
      state: { lat: selectedLocation.lat, lng: selectedLocation.lng }
    })
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>📍 내 주변 맛집</h2>
        <button className={styles.mapBtn} onClick={handleMapClick}>
          지도보기
        </button>
      </div>

      {/* 위치 선택 드롭다운 */}
      <div className={styles.locationSelector}>
        <button 
          className={styles.locationBtn}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className={styles.locationEmoji}>{selectedLocation.emoji}</span>
          <span className={styles.locationName}>{selectedLocation.name}</span>
          <span className={styles.dropdownIcon}>{isDropdownOpen ? '▲' : '▼'}</span>
        </button>

        {isDropdownOpen && (
          <div className={styles.dropdown}>
            {PRESET_LOCATIONS.map(location => (
              <button
                key={location.id}
                className={`${styles.dropdownItem} ${
                  selectedLocationId === location.id ? styles.active : ''
                }`}
                onClick={() => handleLocationSelect(location.id)}
              >
                <span>{location.emoji}</span>
                <span>{location.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 주변 매장 리스트 */}
      <div className={styles.storeList}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>주변 매장을 찾는 중...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <p>주변에 매장이 없습니다.</p>
          </div>
        ) : (
          stores.slice(0, 5).map((store, index) => (
            <div
              key={store.id}
              className={styles.storeCard}
              onClick={() => handleStoreClick(store.id)}
            >
              <div className={styles.rank}>{index + 1}</div>
              <div className={styles.storeInfo}>
                <h3 className={styles.storeName}>{store.name}</h3>
                <p className={styles.storeCategory}>{store.category || '맛집'}</p>
              </div>
              <div className={styles.storeMeta}>
                <span className={styles.rating}>⭐ {store.rating?.toFixed(1) || '-'}</span>
                {store.distance && (
                  <span className={styles.distance}>
                    {store.distance < 1 
                      ? `${Math.round(store.distance * 1000)}m` 
                      : `${store.distance.toFixed(1)}km`}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
