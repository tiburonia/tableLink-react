import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const stats = [
    { label: '총 매장', value: '156', change: '+12%', icon: '🏪' },
    { label: '총 회원', value: '3,452', change: '+8%', icon: '👥' },
    { label: '오늘 주문', value: '234', change: '+15%', icon: '📋' },
    { label: '오늘 매출', value: '₩2,340,000', change: '+23%', icon: '💰' },
  ]

  const recentOrders = [
    { id: '#12345', store: '맛있는 한식당', amount: '₩45,000', status: '완료', time: '10분 전' },
    { id: '#12344', store: '행복한 카페', amount: '₩12,500', status: '진행중', time: '15분 전' },
    { id: '#12343', store: '신선한 일식', amount: '₩78,000', status: '완료', time: '22분 전' },
    { id: '#12342', store: '피자파티', amount: '₩32,000', status: '취소', time: '30분 전' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>대시보드</h1>
        <p>TableLink 서비스 현황을 한눈에 확인하세요</p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statChange}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>최근 주문</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>매장</th>
                <th>금액</th>
                <th>상태</th>
                <th>시간</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.store}</td>
                  <td>{order.amount}</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status === '완료' ? 'completed' : order.status === '진행중' ? 'pending' : 'cancelled']}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>알림</h2>
          <div className={styles.notifications}>
            <div className={styles.notification}>
              <span className={styles.notifIcon}>🔔</span>
              <div>
                <p className={styles.notifTitle}>새로운 매장 가입 요청</p>
                <p className={styles.notifTime}>5분 전</p>
              </div>
            </div>
            <div className={styles.notification}>
              <span className={styles.notifIcon}>⚠️</span>
              <div>
                <p className={styles.notifTitle}>리뷰 신고 접수</p>
                <p className={styles.notifTime}>15분 전</p>
              </div>
            </div>
            <div className={styles.notification}>
              <span className={styles.notifIcon}>✅</span>
              <div>
                <p className={styles.notifTitle}>결제 시스템 점검 완료</p>
                <p className={styles.notifTime}>1시간 전</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
