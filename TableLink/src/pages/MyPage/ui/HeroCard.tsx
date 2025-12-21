/**
 * HeroCard - 등급/포인트 정보 카드
 */

import styles from './HeroCard.module.css'

interface HeroCardProps {
  displayName: string
  topLevel: string
  topLevelName: string
  totalPoints: number
  totalCoupons: number
  getLevelEmoji: (level: string) => string
  getLevelGradient: (level: string) => string
}

export function HeroCard({
  displayName,
  topLevel,
  topLevelName,
  totalPoints,
  totalCoupons,
  getLevelEmoji,
  getLevelGradient,
}: HeroCardProps) {
  return (
    <section
      className={styles.heroCard}
      style={{ background: getLevelGradient(topLevel) }}
    >
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroEmoji}>{getLevelEmoji(topLevel)}</span>
          <span className={styles.heroLevel}>{topLevelName}</span>
        </div>
        <h2 className={styles.heroTitle}>
          <span>{displayName}</span>님은 현재{' '}
          <strong>{topLevelName}</strong> 등급이에요!
        </h2>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statText}>
              누적 포인트: <strong>{totalPoints}P</strong>
            </span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.statIcon}>🎟️</span>
            <span className={styles.statText}>
              보유 쿠폰: <strong>{totalCoupons}장</strong>
            </span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <button 
            className={`${styles.heroBtn} ${styles.outline}`}
            onClick={() => alert('포인트 내역 준비중')}
          >
            포인트 내역
          </button>
          <button 
            className={`${styles.heroBtn} ${styles.filled}`}
            onClick={() => alert('쿠폰함 준비중')}
          >
            쿠폰함
          </button>
        </div>
      </div>
    </section>
  )
}
