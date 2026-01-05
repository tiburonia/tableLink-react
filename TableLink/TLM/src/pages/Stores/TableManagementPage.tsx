import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as storeApi from '@/shared/api/storeApi'
import type { TableInfo } from '@/shared/api/storeApi'
import styles from './TableManagementPage.module.css'

type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'

export function TableManagementPage() {
  const navigate = useNavigate()
  const { storeId: paramStoreId } = useParams()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableInfo | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // 폼 상태
  const [formData, setFormData] = useState({
    table_name: '',
    capacity: 4
  })

  const storeId = paramStoreId 
    ? parseInt(paramStoreId) 
    : parseInt(localStorage.getItem('tlm_current_store_id') || '0')

  // 테이블 목록 로드
  useEffect(() => {
    const loadTables = async () => {
      if (!storeId) {
        setError('매장 정보를 찾을 수 없습니다')
        setIsLoading(false)
        return
      }

      try {
        console.log('🪑 테이블 목록 로드:', storeId)
        const response = await storeApi.getTables(storeId)
        
        if (response.success && response.tables) {
          setTables(response.tables)
          console.log(`✅ 테이블 ${response.count}개 로드 완료`)
        } else {
          setError(response.error || '테이블 목록을 불러올 수 없습니다')
        }
      } catch (err) {
        console.error('테이블 로드 실패:', err)
        setError('테이블 목록을 불러오는 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    loadTables()
  }, [storeId])

  // 새 테이블 추가 모달 열기
  const handleAddTable = () => {
    setEditingTable(null)
    setFormData({
      table_name: `테이블 ${tables.length + 1}`,
      capacity: 4
    })
    setIsModalOpen(true)
  }

  // 테이블 수정 모달 열기
  const handleEditTable = (table: TableInfo) => {
    setEditingTable(table)
    setFormData({
      table_name: table.table_name,
      capacity: table.capacity
    })
    setIsModalOpen(true)
  }

  // 테이블 저장 (추가 또는 수정)
  const handleSaveTable = async () => {
    if (!formData.table_name.trim()) {
      alert('테이블명을 입력해주세요')
      return
    }

    setIsSaving(true)

    try {
      if (editingTable) {
        // 수정
        console.log('✏️ 테이블 수정:', editingTable.id)
        const response = await storeApi.updateTable(storeId, editingTable.id, formData)
        
        if (response.success) {
          setTables(prev => prev.map(t => 
            t.id === editingTable.id 
              ? { ...t, ...formData } 
              : t
          ))
          setIsModalOpen(false)
          alert('테이블이 수정되었습니다')
        } else {
          alert(response.error || '테이블 수정에 실패했습니다')
        }
      } else {
        // 추가
        console.log('➕ 테이블 추가')
        const response = await storeApi.addTable(storeId, formData)
        
        if (response.success && response.data) {
          const newTable = response.data as TableInfo
          setTables(prev => [...prev, newTable])
          setIsModalOpen(false)
          alert('테이블이 추가되었습니다')
        } else {
          alert(response.error || '테이블 추가에 실패했습니다')
        }
      }
    } catch (err) {
      console.error('테이블 저장 실패:', err)
      alert('테이블 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 테이블 삭제
  const handleDeleteTable = async (table: TableInfo) => {
    if (table.status === 'OCCUPIED') {
      alert('사용 중인 테이블은 삭제할 수 없습니다')
      return
    }
    
    if (!confirm(`"${table.table_name}" 테이블을 삭제하시겠습니까?`)) {
      return
    }

    try {
      console.log('🗑️ 테이블 삭제:', table.id)
      const response = await storeApi.deleteTable(storeId, table.id)
      
      if (response.success) {
        setTables(prev => prev.filter(t => t.id !== table.id))
        alert('테이블이 삭제되었습니다')
      } else {
        alert(response.error || '테이블 삭제에 실패했습니다')
      }
    } catch (err) {
      console.error('테이블 삭제 실패:', err)
      alert('테이블 삭제 중 오류가 발생했습니다')
    }
  }

  // 테이블 상태 변경
  const handleStatusChange = async (table: TableInfo, newStatus: TableStatus) => {
    try {
      console.log('🔄 테이블 상태 변경:', table.id, '->', newStatus)
      const response = await storeApi.updateTableStatus(storeId, table.id, newStatus)
      
      if (response.success) {
        setTables(prev => prev.map(t => 
          t.id === table.id 
            ? { ...t, status: newStatus } 
            : t
        ))
      } else {
        alert(response.error || '상태 변경에 실패했습니다')
      }
    } catch (err) {
      console.error('상태 변경 실패:', err)
      alert('상태 변경 중 오류가 발생했습니다')
    }
  }

  // 상태별 색상 및 텍스트
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { text: '이용가능', color: 'available', icon: '🟢' }
      case 'OCCUPIED':
        return { text: '사용중', color: 'occupied', icon: '🔴' }
      case 'RESERVED':
        return { text: '예약됨', color: 'reserved', icon: '🟡' }
      default:
        return { text: '알수없음', color: 'unknown', icon: '⚪' }
    }
  }

  // 통계 계산
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'AVAILABLE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  }

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.loading}>
            <span>🪑</span>
            <p>테이블 로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.error}>
            <span>❌</span>
            <p>{error}</p>
            <button onClick={() => navigate(-1)}>뒤로가기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← 뒤로
            </button>
            <h1>테이블 관리</h1>
            <button className={styles.addBtn} onClick={handleAddTable}>
              + 추가
            </button>
          </header>

          {/* 테이블 통계 */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>전체</span>
            </div>
            <div className={`${styles.statItem} ${styles.available}`}>
              <span className={styles.statValue}>{stats.available}</span>
              <span className={styles.statLabel}>🟢 이용가능</span>
            </div>
            <div className={`${styles.statItem} ${styles.occupied}`}>
              <span className={styles.statValue}>{stats.occupied}</span>
              <span className={styles.statLabel}>🔴 사용중</span>
            </div>
            <div className={`${styles.statItem} ${styles.reserved}`}>
              <span className={styles.statValue}>{stats.reserved}</span>
              <span className={styles.statLabel}>🟡 예약</span>
            </div>
          </div>

          {/* 테이블 그리드 */}
          <main className={styles.tableGrid}>
            {tables.length === 0 ? (
              <div className={styles.emptyState}>
                <span>🪑</span>
                <p>등록된 테이블이 없습니다</p>
                <button onClick={handleAddTable}>첫 테이블 추가하기</button>
              </div>
            ) : (
              tables.map(table => {
                const statusInfo = getStatusInfo(table.status)
                return (
                  <div 
                    key={table.id} 
                    className={`${styles.tableCard} ${styles[statusInfo.color]}`}
                  >
                    <div className={styles.tableHeader}>
                      <h3 className={styles.tableName}>{table.table_name}</h3>
                      <span className={styles.tableStatus}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                    
                    <div className={styles.tableInfo}>
                      <span className={styles.capacity}>👥 {table.capacity}인석</span>
                    </div>

                    {/* 상태 변경 버튼 */}
                    <div className={styles.statusButtons}>
                      <button
                        className={`${styles.statusBtn} ${table.status === 'AVAILABLE' ? styles.active : ''}`}
                        onClick={() => handleStatusChange(table, 'AVAILABLE')}
                        disabled={table.status === 'AVAILABLE'}
                      >
                        이용가능
                      </button>
                      <button
                        className={`${styles.statusBtn} ${table.status === 'OCCUPIED' ? styles.active : ''}`}
                        onClick={() => handleStatusChange(table, 'OCCUPIED')}
                        disabled={table.status === 'OCCUPIED'}
                      >
                        사용중
                      </button>
                      <button
                        className={`${styles.statusBtn} ${table.status === 'RESERVED' ? styles.active : ''}`}
                        onClick={() => handleStatusChange(table, 'RESERVED')}
                        disabled={table.status === 'RESERVED'}
                      >
                        예약
                      </button>
                    </div>

                    {/* 수정/삭제 버튼 */}
                    <div className={styles.tableActions}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleEditTable(table)}
                      >
                        ✏️ 수정
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteTable(table)}
                        disabled={table.status === 'OCCUPIED'}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </main>

          {/* 테이블 추가/수정 모달 */}
          {isModalOpen && (
            <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>{editingTable ? '테이블 수정' : '새 테이블 추가'}</h2>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>테이블명 *</label>
                    <input
                      type="text"
                      value={formData.table_name}
                      onChange={e => setFormData(prev => ({ ...prev, table_name: e.target.value }))}
                      placeholder="테이블 이름을 입력하세요"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>좌석 수</label>
                    <div className={styles.capacitySelector}>
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`${styles.capacityBtn} ${formData.capacity === num ? styles.active : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, capacity: num }))}
                        >
                          {num}인
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSaveTable}
                    disabled={isSaving}
                  >
                    {isSaving ? '저장 중...' : (editingTable ? '수정' : '추가')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
