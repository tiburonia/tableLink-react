import { useState, useRef, useEffect, useCallback } from 'react'
import type { Store } from '../types'
import { FilterBar } from './FilterBar'
import { StoreCard } from './StoreCard'
import './StorePanel.css'

interface StorePanelProps {
  stores: Store[]
  onStoreSelect?: (store: Store) => void
}

export const StorePanel = ({ stores, onStoreSelect }: StorePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [height, setHeight] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  
  const panelRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  const MIN_HEIGHT = 120
  const MAX_HEIGHT = 630
  const MID_POINT = 300

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return

    const deltaY = clientY - startYRef.current
    let newHeight = startHeightRef.current - deltaY

    newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight))
    setHeight(newHeight)

    if (newHeight <= MIN_HEIGHT + 10) {
      setIsExpanded(false)
    } else if (newHeight >= MAX_HEIGHT - 10) {
      setIsExpanded(true)
    }
  }, [isDragging, MIN_HEIGHT, MAX_HEIGHT])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    document.body.style.userSelect = ''

    if (height < MID_POINT) {
      setHeight(MIN_HEIGHT)
      setIsExpanded(false)
    } else {
      setHeight(MAX_HEIGHT)
      setIsExpanded(true)
    }
  }, [isDragging, height, MID_POINT, MIN_HEIGHT, MAX_HEIGHT])

  const handleDragStart = (clientY: number) => {
    setIsDragging(true)
    startYRef.current = clientY
    startHeightRef.current = height
    document.body.style.userSelect = 'none'
  }

  // 마우스 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientY)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const handleMouseUp = () => handleDragEnd()

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // 터치 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleDragMove(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragEnd()
  }

  // 필터링된 매장 목록
  const filteredStores = stores.filter(store => {
    if (activeFilters.category && activeFilters.category !== 'all') {
      const storeCategory = store.category || '기타'
      if (storeCategory !== activeFilters.category) return false
    }

    if (activeFilters.rating && activeFilters.rating !== 'all') {
      const requiredRating = parseFloat(activeFilters.rating.replace('+', ''))
      const storeRating = store.rating || 0
      if (storeRating < requiredRating) return false
    }

    return true
  })

  return (
    <>
      <div 
        ref={panelRef}
        className={`store-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{ 
          height: `${height}px`,
          transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="panel-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />
        
        <FilterBar activeFilters={activeFilters} onFilterChange={setActiveFilters} />
        <div className="store-list-container">
          {filteredStores.length === 0 ? (
            <div className="empty-message">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">현재 영역에 매장이 없습니다</div>
              <div className="empty-subtitle">지도를 이동하거나 확대해보세요</div>
            </div>
          ) : (
            filteredStores.map(store => (
              <StoreCard 
                key={store.id} 
                store={store} 
                onClick={() => onStoreSelect?.(store)}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
