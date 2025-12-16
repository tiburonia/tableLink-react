import { useState } from 'react'
import { FilterBottomSheet } from './FilterBottomSheet'

interface FilterBarProps {
  activeFilters: Record<string, string>
  onFilterChange: (filters: Record<string, string>) => void
}

export const FilterBar = ({ activeFilters, onFilterChange }: FilterBarProps) => {
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  const handleFilterSelect = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters }
    
    if (value === 'all') {
      delete newFilters[filterType]
    } else {
      newFilters[filterType] = value
    }
    
    onFilterChange(newFilters)
    setActiveSheet(null)
  }

  return (
    <>
      <div className="filter-bar">
        <button className="filter-btn" onClick={() => setActiveSheet('main')}>
          <span className="filter-btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g fill="currentColor">
                <rect x="3" y="5" width="18" height="2" rx="1"/>
                <rect x="3" y="11" width="18" height="2" rx="1"/>
                <rect x="3" y="17" width="18" height="2" rx="1"/>
                <circle cx="9" cy="6" r="3"/>
                <circle cx="15" cy="12" r="3"/>
                <circle cx="9" cy="18" r="3"/>
              </g>
            </svg>
          </span>
        </button>
        <button className="filter-btn" onClick={() => setActiveSheet('category')}>
          <span className="filter-btn-icon">🍽️</span>
          <span className="filter-btn-text">카테고리</span>
        </button>
        <button className="filter-btn" onClick={() => setActiveSheet('rating')}>
          <span className="filter-btn-icon">⭐</span>
          <span className="filter-btn-text">별점</span>
        </button>
      </div>

      {activeSheet && (
        <FilterBottomSheet
          filterType={activeSheet}
          activeValue={activeFilters[activeSheet] || 'all'}
          onSelect={handleFilterSelect}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </>
  )
}
