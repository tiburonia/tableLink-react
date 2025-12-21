/**
 * useMyPageData - 마이페이지 데이터 로딩
 */

import { useState, useEffect } from 'react'
import { mypageService } from '../mypageService'
import type { MyPageData } from '../types'

interface UserInfo {
  userId: number
  name?: string
  username?: string
}

export function useMyPageData(userInfo?: UserInfo) {
  const [data, setData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMyPageData = async () => {
    if (!userInfo?.userId) {
      setError('사용자 정보가 없습니다')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const mypageData = await mypageService.loadMypageData(userInfo.userId)
      setData(mypageData)
      setError(null)
    } catch (err) {
      console.error('❌ 마이페이지 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyPageData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo])

  return { data, loading, error, refetch: loadMyPageData }
}
