// 지도 관련 상수

// 서울시청 좌표
export const SEOUL_CITY_HALL = {
  lat: 37.5663,
  lng: 126.9784,
} as const

// 검색 반경 (km)
export const SEARCH_RADIUS_KM = 20

// 지도 설정
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 17, // 초기 줌 레벨 (높을수록 확대)
  MAX_ZOOM: 21,     // 최대 줌 레벨
  MIN_ZOOM: 6,      // 최소 줌 레벨
  DETAIL_ZOOM: 19,  // 상세 보기 줌 레벨
} as const
