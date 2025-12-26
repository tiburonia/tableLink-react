/**
 * Store Table Types
 * FSD: features/store-table/model
 */

export interface Table {
  id: number
  store_id: number
  table_name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

export interface TopUser {
  id: number
  name: string
  level: string
  visit_count: number
  total_spent: number
  avatar?: string
}

export interface TableStats {
  occupiedCount: number
  availableCount: number
  totalCount: number
  occupancyRate: number
  usedSeats: number
  totalSeats: number
}
