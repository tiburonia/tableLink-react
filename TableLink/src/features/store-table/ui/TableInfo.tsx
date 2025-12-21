import { useState, useEffect } from 'react'
import clsx from 'clsx'
import styles from './TableInfo.module.css'

interface Table {
  id: number
  store_id: number
  table_name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

interface TableInfoProps {
  storeId: number
  isOpen: boolean
}

export const TableInfo = ({ storeId, isOpen }: TableInfoProps) => {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // 테이블 데이터 로드
  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/stores/${storeId}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      if (data.success && data.tables) {
        setTables(data.tables)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('❌ 테이블 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTables()

    // 30초마다 자동 새로고침 (매장이 운영중일 때만)
    if (isOpen) {
      const interval = setInterval(loadTables, 30000)
      return () => clearInterval(interval)
    }
  }, [storeId, isOpen])

  // 통계 계산
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length
  const totalCount = tables.length
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0
  
  const usedSeats = tables.filter(t => t.status === 'OCCUPIED').reduce((sum, t) => sum + t.capacity, 0)
  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)

  const handleManualRefresh = () => {
    loadTables()
  }

  if (loading) {
    return (
      <div className={clsx(styles.tlrContainer, styles.premiumTableCard)}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>테이블 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(styles.tlrContainer, styles.premiumTableCard)}>
      <div className={styles.cardGradientBg}></div>

      <div className={styles.tlrHeaderNew}>
        <div className={styles.statusIndicatorWrapper}>
          <div className={`status-pulse ${isOpen ? 'active' : 'inactive'}`}></div>
          <div className={styles.tlrTitleSection}>
            <h3 className={styles.tlrMainTitle}>테이블 현황</h3>
            <div className={`tlr-status-badge ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? '실시간 업데이트 중' : '운영중지'}
            </div>
          </div>
        </div>
        <div className={styles.refreshIndicator} onClick={handleManualRefresh}>
          <span className={styles.refreshIcon}>🔄</span>
        </div>
      </div>

      <div className={styles.tableVisualSummary}>
        <div className={styles.visualStatsRow}>
          <div className={clsx(styles.visualStatItem, styles.occupied)}>
            <div className={styles.visualIcon}>🔴</div>
            <div className={styles.visualData}>
              <span className={styles.visualNumber}>{occupiedCount}</span>
              <span className={styles.visualLabel}>사용중</span>
            </div>
          </div>
          <div className={clsx(styles.visualStatItem, styles.available)}>
            <div className={styles.visualIcon}>🟢</div>
            <div className={styles.visualData}>
              <span className={styles.visualNumber}>{availableCount}</span>
              <span className={styles.visualLabel}>이용가능</span>
            </div>
          </div>
          <div className={clsx(styles.visualStatItem, styles.total)}>
            <div className={styles.visualIcon}>⚪</div>
            <div className={styles.visualData}>
              <span className={styles.visualNumber}>{totalCount}</span>
              <span className={styles.visualLabel}>전체</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableDetailToggleSection}>
        <button 
          className={styles.tableDetailToggleBtn} 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={styles.toggleText}>테이블 현황 자세히 보기</span>
          <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {isExpanded && (
        <div className={styles.tableDetailContent}>
          <div className={styles.occupancyVisualization}>
            <div className={styles.occupancyHeader}>
              <span className={styles.occupancyTitle}>좌석 사용률</span>
              <div className={styles.occupancyPercentageWrapper}>
                <span className={styles.occupancyPercentage}>{occupancyRate}%</span>
                <div className={styles.percentageTrend}>
                  <span className={styles.trendIcon}>📈</span>
                </div>
              </div>
            </div>

            <div className={styles.occupancyProgressContainer}>
              <div className={styles.occupancyTrack}>
                <div 
                  className={styles.occupancyFill} 
                  style={{ width: `${occupancyRate}%` }}
                ></div>
                <div 
                  className={styles.occupancyGlow} 
                  style={{ left: `${occupancyRate}%` }}
                ></div>
              </div>
              <div className={styles.occupancyMarkers}>
                <span className={clsx(styles.marker, styles.low)}>25%</span>
                <span className={clsx(styles.marker, styles.mid)}>50%</span>
                <span className={clsx(styles.marker, styles.high)}>75%</span>
              </div>
            </div>

            <div className={styles.seatsBreakdown}>
              <div className={styles.seatsInfo}>
                <span className={styles.seatsUsed}>{usedSeats}</span>
                <span className={styles.seatsSeparator}>/</span>
                <span className={styles.seatsTotal}>{totalSeats}</span>
                <span className={styles.seatsLabel}>좌석</span>
              </div>
              <div className={styles.seatsVisual}>
                {tables.map((table) => (
                  <div 
                    key={table.id}
                    className={`seat-icon ${table.status === 'OCCUPIED' ? 'occupied' : 'available'}`}
                    title={`${table.table_name} (${table.capacity}석)`}
                  >
                    {table.status === 'OCCUPIED' ? '🔴' : '🟢'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.quickActionsRow}>
            <button className={clsx(styles.actionBtn, styles.layoutBtn)}>
              <span className={styles.actionIcon}>🗺️</span>
              <span className={styles.actionText}>배치도</span>
            </button>
            <button 
              className={clsx(styles.actionBtn, styles.refreshBtn)} 
              onClick={handleManualRefresh}
            >
              <span className={styles.actionIcon}>🔄</span>
              <span className={styles.actionText}>새로고침</span>
            </button>
            <button className={clsx(styles.actionBtn, styles.reserveBtn)}>
              <span className={styles.actionIcon}>📅</span>
              <span className={styles.actionText}>예약</span>
            </button>
          </div>

          <div className={styles.lastUpdateInfo}>
            마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  )
}
