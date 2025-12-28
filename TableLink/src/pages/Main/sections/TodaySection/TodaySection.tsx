/**
 * TodaySection - 오늘의 가게 섹션
 * 
 * 자체 상태 관리 → MainPage 리렌더링 격리
 * 요일 기반 API 사용 (id % t === 0)
 */

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodayStores } from '../../hooks/useTodayStores'
import styles from './TodaySection.module.css'

interface TodaySectionProps {
  onLoaded?: () => void
}

// 카테고리별 이모지 매핑
const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    '한식': '🍚',
    '일식': '🍣',
    '중식': '🥡',
    '양식': '🍝',
    '카페': '☕',
    '분식': '🍜',
    '치킨': '🍗',
    '피자': '🍕',
    '패스트푸드': '🍔',
    '베이커리': '🥐',
    '디저트': '🍰',
    '술집': '🍺',
  }
  return emojiMap[category] || '🍽️'
}

export const TodaySection = ({ onLoaded }: TodaySectionProps) => {
  const navigate = useNavigate()
  const { stores, dayOfWeek, isLoading } = useTodayStores(5)
  const hasNotifiedRef = useRef(false)

  // 초기 로딩 완료 시 부모에게 알림 (한 번만)
  useEffect(() => {
    if (!isLoading && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      onLoaded?.()
    }
  }, [isLoading, onLoaded])

  const handleStoreClick = (storeId: string) => {
    navigate(`/rs/${storeId}`)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>✨ 오늘의 가게</h2>
          <span className={styles.subtitle}>로딩 중...</span>
        </div>
        <div className={styles.scrollContainer}>
          <div className={styles.cardList}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                <div className={styles.cardImage}>
                  <span className={styles.emoji}>🍽️</span>
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.category}>로딩중</span>
                  <h3 className={styles.storeName}>...</h3>
                  <p className={styles.description}>잠시만 기다려주세요</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // 데이터 없음
  if (stores.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>✨ 오늘의 가게</h2>
          <span className={styles.subtitle}>추천 가게가 없습니다</span>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>✨ 오늘의 가게</h2>
        <span className={styles.subtitle}>{dayOfWeek}요일 추천 맛집</span>
      </div>

      <div className={styles.scrollContainer}>
        <div className={styles.cardList}>
          {stores.map(store => (
            <div
              key={store.id}
              className={styles.card}
              onClick={() => handleStoreClick(store.id)}
            >
              <div className={styles.cardImage}>
                <span className={styles.emoji}>{getCategoryEmoji(store.category)}</span>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.category}>{store.category}</span>
                <h3 className={styles.storeName}>{store.name}</h3>
                <p className={styles.description}>
                  ⭐ {store.rating.toFixed(1)} · 리뷰 {store.reviewCount}개
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
