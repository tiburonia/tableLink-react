/**
 * Table Utilities
 * FSD: features/store-table/model
 */

import type { Table, TableStats } from './types'

/**
 * 테이블 통계 계산
 */
export const calculateTableStats = (tables: Table[]): TableStats => {
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length
  const totalCount = tables.length
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0
  
  const usedSeats = tables
    .filter(t => t.status === 'OCCUPIED')
    .reduce((sum, t) => sum + t.capacity, 0)
  
  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)

  return {
    occupiedCount,
    availableCount,
    totalCount,
    occupancyRate,
    usedSeats,
    totalSeats
  }
}

/**
 * 순위에 따른 이모지 반환
 */
export const getRankEmoji = (index: number): string => {
  switch (index) {
    case 0: return '🥇'
    case 1: return '🥈'
    case 2: return '🥉'
    default: return '👤'
  }
}

/**
 * 레벨에 따른 색상 반환
 */
export const getLevelColor = (level: string): string => {
  switch (level) {
    case 'VIP': return '#ffd700'
    case 'GOLD': return '#ffa500'
    case 'SILVER': return '#c0c0c0'
    default: return '#cd7f32'
  }
}
