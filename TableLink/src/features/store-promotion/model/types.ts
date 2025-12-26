/**
 * Store Promotion Types
 * FSD: features/store-promotion/model
 */

export interface Promotion {
  id: number
  title: string
  description: string
  discount_rate?: number
  type: string
  is_active: boolean
}

export interface Coupon {
  id: string
  name: string
  description: string
  discountRate: string
  minOrderAmount: string
  maxDiscount?: string
  startDate: string
  endDate: string
}

export interface Discount {
  id: string
  name: string
  description: string
  discountRate: string
  tag: string
  conditions: string[]
  startDate: string
  endDate: string
}
