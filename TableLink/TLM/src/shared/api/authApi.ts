import { API_BASE_URL } from '@/shared/config/api'

/**
 * TLM 인증 API 서비스
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name?: string
  phone?: string
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

export interface SignupResponse {
  success: boolean
  message: string
  data?: {
    id: string
    email: string
    name: string | null
    phone: string | null
    created_at: string
  }
  error?: string
}

export interface CheckEmailResponse {
  success: boolean
  available: boolean
  message: string
}

const MERCHANT_AUTH_URL = `${API_BASE_URL}/merchants/auth`

/**
 * 로그인 API
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${MERCHANT_AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * 회원가입 API
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${MERCHANT_AUTH_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * 이메일 중복 체크 API
 */
export async function checkEmail(email: string): Promise<CheckEmailResponse> {
  const response = await fetch(`${MERCHANT_AUTH_URL}/check-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  return response.json()
}

/**
 * 전화번호 중복 체크 API
 */
export async function checkPhone(phone: string): Promise<CheckEmailResponse> {
  const response = await fetch(`${MERCHANT_AUTH_URL}/check-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  })

  return response.json()
}

/**
 * 토큰 저장
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('tlm_accessToken', accessToken)
  localStorage.setItem('tlm_refreshToken', refreshToken)
}

/**
 * 회원 정보 저장
 */
export function saveMember(member: Member): void {
  localStorage.setItem('tlm_member', JSON.stringify(member))
}

/**
 * 토큰 가져오기
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('tlm_accessToken')
}

/**
 * 회원 정보 가져오기
 */
export function getMember(): Member | null {
  const memberStr = localStorage.getItem('tlm_member')
  if (!memberStr) return null
  try {
    return JSON.parse(memberStr)
  } catch {
    return null
  }
}

/**
 * 로그아웃 (토큰 및 회원 정보 삭제)
 */
export function logout(): void {
  localStorage.removeItem('tlm_accessToken')
  localStorage.removeItem('tlm_refreshToken')
  localStorage.removeItem('tlm_member')
}

/**
 * 인증 여부 확인
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getMember()
}
