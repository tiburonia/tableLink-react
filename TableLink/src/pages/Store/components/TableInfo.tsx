import { useState, useEffect } from 'react'
import './TableInfo.css'

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
      <div className="tlr-container premium-table-card">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>테이블 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tlr-container premium-table-card">
      <div className="card-gradient-bg"></div>

      <div className="tlr-header-new">
        <div className="status-indicator-wrapper">
          <div className={`status-pulse ${isOpen ? 'active' : 'inactive'}`}></div>
          <div className="tlr-title-section">
            <h3 className="tlr-main-title">테이블 현황</h3>
            <div className={`tlr-status-badge ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? '실시간 업데이트 중' : '운영중지'}
            </div>
          </div>
        </div>
        <div className="refresh-indicator" onClick={handleManualRefresh}>
          <span className="refresh-icon">🔄</span>
        </div>
      </div>

      <div className="table-visual-summary">
        <div className="visual-stats-row">
          <div className="visual-stat-item occupied">
            <div className="visual-icon">🔴</div>
            <div className="visual-data">
              <span className="visual-number">{occupiedCount}</span>
              <span className="visual-label">사용중</span>
            </div>
          </div>
          <div className="visual-stat-item available">
            <div className="visual-icon">🟢</div>
            <div className="visual-data">
              <span className="visual-number">{availableCount}</span>
              <span className="visual-label">이용가능</span>
            </div>
          </div>
          <div className="visual-stat-item total">
            <div className="visual-icon">⚪</div>
            <div className="visual-data">
              <span className="visual-number">{totalCount}</span>
              <span className="visual-label">전체</span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-detail-toggle-section">
        <button 
          className="table-detail-toggle-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="toggle-text">테이블 현황 자세히 보기</span>
          <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {isExpanded && (
        <div className="table-detail-content">
          <div className="occupancy-visualization">
            <div className="occupancy-header">
              <span className="occupancy-title">좌석 사용률</span>
              <div className="occupancy-percentage-wrapper">
                <span className="occupancy-percentage">{occupancyRate}%</span>
                <div className="percentage-trend">
                  <span className="trend-icon">📈</span>
                </div>
              </div>
            </div>

            <div className="occupancy-progress-container">
              <div className="occupancy-track">
                <div 
                  className="occupancy-fill" 
                  style={{ width: `${occupancyRate}%` }}
                ></div>
                <div 
                  className="occupancy-glow" 
                  style={{ left: `${occupancyRate}%` }}
                ></div>
              </div>
              <div className="occupancy-markers">
                <span className="marker low">25%</span>
                <span className="marker mid">50%</span>
                <span className="marker high">75%</span>
              </div>
            </div>

            <div className="seats-breakdown">
              <div className="seats-info">
                <span className="seats-used">{usedSeats}</span>
                <span className="seats-separator">/</span>
                <span className="seats-total">{totalSeats}</span>
                <span className="seats-label">좌석</span>
              </div>
              <div className="seats-visual">
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

          <div className="quick-actions-row">
            <button className="action-btn layout-btn">
              <span className="action-icon">🗺️</span>
              <span className="action-text">배치도</span>
            </button>
            <button 
              className="action-btn refresh-btn" 
              onClick={handleManualRefresh}
            >
              <span className="action-icon">🔄</span>
              <span className="action-text">새로고침</span>
            </button>
            <button className="action-btn reserve-btn">
              <span className="action-icon">📅</span>
              <span className="action-text">예약</span>
            </button>
          </div>

          <div className="last-update-info">
            마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  )
}
