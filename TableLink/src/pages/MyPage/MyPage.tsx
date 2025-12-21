import { useNavigate } from 'react-router-dom'
import { BottomNavigation } from '@/widgets/Layout'
import { ProfileHeader, HeroCard, MenuSection } from './ui'
import { useMyPageData, getLevelEmoji, getLevelGradient } from '@/features/mypage'
import { LoadingSpinner } from '@/shared/ui'
import styles from './MyPage.module.css'

interface MyPageProps {
  onLogout: () => void
  userInfo?: {
    userId: number
    name?: string
    username?: string
  }
}

export const MyPage = ({ onLogout, userInfo }: MyPageProps) => {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useMyPageData(userInfo)

  if (loading) {
    return (
      <div className={styles.mobileApp}>
        <div className={styles.mobileContent}>
          <LoadingSpinner fullScreen text="로딩 중..." />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.mobileApp}>
        <div className={styles.mobileContent}>
          <div className={styles.error}>
            <h2>🚫 마이페이지를 불러올 수 없습니다</h2>
            <p>{error || '잠시 후 다시 시도해주세요'}</p>
            <button onClick={refetch} className={styles.retryBtn}>
              다시 시도
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const displayName = data.userInfo.name || data.userInfo.username || '고객'
  const regularSummary = data.regularSummary

  return (
    <div className={styles.mobileApp}>
      <div className={styles.mobileContent}>
        <ProfileHeader displayName={displayName} />

        <div className={styles.container}>
          <HeroCard
            displayName={displayName}
            topLevel={regularSummary.topLevel}
            topLevelName={regularSummary.topLevelName}
            totalPoints={regularSummary.totalPoints}
            totalCoupons={regularSummary.totalCoupons}
            getLevelEmoji={getLevelEmoji}
            getLevelGradient={getLevelGradient}
          />

          <MenuSection
            title="주문"
            items={[
              {
                label: '주문 내역',
                onClick: () => navigate('/orders'),
              },
            ]}
          />

          <MenuSection
            title="결제"
            items={[
              {
                label: '테이블링크 간편결제 관리',
                onClick: () => alert('준비중입니다'),
              },
              {
                label: '테이블링크 페이 머니 관리',
                onClick: () => alert('준비중입니다'),
              },
            ]}
          />

          <MenuSection
            title="이용 정보"
            items={[
              {
                label: '내 리뷰',
                onClick: () => alert('내 리뷰 준비중'),
              },
              {
                label: '내 단골가게',
                onClick: () => alert('단골가게 준비중'),
              },
              {
                label: '이용 내역',
                onClick: () => navigate('/orders'),
              },
            ]}
          />

          <MenuSection
            items={[
              {
                label: '로그아웃',
                onClick: onLogout,
                isDanger: true,
              },
            ]}
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
