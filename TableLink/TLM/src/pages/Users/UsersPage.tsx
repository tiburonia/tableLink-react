import styles from './UsersPage.module.css'

export function UsersPage() {
  const users = [
    { id: 1, name: '홍길동', email: 'hong@email.com', phone: '010-1234-5678', joinDate: '2024-01-15', orders: 45, status: '활성' },
    { id: 2, name: '김영희', email: 'kim@email.com', phone: '010-2345-6789', joinDate: '2024-02-20', orders: 32, status: '활성' },
    { id: 3, name: '박철수', email: 'park@email.com', phone: '010-3456-7890', joinDate: '2024-03-10', orders: 18, status: '휴면' },
    { id: 4, name: '이수진', email: 'lee@email.com', phone: '010-4567-8901', joinDate: '2024-04-05', orders: 67, status: '활성' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>회원 관리</h1>
        <p>서비스 회원을 관리하세요</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>3,452</span>
          <span className={styles.statLabel}>전체 회원</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>3,120</span>
          <span className={styles.statLabel}>활성 회원</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>332</span>
          <span className={styles.statLabel}>휴면 회원</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>156</span>
          <span className={styles.statLabel}>이번 달 신규</span>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>연락처</th>
              <th>가입일</th>
              <th>주문수</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className={styles.userName}>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.joinDate}</td>
                <td>{user.orders}건</td>
                <td>
                  <span className={`${styles.status} ${styles[user.status === '활성' ? 'active' : 'dormant']}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className={styles.actionButton}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
