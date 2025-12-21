/**
 * User Entity API
 * 사용자 관련 API 호출 함수들
 */

import type { User, UserProfile, UserSettings } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const userApi = {
  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch current user')
    return response.json()
  },

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`)
    if (!response.ok) throw new Error('Failed to fetch user profile')
    return response.json()
  },

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update profile')
    return response.json()
  },

  /**
   * 사용자 설정 조회
   */
  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch settings')
    return response.json()
  },

  /**
   * 사용자 설정 업데이트
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    })
    if (!response.ok) throw new Error('Failed to update settings')
    return response.json()
  },
}
