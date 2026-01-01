const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// 메뉴 아이템
export interface MenuItem {
  id: number
  store_id: number
  name: string
  description: string
  cook_station: string
  price: number
}

// 테이블 정보
export interface TableInfo {
  id: number
  store_id: number
  table_name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED'
}

// 리뷰 정보
export interface ReviewInfo {
  id: number
  order_id: number
  store_id: number
  score: number
  content: string
  images: string[]
  status: string
  created_at: string
  updated_at: string
  userId: number
  user: string
}

// 프로모션 (단골 등급)
export interface PromotionInfo {
  id: number
  store_id: number
  level: string
  min_orders: number
  min_spent: number
}

// 편의시설
export interface Amenities {
  wifi: boolean
  parking: boolean
  pet_friendly: boolean
  power_outlet: boolean
  smoking_area: boolean
}

// 테이블 상태 요약
export interface TableStatusSummary {
  available: number
  occupied: number
  total: number
}

// 전체 매장 정보
export interface StoreInfo {
  id: number
  name: string
  is_open: boolean
  store_tel_number: number | string
  rating_average: number
  review_count: number
  sido: string
  sigungu: string
  eupmyeondong: string
  full_address: string
  lng: number
  lat: number
  menu: MenuItem[]
  tables: TableInfo[]
  reviews: ReviewInfo[]
  promotions: PromotionInfo[]
  amenities: Amenities
  menuCount: number
  tableCount: number
  reviewCount: number
  promotionCount: number
  tableStatusSummary: TableStatusSummary
}

export interface StoreApiResponse {
  success: boolean
  store?: StoreInfo
  error?: string
}

/**
 * 특정 매장 정보 조회
 */
