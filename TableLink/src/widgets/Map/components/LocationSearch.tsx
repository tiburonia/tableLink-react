/**
 * 위치 검색 컴포넌트
 * - 현재 위치 가져오기
 * - Naver Map API를 이용한 주소/장소 검색
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import styles from './LocationSearch.module.css'

export interface Location {
  lat: number
  lng: number
  address: string
  name?: string
}

interface LocationSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (location: Location) => void
  currentLocation?: Location | null
}

interface SearchResult {
  title: string
  address: string
  roadAddress?: string
  lat: number
  lng: number
}

export const LocationSearch = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
}: LocationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 모달이 열리면 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 현재 위치 가져오기 (Geolocation API)
  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.')
      return
    }

    setIsGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // 좌표를 주소로 변환 (역지오코딩)
          const address = await reverseGeocode(latitude, longitude)
          
          onSelectLocation({
            lat: latitude,
            lng: longitude,
            address: address || '현재 위치',
            name: '현재 위치',
          })
          onClose()
        } catch (err) {
          console.error('역지오코딩 실패:', err)
          // 주소 변환 실패해도 좌표는 사용
          onSelectLocation({
            lat: latitude,
            lng: longitude,
            address: '현재 위치',
            name: '현재 위치',
          })
          onClose()
        } finally {
          setIsGettingLocation(false)
        }
      },
      (err) => {
        setIsGettingLocation(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('위치 정보를 가져올 수 없습니다.')
            break
          case err.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다.')
            break
          default:
            setError('위치를 가져오는 중 오류가 발생했습니다.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [onSelectLocation, onClose])

  // 역지오코딩 (좌표 -> 주소)
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    if (typeof naver === 'undefined' || !naver.maps?.Service) {
      console.warn('Naver Maps Service가 로드되지 않았습니다.')
      return null
    }

    return new Promise((resolve) => {
      naver.maps.Service.reverseGeocode(
        {
          coords: new naver.maps.LatLng(lat, lng),
          orders: [
            naver.maps.Service.OrderType.ADDR,
            naver.maps.Service.OrderType.ROAD_ADDR,
          ].join(','),
        },
        (status: naver.maps.Service.StatusType, response: naver.maps.Service.ReverseGeocodeResponse) => {
          if (status !== naver.maps.Service.Status.OK) {
            resolve(null)
            return
          }

          const result = response.v2?.address
          const roadAddress = result?.roadAddress
          const jibunAddress = result?.jibunAddress

          resolve(roadAddress || jibunAddress || null)
        }
      )
    })
  }

  // 주소/장소 검색 (지오코딩)
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    if (typeof naver === 'undefined' || !naver.maps?.Service) {
      setError('검색 서비스를 사용할 수 없습니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      naver.maps.Service.geocode(
        { query },
        (status: naver.maps.Service.StatusType, response: naver.maps.Service.GeocodeResponse) => {
          setIsLoading(false)
          
          if (status !== naver.maps.Service.Status.OK) {
            setSearchResults([])
            return
          }

          const items = response.v2?.addresses || []
          const results: SearchResult[] = items.map((item) => ({
            title: item.roadAddress || item.jibunAddress || query,
            address: item.jibunAddress || '',
            roadAddress: item.roadAddress || undefined,
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          }))

          setSearchResults(results)
        }
      )
    } catch (err) {
      setIsLoading(false)
      setError('검색 중 오류가 발생했습니다.')
      console.error('검색 오류:', err)
    }
  }, [])

  // 디바운스된 검색
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value)
    }, 300)
  }

  // 검색 결과 선택
  const handleSelectResult = (result: SearchResult) => {
    onSelectLocation({
      lat: result.lat,
      lng: result.lng,
      address: result.roadAddress || result.address,
      name: result.title,
    })
    onClose()
  }

  // 배경 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>위치 선택</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 현재 위치 버튼 */}
        <button 
          className={styles.currentLocationBtn}
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          <span className={styles.locationIcon}>
            {isGettingLocation ? (
              <div className={styles.spinner} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </span>
          <span className={styles.locationText}>
            {isGettingLocation ? '위치 확인 중...' : '현재 위치 사용'}
          </span>
        </button>

        {/* 검색 입력 */}
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="주소 또는 장소 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              className={styles.clearBtn}
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 검색 결과 */}
        <div className={styles.results}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>검색 중...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <ul className={styles.resultList}>
              {searchResults.map((result, index) => (
                <li 
                  key={index}
                  className={styles.resultItem}
                  onClick={() => handleSelectResult(result)}
                >
                  <div className={styles.resultIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
                      <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                  </div>
                  <div className={styles.resultContent}>
                    <div className={styles.resultTitle}>{result.title}</div>
                    {result.roadAddress && result.address !== result.roadAddress && (
                      <div className={styles.resultAddress}>{result.address}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery && !isLoading ? (
            <div className={styles.noResults}>
              <span>🔍</span>
              <span>검색 결과가 없습니다</span>
            </div>
          ) : (
            <div className={styles.hint}>
              <span>💡</span>
              <span>도로명 주소, 지번 주소, 장소명으로 검색해보세요</span>
            </div>
          )}
        </div>

        {/* 현재 선택된 위치 표시 */}
        {currentLocation && (
          <div className={styles.currentSelected}>
            <span className={styles.selectedLabel}>현재 선택:</span>
            <span className={styles.selectedAddress}>{currentLocation.address}</span>
          </div>
        )}
      </div>
    </div>
  )
}
