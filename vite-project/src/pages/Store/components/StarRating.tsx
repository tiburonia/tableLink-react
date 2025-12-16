interface StarRatingProps {
  rating: number
}

export const StarRating = ({ rating }: StarRatingProps) => {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'star filled' : 'star'}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </>
  )
}
