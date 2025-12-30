import styles from './StarRating.module.css'

interface StarRatingProps {
  rating: number
}

export const StarRating = ({ rating }: StarRatingProps) => {
  return (
    <div className={styles.starRating}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${styles.star} ${i < rating ? styles.filled : ''}`}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
}
