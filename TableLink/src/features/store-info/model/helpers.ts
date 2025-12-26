/**
 * Store Info Helpers
 * FSD: features/store-info/model
 */

import type { AmenityConfig } from './types'

/**
 * 편의시설 설정 정보
 */
export const AMENITY_CONFIG: Record<string, AmenityConfig> = {
  wifi: { 
    icon: '🌐',
    name: '무선 인터넷'
  },
  parking: { 
    icon: '🅿️',
    name: '주차 이용 가능'
  },
  pet_friendly: { 
    icon: '🐾',
    name: '반려동물 동반 가능'
  },
  power_outlet: { 
    icon: '🔌',
    name: '콘센트 구비'
  },
  smoking_area: { 
    icon: '🚬',
    name: '흡연구역'
  }
}
