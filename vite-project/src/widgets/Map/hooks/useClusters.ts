import { useState, useEffect, useCallback, useRef } from 'react'
import type { NaverMapInstance, MapFeature, ClusterResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface UseClustersOptions {
  enabled?: boolean
}

/**
 * 지도 클러스터 데이터 가져오기 훅
 */
export const useClusters = (
  map: NaverMapInstance | null,
  options: UseClustersOptions = {}
) => {
  const { enabled = true } = options
  const [features, setFeatures] = useState<MapFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)

  const fetchClusters = useCallback(() => {
    if (!map || !enabled || isLoadingRef.current) return

    // 기존 타이머 취소
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // 디바운싱: 300ms 후 실행
    fetchTimeoutRef.current = setTimeout(async () => {
      if (isLoadingRef.current) return
      isLoadingRef.current = true

      try {
        setLoading(true)
        setError(null)

        // 현재 지도의 경계 가져오기
        const bounds = map.getBounds()
        const sw = bounds.getSW() // 남서쪽 좌표
        const ne = bounds.getNE() // 북동쪽 좌표

        // bbox 파라미터 생성 (xmin,ymin,xmax,ymax)
        const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`
        
        // 현재 줌 레벨
        const level = map.getZoom()

        console.log('🗺️ 클러스터 데이터 요청:', { level, bbox })

        const url = `${API_BASE_URL}/clusters?level=${level}&bbox=${bbox}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: ClusterResponse = await response.json()

        if (!data.success) {
          throw new Error(data.meta?.message || '데이터 조회 실패')
        }

        console.log('✅ 클러스터 데이터 수신:', {
          count: data.meta.count,
          type: data.type
        })

        setFeatures(data.features || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
        console.error('❌ 클러스터 데이터 조회 실패:', errorMessage)
        setError(errorMessage)
        setFeatures([])
      } finally {
        setLoading(false)
        isLoadingRef.current = false
      }
    }, 300)
  }, [map, enabled])

  // 지도 이동/줌 변경 시 데이터 갱신
  useEffect(() => {
    if (!map || !enabled) return

    // 초기 로딩
    fetchClusters()

    // 지도 이벤트 리스너
    const idleListener = naver.maps.Event.addListener(map, 'idle', () => {
      fetchClusters()
    })

    const zoomChangedListener = naver.maps.Event.addListener(map, 'zoom_changed', () => {
      fetchClusters()
    })

    return () => {
      naver.maps.Event.removeListener(idleListener)
      naver.maps.Event.removeListener(zoomChangedListener)
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [map, enabled, fetchClusters])

  return {
    features,
    loading,
    error,
    refetch: fetchClusters
  }
}
