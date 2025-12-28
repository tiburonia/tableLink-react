/**
 * CategorySection - 카테고리 기준 추천 섹션
 * 
 * 자체 상태 관리 → MainPage 리렌더링 격리
 * 카테고리 변경 시 이 컴포넌트만 리렌더
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategoryStores } from '../../hooks/useCategoryStores'
import styles from './CategorySection.module.css'

interface CategorySectionProps {
  onLoaded?: () => void
}

// 카테고리 상수 (UI용)
const CATEGORIES = [
  { id: 'korean', name: '한식', emoji: '🍚' },
  { id: 'japanese', name: '일식', emoji: '🍣' },
  { id: 'chinese', name: '중식', emoji: '🥡' },
  { id: 'western', name: '양식', emoji: '🍝' },
  { id: 'cafe', name: '카페', emoji: '☕' },
  { id: 'chicken', name: '치킨', emoji: '🍗' },
] as const

export const CategorySection = ({ onLoaded }: CategorySectionProps) => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('korean')
  const { stores, isLoading } = useCategoryStores(selectedCategory)
  const hasNotifiedRef = useRef(false)

  // 초기 로딩 완료 시 부모에게 알림 (한 번만)
  useEffect(() => {
    if (!isLoading && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onLoaded?.()
    }
  }, [isLoading, onLoaded])

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleStoreClick = (storeId: string) => {
    navigate(`/rs/${storeId}`)
  }

  const handleMoreClick = () => {
    navigate(`/category/${selectedCategory}`)
  }

  const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory)

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>🍽️ 카테고리별 맛집</h2>
        <button className={styles.moreBtn} onClick={handleMoreClick}>
          더보기
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div className={styles.categoryTabs}>
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryTab} ${
              selectedCategory === category.id ? styles.active : ''
            }`}
            onClick={() => handleCategoryClick(category.id)}
          >
            <span className={styles.categoryEmoji}>{category.emoji}</span>
            <span className={styles.categoryName}>{category.name}</span>
          </button>
        ))}
      </div>

      {/* 매장 리스트 */}
      <div className={styles.storeList}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>매장을 불러오는 중...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <p>{selectedCategoryData?.name} 매장이 없습니다.</p>
          </div>
        ) : (
          stores.slice(0, 4).map(store => (
            <div
              key={store.id}
              className={styles.storeCard}
              onClick={() => handleStoreClick(store.id)}
            >
              <div className={styles.storeImage}>
                <span className={styles.storeEmoji}>
                  {selectedCategoryData?.emoji || '🏪'}
                </span>
              </div>
              <div className={styles.storeInfo}>
                <h3 className={styles.storeName}>{store.name}</h3>
                <div className={styles.storeRating}>
                  ⭐ {store.rating?.toFixed(1) || '-'}
                </div>
                <p className={styles.storeAddress}>{store.address}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
