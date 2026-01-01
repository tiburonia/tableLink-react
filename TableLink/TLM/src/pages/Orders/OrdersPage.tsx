import styles from './OrdersPage.module.css'

export function OrdersPage() {
  const orders = [
    { id: '#12345', store: '맛있는 한식당', user: '홍길동', amount: '₩45,000', status: '완료', date: '2024-12-30 14:30' },
    { id: '#12344', store: '행복한 카페', user: '김영희', amount: '₩12,500', status: '진행중', date: '2024-12-30 14:25' },
    { id: '#12343', store: '신선한 일식', user: '박철수', amount: '₩78,000', status: '완료', date: '2024-12-30 14:20' },
    { id: '#12342', store: '피자파티', user: '이수진', amount: '₩32,000', status: '취소', date: '2024-12-30 14:15' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>주문 관리</h1>
        <p>전체 주문 내역을 확인하고 관리하세요</p>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>주문번호</th>
              <th>매장</th>
              <th>주문자</th>
              <th>금액</th>
              <th>상태</th>
              <th>주문일시</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.orderId}>{order.id}</td>
                <td>{order.store}</td>
                <td>{order.user}</td>
                <td>{order.amount}</td>
                <td>
                  <span className={`${styles.status} ${styles[order.status === '완료' ? 'completed' : order.status === '진행중' ? 'pending' : 'cancelled']}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.date}</td>
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
