/**
 * 검색 관련 상수
 */

import type { SuggestionTag, PopularSearch } from './types'

export const SUGGESTION_TAGS: SuggestionTag[] = [
  { emoji: '☕', text: '카페', query: '카페' },
  { emoji: '🍗', text: '치킨', query: '치킨' },
  { emoji: '🍕', text: '피자', query: '피자' },
  { emoji: '🍜', text: '분식', query: '분식' },
  { emoji: '🍚', text: '한식', query: '한식' },
  { emoji: '🥢', text: '중식', query: '중식' },
]

export const POPULAR_SEARCHES: PopularSearch[] = [
  { rank: 1, text: '맥도날드', query: '맥도날드' },
  { rank: 2, text: '스타벅스', query: '스타벅스' },
  { rank: 3, text: '버거킹', query: '버거킹' },
  { rank: 4, text: '롯데리아', query: '롯데리아' },
  { rank: 5, text: '서브웨이', query: '서브웨이' },
]

export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 1,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50,
} as const
