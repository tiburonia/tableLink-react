import styles from './FeedHeader.module.css'

interface StoreInfo {
  id: number
  name: string
  logo: string
  bio: string
  followers: number
  isFollowing: boolean
}

interface FeedHeaderProps {
  store: StoreInfo | null
  onBack: () => void
}

export const FeedHeader = ({ store, onBack }: FeedHeaderProps) => {
  return (
    <>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className={styles.title}>매장 스토리</h1>
        <div className={styles.spacer} />
      </header>

      {store && (
        <div className={styles.storeProfile}>
          <img src={store.logo} alt={store.name} className={styles.storeLogo} />
          <div className={styles.storeInfo}>
            <h2 className={styles.storeName}>{store.name}</h2>
            <p className={styles.storeBio}>{store.bio}</p>
            <div className={styles.storeStats}>
              <span className={styles.followersCount}>단골 {store.followers}명</span>
            </div>
          </div>
          <button className={`${styles.followButton} ${store.isFollowing ? styles.following : ''}`}>
            {store.isFollowing ? '단골' : '단골 등록'}
          </button>
        </div>
      )}
    </>
  )
}
