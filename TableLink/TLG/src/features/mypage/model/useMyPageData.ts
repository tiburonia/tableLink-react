/**
 * useMyPage - 마이페이지 데이터 로딩 Feature Hook
 * FSD: features/mypage/model
 * 
 * 유저 행동: "내 정보 조회/통계 확인"
 */

import { useState, useEffect, useCallback } from 'react'

interface UserInfo {
  userId: number
  name?: string
  username?: string
}

interface RegularSummary {
  topLevel: string
  topLevelName: string
  totalPoints: number
  totalCoupons: number
}

interface MyPageData {
  userInfo: {
    name: string
    username?: string
    email: string
    phone?: string
    level?: string
    points?: number
  }
  regularSummary: RegularSummary
  stats: {
    orderCount: number
    reviewCount: number
    favoriteCount: number
    couponCount: number
  }
}

const mypageService = {
  async loadMypageData(userId: number, userInfo?: UserInfo): Promise<MyPageData> {
    try {
      const response = await fetch(`/api/users/${userId}/mypage`)
      if (!response.ok) throw new Error('마이페이지 데이터 조회 실패')
      return await response.json()
    } catch (error) {
      console.error('마이페이지 데이터 로드 실패:', error)
      // 기본값 반환 (userInfo에서 이름 가져오기)
      return {
        userInfo: { 
          name: userInfo?.name || '', 
          username: userInfo?.username,
          email: '' 
        },
        regularSummary: {
          topLevel: 'bronze',
          topLevelName: '브론즈',
          totalPoints: 0,
          totalCoupons: 0
        },
        stats: { orderCount: 0, reviewCount: 0, favoriteCount: 0, couponCount: 0 }
      }
    }
  }
}

export function useMyPageData(userInfo?: UserInfo) {
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMyPageData = useCallback(async () => {
    if (!userInfo?.userId) {
      setError('사용자 정보가 없습니다')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const mypageData = await mypageService.loadMypageData(userInfo.userId, userInfo)
      setData(mypageData)
      setError(null)
    } catch (err) {
      console.error('❌ 마이페이지 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.userId, userInfo])

  useEffect(() => {
    loadMyPageData()
  }, [loadMyPageData])

  return { data, loading, error, refetch: loadMyPageData }
}

export type { MyPageData, UserInfo }