export async function getStoreById(storeId: number): Promise<StoreApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '매장 정보를 불러오는데 실패했습니다.',
      }
    }

    return {
      success: data.success,
      store: data.store,
    }
  } catch (error) {
    console.error('Store API Error:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}

/**
 * 더미 데이터로 매장 정보 반환 (API 실패 시 fallback)
 */
export function getDummyStore(storeId: number = 2): StoreInfo {
  return {
    id: storeId,
    name: '신선한 레스토랑',
    is_open: true,
    store_tel_number: 19350112,
    rating_average: 4.5,
    review_count: 2,
    sido: '서울특별시',
    sigungu: '도봉구',
    eupmyeondong: '도봉동',
    full_address: '서울특별시 도봉구 도봉동',
    lng: 127.0303456265748,
    lat: 37.669548084264854,
    menu: [
      { id: 1, store_id: storeId, name: '스테이크', description: '육즙 가득한 스테이크', cook_station: 'KITCHEN', price: 25000 },
      { id: 2, store_id: storeId, name: '파스타', description: '크림 파스타', cook_station: 'KITCHEN', price: 14000 },
      { id: 3, store_id: storeId, name: '피자', description: '치즈 피자', cook_station: 'KITCHEN', price: 18000 },
      { id: 4, store_id: storeId, name: '리조또', description: '버섯 리조또', cook_station: 'KITCHEN', price: 16000 },
      { id: 5, store_id: storeId, name: '샐러드', description: '신선한 샐러드', cook_station: 'KITCHEN', price: 12000 },
    ],
    tables: [
      { id: 1, store_id: storeId, table_name: '테이블 1', capacity: 5, status: 'AVAILABLE' },
      { id: 2, store_id: storeId, table_name: '테이블 2', capacity: 6, status: 'AVAILABLE' },
      { id: 3, store_id: storeId, table_name: '테이블 3', capacity: 2, status: 'AVAILABLE' },
      { id: 4, store_id: storeId, table_name: '테이블 4', capacity: 6, status: 'AVAILABLE' },
      { id: 5, store_id: storeId, table_name: '테이블 5', capacity: 5, status: 'AVAILABLE' },
    ],
    reviews: [
      {
        id: 6,
        order_id: 10003,
        store_id: storeId,
        score: 3,
        content: '메뉴가 다양하고 맛도 좋았어요.',
        images: ['https://picsum.photos/400/300?random=5'],
        status: 'VISIBLE',
        created_at: '2025-12-13T05:11:10.209Z',
        updated_at: '2025-11-10T05:11:10.209Z',
        userId: 1,
        user: '익명',
      },
      {
        id: 3,
        order_id: 10000,
        store_id: storeId,
        score: 3,
        content: '가성비가 훌륭한 맛집입니다.',
        images: [],
        status: 'VISIBLE',
        created_at: '2025-12-11T05:11:10.191Z',
        updated_at: '2025-12-07T05:11:10.191Z',
        userId: 10,
        user: '익명',
      },
    ],
    promotions: [
      { id: 2009, store_id: storeId, level: '브론즈', min_orders: 0, min_spent: 0 },
      { id: 2018, store_id: storeId, level: '실버', min_orders: 5, min_spent: 50000 },
      { id: 2019, store_id: storeId, level: '골드', min_orders: 15, min_spent: 150000 },
      { id: 2020, store_id: storeId, level: '플래티넘', min_orders: 30, min_spent: 300000 },
    ],
    amenities: {
      wifi: false,
      parking: false,
      pet_friendly: false,
      power_outlet: false,
      smoking_area: false,
    },
    menuCount: 5,
    tableCount: 5,
    reviewCount: 2,
    promotionCount: 4,
    tableStatusSummary: {
      available: 5,
      occupied: 0,
      total: 5,
    },
  }
}

// ==================== TLM 매장 등록 API ====================

// 메뉴 입력 데이터
export interface MenuItemInput {
  name: string
  description?: string
  price: number
  cook_station?: string
}

// 테이블 입력 데이터
export interface TableInput {
  table_name: string
  capacity: number
}

// 영업시간 입력 데이터
export interface HourInput {
  day_of_week: number // 0: 일요일 ~ 6: 토요일
  open_time: string   // HH:mm 형식
  close_time: string  // HH:mm 형식
  is_closed: boolean
  is_24hours: boolean
}

// 매장 등록 요청 데이터
export interface CreateStoreRequest {
  memberId: string
  name: string
  category: string
  store_tel_number: string
  sido: string
  sigungu: string
  eupmyeondong: string
  road_address: string
  detail_address?: string
  latitude?: number | null
  longitude?: number | null
  amenities?: Amenities
  // 필수 항목
  menuItems: MenuItemInput[]
  tables: TableInput[]
  hours: HourInput[]
}

// 매장 등록 응답 데이터
export interface CreateStoreResponse {
  success: boolean
  message?: string
  data?: {
    store: {
      id: number
      name: string
      is_open: boolean
      created_at: string
    }
    info: unknown
    address: unknown
    amenities: unknown
    member: unknown
    regularLevels: unknown[]
    menus: unknown[]
    tables: unknown[]
    hours: unknown[]
  }
  error?: string
}

// 내 매장 목록 응답
export interface MyStoresResponse {
  success: boolean
  stores?: Array<{
    id: number
    name: string
    is_open: boolean
    created_at: string
    category: string
    store_tel_number: string
    road_address: string
    sido: string
    sigungu: string
    role: string
    status: string
  }>
  count?: number
  error?: string
}

/**
 * 매장 등록 (TLM)
 * POST /api/merchants/stores
 */
export async function createStore(data: CreateStoreRequest): Promise<CreateStoreResponse> {
  try {
    console.log('🏪 [TLM] 매장 등록 요청:', data.name)
    
    const response = await fetch(`${API_BASE_URL}/merchants/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '매장 등록에 실패했습니다.',
      }
    }

    console.log('✅ [TLM] 매장 등록 성공:', result.data?.store?.id)
    return {
      success: true,
      message: result.message,
      data: result.data,
    }
  } catch (error) {
    console.error('❌ [TLM] 매장 등록 에러:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}

/**
 * 내 매장 목록 조회 (TLM)
 * GET /api/merchants/stores?memberId=xxx
 */
export async function getMyStores(memberId: string): Promise<MyStoresResponse> {
  try {
    console.log('📋 [TLM] 내 매장 목록 조회:', memberId)
    
    const response = await fetch(`${API_BASE_URL}/merchants/stores?memberId=${memberId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '매장 목록 조회에 실패했습니다.',
      }
    }

    console.log('✅ [TLM] 매장 목록 조회 성공:', result.count, '개')
    return {
      success: true,
      stores: result.stores,
      count: result.count,
    }
  } catch (error) {
    console.error('❌ [TLM] 매장 목록 조회 에러:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}

/**
 * 메뉴 추가 (TLM)
 * POST /api/merchants/stores/:storeId/menu
 */
export async function addMenuItem(
  storeId: number,
  menuItem: { name: string; description?: string; price: number; cook_station?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/merchants/stores/${storeId}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(menuItem),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '메뉴 추가에 실패했습니다.',
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('메뉴 추가 에러:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}

/**
 * 메뉴 일괄 추가 (TLM)
 * POST /api/merchants/stores/:storeId/menu/bulk
 */
export async function addMenuItems(
  storeId: number,
  menuItems: Array<{ name: string; description?: string; price: number; cook_station?: string }>
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/merchants/stores/${storeId}/menu/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ menuItems }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '메뉴 일괄 추가에 실패했습니다.',
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('메뉴 일괄 추가 에러:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}
