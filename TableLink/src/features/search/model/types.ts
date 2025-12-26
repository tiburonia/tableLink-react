/**
 * 검색 관련 타입 정의
 */

export interface SearchStore {
  id: number
  name: string
  category: string
  address: string
  ratingAverage: number
  reviewCount: number
  isOpen: boolean
  coord: {
    lat: number
    lng: number
  } | null
}

export interface SearchResponse {
  success: boolean
  stores: SearchStore[]
  meta?: {
    query: string
    count: number
    timestamp: string
  }
}

export interface SearchState {
  query: string
  results: SearchStore[]
  loading: boolean
  error: string | null
}

export interface SuggestionTag {
  emoji: string
  text: string
  query: string
}

export interface PopularSearch {
  rank: number
  text: string
  query: string
}
