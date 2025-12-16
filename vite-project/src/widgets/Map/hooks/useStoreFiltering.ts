import { useEffect, useState } from 'react'
import type { Store } from '../types'
import { SEOUL_CITY_HALL, SEARCH_RADIUS_KM } from '../constants'
import { calculateDistance } from '../utils'

/**
 * 서울시청 근처 매장 필터링 훅
 */
export const useStoreFiltering = (stores: Store[]) => {
  const [filteredStores, setFilteredStores] = useState<Store[]>([])

  useEffect(() => {
    if (stores.length === 0) return

    console.log('🔍 매장 필터링 시작 - 전체 매장 수:', stores.length)

    const nearbyStores = stores.filter((store) => {
      const distance = calculateDistance(
        SEOUL_CITY_HALL.lat,
        SEOUL_CITY_HALL.lng,
        store.latitude,
        store.longitude
      )
      return distance <= SEARCH_RADIUS_KM
    })

    console.log(
      `✅ 서울시청 기준 ${SEARCH_RADIUS_KM}km 내 매장:`,
      nearbyStores.length,
      '개'
    )

    setFilteredStores(nearbyStores)
  }, [stores])

  return filteredStores
}
