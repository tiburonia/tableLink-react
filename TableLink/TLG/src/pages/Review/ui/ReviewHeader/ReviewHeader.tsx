import styles from './ReviewHeader.module.css'

interface ReviewHeaderProps {
  storeName: string
  onBack: () => void
}

export const ReviewHeader = ({ storeName, onBack }: ReviewHeaderProps) => {
  return (
    <div className={styles.reviewHeader}>
      <button className={styles.backButton} onClick={onBack}>
        ←
      </button>
      <h1 className={styles.pageTitle}>{storeName} 리뷰</h1>
      <div className={styles.headerSpacer}></div>
    </div>
  )
}
