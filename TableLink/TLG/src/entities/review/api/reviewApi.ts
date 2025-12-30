/**
 * Review Entity API
 * 리뷰 관련 API 호출 함수들
 */

import type { Review, ReviewStats } from '../model'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const reviewApi = {
  /**
   * 매장 리뷰 목록 조회
   */
  async getStoreReviews(storeId: number, params?: {
    page?: number
    limit?: number
    sortBy?: 'latest' | 'rating' | 'likes'
  }): Promise<{ reviews: Review[]; total: number }> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString()
    const response = await fetch(
      `${API_BASE_URL}/reviews/stores/${storeId}${queryString ? `?${queryString}` : ''}`
    )
    if (!response.ok) throw new Error('Failed to fetch reviews')
    return response.json()
  },

  /**
   * 리뷰 상세 조회
   */
  async getReviewById(reviewId: number): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`)
    if (!response.ok) throw new Error('Failed to fetch review')
    return response.json()
  },

  /**
   * 리뷰 통계 조회
   */
  async getReviewStats(storeId: number): Promise<ReviewStats> {
    const response = await fetch(`${API_BASE_URL}/reviews/stores/${storeId}/stats`)
    if (!response.ok) throw new Error('Failed to fetch review stats')
    return response.json()
  },

  /**
   * 리뷰 작성
   */
  async createReview(reviewData: {
    storeId: number
    orderId?: number
    rating: number
    content: string
    images?: string[]
  }): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(reviewData),
    })
    if (!response.ok) throw new Error('Failed to create review')
    return response.json()
  },

  /**
   * 리뷰 수정
   */
  async updateReview(reviewId: number, data: Partial<Review>): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update review')
    return response.json()
  },

  /**
   * 리뷰 삭제
   */
  async deleteReview(reviewId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to delete review')
  },

  /**
   * 리뷰 좋아요 토글
   */
  async toggleLike(reviewId: number): Promise<{ isLiked: boolean; likes: number }> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to toggle like')
    return response.json()
  },
}
