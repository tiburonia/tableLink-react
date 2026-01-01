import { useState } from 'react'
import styles from './StoresPage.module.css'

export function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const stores = [
    { id: 1, name: '맛있는 한식당', category: '한식', owner: '김철수', status: '영업중', rating: 4.5, orders: 234 },
    { id: 2, name: '행복한 카페', category: '카페', owner: '이영희', status: '영업중', rating: 4.8, orders: 189 },
    { id: 3, name: '신선한 일식', category: '일식', owner: '박민수', status: '휴무', rating: 4.2, orders: 156 },
    { id: 4, name: '피자파티', category: '양식', owner: '최지훈', status: '영업중', rating: 4.6, orders: 312 },
    { id: 5, name: '치킨마을', category: '치킨', owner: '정수진', status: '대기중', rating: 4.3, orders: 89 },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>매장 관리</h1>
          <p>등록된 매장을 관리하세요</p>
        </div>
        <button className={styles.addButton}>+ 매장 추가</button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="매장명, 사업자명 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select className={styles.filter}>
          <option value="">전체 상태</option>
          <option value="active">영업중</option>
          <option value="closed">휴무</option>
          <option value="pending">대기중</option>
        </select>
        <select className={styles.filter}>
          <option value="">전체 카테고리</option>
          <option value="korean">한식</option>
          <option value="japanese">일식</option>
          <option value="western">양식</option>
          <option value="cafe">카페</option>
        </select>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>매장명</th>
              <th>카테고리</th>
              <th>대표자</th>
              <th>상태</th>
              <th>평점</th>
              <th>총 주문</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td className={styles.storeName}>{store.name}</td>
                <td>{store.category}</td>
                <td>{store.owner}</td>
                <td>
                  <span className={`${styles.status} ${styles[store.status === '영업중' ? 'active' : store.status === '휴무' ? 'closed' : 'pending']}`}>
                    {store.status}
                  </span>
                </td>
                <td>⭐ {store.rating}</td>
                <td>{store.orders}건</td>
                <td>
                  <button className={styles.actionButton}>상세</button>
                  <button className={styles.actionButton}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
