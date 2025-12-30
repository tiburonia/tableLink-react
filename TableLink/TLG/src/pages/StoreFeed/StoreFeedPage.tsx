import { useParams } from 'react-router-dom'
import { useStoreFeed, FeedHeader, FeedPost, FeedEmpty } from '@/features/store-feed'
import styles from './StoreFeedPage.module.css'

const StoreFeedPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const {
    store,
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    toggleLike,
    goBack,
  } = useStoreFeed(storeId)

  if (loading && posts.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={goBack}>
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="mobile-app">
    <div className="mobile-content">
      <FeedHeader store={store} onBack={goBack} />

      <div className={styles.feedList}>
        {posts.length === 0 ? (
          <FeedEmpty />
        ) : (
          <>
            {posts.map((post) => (
              <FeedPost
                key={post.id}
                {...post}
                onLike={toggleLike}
              />
            ))}

            {hasMore && (
              <div className={styles.loadMoreContainer}>
                <button
                  className={styles.loadMoreButton}
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className={styles.endMessage}>
                모든 스토리를 확인했어요 📖
              </p>
            )}
          </>
        )}
        </div>
        </div>
    </div>
  )
}

export default StoreFeedPage
