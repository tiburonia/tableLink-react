/**
 * Review Utilities
 * FSD: features/store-review/model
 */

/**
 * 날짜를 상대적 시간 텍스트로 변환
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '오늘'
  if (diffDays === 2) return '어제'
  if (diffDays <= 7) return `${diffDays}일 전`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)}개월 전`
  return `${Math.floor(diffDays / 365)}년 전`
}

/**
 * 사용자 표시 이름 가져오기
 */
export const getUserDisplayName = (userId: number, userName?: string, user?: string): string => {
  return user || userName || `사용자${userId}`
}

/**
 * 사용자 아바타 표시 텍스트 가져오기
 */
export const getUserAvatarText = (user?: string): string => {
  return user?.charAt(0) || '👤'
}
