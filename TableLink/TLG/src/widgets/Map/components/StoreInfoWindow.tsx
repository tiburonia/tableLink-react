import type { Store } from '../types'

/**
 * 값이 유효한지 확인 (null, undefined, 기본값 필터링)
 */
const isValidValue = (value: unknown, invalidDefaults: string[] = []): boolean => {
  if (value === null || value === undefined || value === '') return false
  return true
}

/**
 * 평점 표시 생성
 */
const createRatingDisplay = (rating?: number): string => {
  if (!isValidValue(rating)) return ''
  
  const stars = '★'.repeat(Math.floor(rating!))
  const emptyStars = '☆'.repeat(5 - Math.floor(rating!))
  
  return `
    <div class="store-rating-container">
      <span class="store-rating-stars">${stars}${emptyStars}</span>
      <span class="store-rating-value">${rating!.toFixed(1)}</span>
    </div>
  `
}

/**
 * 카테고리 배지 생성
 */
const createCategoryBadge = (category?: string): string => {
  if (!isValidValue(category, ['기타', '없음', '미정'])) return ''
  
  const categoryIcons: Record<string, string> = {
    '한식': '🍚',
    '중식': '🥟',
    '일식': '🍣',
    '양식': '🍝',
    '카페': '☕',
    '디저트': '🍰',
    '패스트푸드': '🍔',
    '치킨': '🍗',
    '피자': '🍕',
  }
  
  const icon = categoryIcons[category!] || '🍽️'
  
  return `<span class="store-category-badge">${icon} ${category}</span>`
}

/**
 * 매장 정보창 HTML 생성
 */
export const createStoreInfoWindowContent = (
  store: Store
): string => {

  const hasRating = isValidValue(store.rating)
  const hasCategory = isValidValue(store.category, ['기타', '없음', '미정'])
  const hasAddress = isValidValue(store.address, ['주소 정보 없음', '없음', '미정'])
  const hasPhone = isValidValue(store.phone)

  return `
    <div class="store-info-window">
      <div class="store-info-header">
        <div class="store-info-title">
          <h3 class="store-info-name">${store.name}</h3>
          ${hasCategory ? createCategoryBadge(store.category) : ''}
        </div>
        ${hasRating ? createRatingDisplay(store.rating) : ''}
      </div>
      
      <div class="store-info-content">
        ${hasAddress ? `
          <div class="store-info-item">
            <span class="info-icon">📍</span>
            <span class="info-text">${store.address}</span>
          </div>
        ` : ''}
        
        ${hasPhone ? `
          <div class="store-info-item">
            <span class="info-icon">📞</span>
            <a href="tel:${store.phone}" class="info-text info-link">${store.phone}</a>
          </div>
        ` : ''}
        
        ${!hasAddress && !hasPhone ? `
          <div class="store-info-empty">
            <span class="info-empty-icon">ℹ️</span>
            <span class="info-empty-text">상세 정보가 없습니다</span>
          </div>
        ` : ''}
      </div>
      
      <button class="store-select-btn" data-store-id="${store.id}">
        <span class="btn-icon">🏪</span>
        <span class="btn-text">매장 선택하기</span>
      </button>
    </div>
  `
}
