import styles from './ReviewsPage.module.css'

export function ReviewsPage() {
  const reviews = [
    { id: 1, store: '맛있는 한식당', user: '홍길동', rating: 5, content: '정말 맛있어요! 다음에 또 올게요.', date: '2024-12-30', reported: false },
    { id: 2, store: '행복한 카페', user: '김영희', rating: 4, content: '분위기 좋고 커피도 맛있습니다.', date: '2024-12-29', reported: false },
    { id: 3, store: '신선한 일식', user: '박철수', rating: 2, content: '서비스가 별로였어요.', date: '2024-12-28', reported: true },
    { id: 4, store: '피자파티', user: '이수진', rating: 5, content: '피자가 정말 맛있어요!', date: '2024-12-27', reported: false },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>리뷰 관리</h1>
        <p>사용자 리뷰를 확인하고 관리하세요</p>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>매장</th>
              <th>작성자</th>
              <th>평점</th>
              <th>내용</th>
              <th>작성일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.store}</td>
                <td>{review.user}</td>
                <td>{'⭐'.repeat(review.rating)}</td>
                <td className={styles.content}>{review.content}</td>
                <td>{review.date}</td>
                <td>
                  <span className={`${styles.status} ${styles[review.reported ? 'reported' : 'normal']}`}>
                    {review.reported ? '신고됨' : '정상'}
                  </span>
                </td>
                <td>
                  <button className={styles.actionButton}>상세</button>
                  <button className={`${styles.actionButton} ${styles.danger}`}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
