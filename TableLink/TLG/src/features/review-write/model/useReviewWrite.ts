/**
 * useReviewWrite - 리뷰 작성 Feature Hook
 * FSD: features/review-write/model
 * 
 * 유저 행동: "리뷰 작성/제출"
 * Legacy_TLG의 reviewWriteController, reviewService 참고
 */

import { useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'

interface SubmitReviewParams {
  orderId: number
  storeId: number
  rating: number
  content: string
}

interface ReviewSubmitResponse {
  success: boolean
  message: string
  review?: {
    id: number
    rating: number
    content: string
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// 리뷰 서비스
const reviewWriteService = {
  /**
   * 리뷰 데이터 유효성 검사
   */
  validateReviewData(rating: number, content: string): { valid: boolean; message: string } {
    if (rating < 1 || rating > 5) {
      return { valid: false, message: '별점을 선택해주세요 (1~5점)' }
    }

    if (!content || content.trim().length < 10) {
      return { valid: false, message: '리뷰는 최소 10자 이상 작성해주세요' }
    }

    if (content.length > 500) {
      return { valid: false, message: '리뷰는 500자 이내로 작성해주세요' }
    }

    return { valid: true, message: '' }
  },

  /**
   * 리뷰 작성 가능 여부 검증 API 호출
   */
  async checkReviewEligibility(orderId: number): Promise<{ canReview: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/reviews/check/${orderId}`)
      const data = await response.json()
      
      return {
        canReview: data.canReview ?? false,
        message: data.message || ''
      }
    } catch (error) {
      console.error('❌ 리뷰 작성 가능 여부 확인 실패:', error)
      return { canReview: false, message: '리뷰 작성 가능 여부를 확인할 수 없습니다' }
    }
  },

  /**
   * 리뷰 제출 API 호출
   */
  async submitReview(
    userId: number,
    orderId: number,
    storeId: number,
    rating: number,
    reviewText: string
  ): Promise<ReviewSubmitResponse> {
    try {
      const response = await fetch(`${API_BASE}/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          storeId,
          orderId,
          rating,
          reviewText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '리뷰 등록에 실패했습니다')
      }

      const data = await response.json()
      return {
        success: true,
        message: '리뷰가 등록되었습니다',
        review: data.review,
      }
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '리뷰 등록 중 오류가 발생했습니다',
      }
    }
  },
}

export function useReviewWrite() {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { user } = useAuthStore()

  // 제출 가능 여부 계산
  const canSubmit = useMemo(() => {
    const validation = reviewWriteService.validateReviewData(rating, content)
    return validation.valid && !isSubmitting
  }, [rating, content, isSubmitting])

  // 별점 설정
  const handleSetRating = useCallback((newRating: number) => {
    setRating(newRating)
    setError(null)
  }, [])

  // 내용 설정
  const handleSetContent = useCallback((newContent: string) => {
    setContent(newContent)
    setError(null)
  }, [])

  // 리뷰 제출
  const submitReview = useCallback(async ({
    orderId,
    storeId,
    rating: submitRating,
    content: submitContent,
  }: SubmitReviewParams): Promise<boolean> => {
    // 유효성 검사
    const validation = reviewWriteService.validateReviewData(submitRating, submitContent)
    if (!validation.valid) {
      setError(validation.message)
      return false
    }

    // 사용자 정보 확인
    if (!user?.user_pk) {
      setError('로그인이 필요합니다')
      return false
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 리뷰 작성 가능 여부 먼저 확인
      const eligibility = await reviewWriteService.checkReviewEligibility(orderId)
      if (!eligibility.canReview) {
        setError(eligibility.message || '이미 리뷰가 작성된 주문입니다')
        setIsSubmitting(false)
        return false
      }

      const result = await reviewWriteService.submitReview(
        user.user_pk,
        orderId,
        storeId,
        submitRating,
        submitContent
      )

      if (result.success) {
        setSuccess(true)
        return true
      } else {
        setError(result.message)
        return false
      }
    } catch {
      setError('리뷰 등록 중 오류가 발생했습니다')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [user?.user_pk])

  // 폼 초기화
  const resetForm = useCallback(() => {
    setRating(0)
    setContent('')
    setError(null)
    setSuccess(false)
  }, [])

  return {
    // 상태
    rating,
    content,
    isSubmitting,
    error,
    success,
    canSubmit,
    // 액션
    setRating: handleSetRating,
    setContent: handleSetContent,
    submitReview,
    resetForm,
  }
}
