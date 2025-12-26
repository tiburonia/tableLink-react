import styles from './FeedEmpty.module.css'

export const FeedEmpty = () => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyIcon}>📖</div>
      <h3 className={styles.emptyTitle}>아직 스토리가 없습니다</h3>
      <p className={styles.emptyDescription}>
        매장에서 새로운 소식을 올리면<br />
        이곳에서 확인할 수 있어요
      </p>
    </div>
  )
}
