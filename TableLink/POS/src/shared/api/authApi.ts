/**
 * POS 인증 API - TLM 계정으로 로그인
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// =================== Types ===================

export interface LoginRequest {
  email: string
  password: string
}

export interface Member {
  id: string
  email: string
  name: string | null
  phone: string | null
  email_verified: boolean
  phone_verified: boolean
  last_login_at: string | null
}

export interface Store {
  id: number
  name: string
  is_open: boolean
  store_tel_number: string | number | null
  rating_average: number | null
  review_count: number
  full_address: string | null
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    member: Member
    accessToken: string
    refreshToken: string
  }
  error?: string
}

export interface MyStoresResponse {
  success: boolean
  stores?: Store[]
  count?: number
  error?: string
}

// =================== API Functions ===================

/**
 * TLM 로그인 API
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/merchants/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return response.json()
  } catch (error) {
    console.error('❌ 로그인 API 에러:', error)
    return {
      success: false,
      message: '서버 연결에 실패했습니다.',
      error: '서버 연결에 실패했습니다.',
    }
  }
}

/**
 * 내 매장 목록 조회
 */
export async function getMyStores(memberId: string): Promise<MyStoresResponse> {
  try {
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

    return {
      success: true,
      stores: result.stores,
      count: result.count,
    }
  } catch (error) {
    console.error('❌ 매장 목록 조회 에러:', error)
    return {
      success: false,
      error: '서버 연결에 실패했습니다.',
    }
  }
}

// =================== Storage Functions ===================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pos_accessToken',
  REFRESH_TOKEN: 'pos_refreshToken',
  MEMBER: 'pos_member',
  STORE: 'pos_store',
} as const

/**
 * 토큰 저장
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

/**
 * 회원 정보 저장
 */
export function saveMember(member: Member): void {
  localStorage.setItem(STORAGE_KEYS.MEMBER, JSON.stringify(member))
}

/**
 * 선택한 매장 저장
 */
export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(store))
}

/**
 * Access 토큰 가져오기
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * 회원 정보 가져오기
 */
export function getMember(): Member | null {
  const memberStr = localStorage.getItem(STORAGE_KEYS.MEMBER)
  if (!memberStr) return null
  try {
    return JSON.parse(memberStr)
  } catch {
    return null
  }
}

/**
 * 저장된 매장 정보 가져오기
 */
export function getStore(): Store | null {
  const storeStr = localStorage.getItem(STORAGE_KEYS.STORE)
  if (!storeStr) return null
  try {
    return JSON.parse(storeStr)
  } catch {
    return null
  }
}

/**
 * 로그아웃 (모든 인증 정보 삭제)
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.MEMBER)
  localStorage.removeItem(STORAGE_KEYS.STORE)
}

/**
 * 인증 여부 확인
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getMember()
}

/**
 * 매장이 선택되었는지 확인
 */
export function hasStore(): boolean {
  return !!getStore()
}
