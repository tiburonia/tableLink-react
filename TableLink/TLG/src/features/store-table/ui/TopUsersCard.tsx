import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { TopUser } from '../model'
import { getRankEmoji, getLevelColor } from '../model'
import styles from './TopUsersCard.module.css'

interface TopUsersCardProps {
  storeId: number
}

export const TopUsersCard = ({ storeId }: TopUsersCardProps) => {
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        // TODO: API 호출로 실제 단골 고객 데이터 가져오기
        // const result = await storeService.getTopUsers(storeId)
        
        // 임시 데이터
        setTimeout(() => {
          setTopUsers([
            {
              id: 1,
              name: '김단골',
              level: 'VIP',
              visit_count: 42,
              total_spent: 850000
            },
            {
              id: 2,
              name: '이고객',
              level: 'GOLD',
              visit_count: 28,
              total_spent: 520000
            },
            {
              id: 3,
              name: '박충성',
              level: 'SILVER',
              visit_count: 15,
              total_spent: 320000
            }
          ])
          setLoading(false)
        }, 600)
      } catch (error) {
        console.error('단골 고객 로딩 실패:', error)
        setLoading(false)
      }
    }

    loadTopUsers()
  }, [storeId])

  const handleShowAllUsers = () => {
    // TODO: 전체 랭킹 페이지로 이동
    console.log('전체 랭킹 보기')
  }

  return (
    <div className={clsx(styles.topUsersCard, styles.premiumTopUsersCard)}>
      <div className={styles.cardGradientBg}></div>
      
      <div className={styles.topUsersHeader}>
        <div className={styles.topUsersTitleSection}>
          <div className={styles.topUsersIconWrapper}>
            <span className={styles.topUsersMainIcon}>👑</span>
          </div>
          <div className={styles.topUsersTitleInfo}>
            <h3 className={styles.topUsersTitle}>단골 고객</h3>
            <div className={styles.topUsersSubtitle}>최고의 고객들을 만나보세요</div>
          </div>
        </div>
        <div className={styles.topUsersStatusIndicator}>
          <span className={styles.vipDot}></span>
          <span className={styles.vipText}>VIP</span>
        </div>
      </div>

      <div className={styles.topUsersContent}>
        {loading ? (
          <div className={styles.topUsersLoadingSkeleton}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonUserItem}>
                <div className={styles.skeletonRank}></div>
                <div className={styles.skeletonUserAvatar}></div>
                <div className={styles.skeletonUserInfo}>
                  <div className={styles.skeletonUserName}></div>
                  <div className={styles.skeletonUserLevel}></div>
                </div>
                <div className={styles.skeletonUserStats}>
                  <div className={styles.skeletonStat}></div>
                  <div className={styles.skeletonStat}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.topUsersList}>
            {topUsers.map((user, index) => (
              <div key={user.id} className={styles.topUserItem}>
                <div className={styles.userRank}>
                  <span className={styles.rankEmoji}>{getRankEmoji(index)}</span>
                  <span className={styles.rankNumber}>#{index + 1}</span>
                </div>
                <div className={styles.userAvatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div 
                    className={styles.userLevel}
                    style={{ color: getLevelColor(user.level) }}
                  >
                    {user.level}
                  </div>
                </div>
                <div className={styles.userStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>방문</span>
                    <span className={styles.statValue}>{user.visit_count}회</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>결제</span>
                    <span className={styles.statValue}>
                      {(user.total_spent / 10000).toFixed(0)}만원
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.topUsersFooter}>
        <button 
          className={clsx(styles.topUsersDetailBtn, styles.modernOutlineBtn)}
          onClick={handleShowAllUsers}
        >
          <span className={styles.btnIcon}>🏆</span>
          <span className={styles.btnText}>전체 랭킹 보기</span>
          <span className={styles.btnArrow}>→</span>
        </button>
      </div>
    </div>
  )
}
