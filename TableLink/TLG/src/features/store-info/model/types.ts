/**
 * Store Info Types
 * FSD: features/store-info/model
 */

export interface StoreAmenities {
  wifi?: boolean
  parking?: boolean
  pet_friendly?: boolean
  power_outlet?: boolean
  smoking_area?: boolean
}

export interface BusinessHour {
  day: string
  hours: string
}

export interface AmenityConfig {
  icon: string
  name: string
}

export interface StoreContactInfo {
  phone?: string | null
  address?: string | null
  isOpen?: boolean
}
