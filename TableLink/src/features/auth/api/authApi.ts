/**
 * Auth Feature - 인증/로그인 기능
 */

import type { User } from '@/entities/user'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const authApi = {
  /**
   * 로그인
   */
  async login(credentials: { username: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }
    return response.json()
  },

  /**
   * 회원가입
   */
  async register(userData: {
    username: string
    password: string
    email: string
    phone?: string
  }): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }
    return response.json()
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Logout failed')
  },

  /**
   * 토큰 갱신
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Token refresh failed')
    return response.json()
  },

  /**
   * 비밀번호 재설정 요청
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) throw new Error('Password reset request failed')
    return response.json()
  },
}
