import { useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  title: string
  icon: string
  options: FilterOption[]
}

interface FilterBottomSheetProps {
  filterType: string
  activeValue: string
  onSelect: (filterType: string, value: string) => void
  onClose: () => void
}

const FILTER_CONFIGS: Record<string, FilterConfig> = {
  category: {
    title: '카테고리',
    icon: '🍽️',
    options: [
      { value: 'all', label: '전체' },
      { value: '한식', label: '한식' },
      { value: '중식', label: '중식' },
      { value: '일식', label: '일식' },
      { value: '양식', label: '양식' },
      { value: '카페', label: '카페' },
      { value: '치킨', label: '치킨' },
      { value: '기타', label: '기타' }
    ]
  },
  rating: {
    title: '별점',
    icon: '⭐',
    options: [
      { value: 'all', label: '전체' },
      { value: '4+', label: '4점 이상' },
      { value: '3+', label: '3점 이상' },
      { value: '2+', label: '2점 이상' }
    ]
  }
}

export const FilterBottomSheet = ({ filterType, activeValue, onSelect, onClose }: FilterBottomSheetProps) => {
  const config = FILTER_CONFIGS[filterType]

  useEffect(() => {
    // ESC 키로 닫기
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!config) return null

  return (
    <>
      <div className="sheet-dim active" onClick={onClose} />
      <div className="bottom-sheet active">
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-content">
          <div className="bottom-sheet-header">
            <span className="bottom-sheet-icon">{config.icon}</span>
            <h3 className="bottom-sheet-title">{config.title}</h3>
          </div>
          <div className="bottom-sheet-options">
            {config.options.map(option => (
              <button
                key={option.value}
                className={`sheet-option-btn ${activeValue === option.value ? 'active' : ''}`}
                onClick={() => onSelect(filterType, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
