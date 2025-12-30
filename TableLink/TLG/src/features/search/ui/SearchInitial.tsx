/**
 * 검색 초기 화면 (추천 검색어, 인기 검색어)
 */

import { SUGGESTION_TAGS, POPULAR_SEARCHES } from '../model'
import styles from './SearchInitial.module.css'

interface SearchInitialProps {
  onSuggestionClick: (query: string) => void
}

export const SearchInitial = ({ onSuggestionClick }: SearchInitialProps) => {
  return (
    <div className={styles.initialContent}>
      <div className={styles.searchSection}>
        <h3 className={styles.sectionTitle}>추천 검색어</h3>
        <div className={styles.suggestionGrid}>
          {SUGGESTION_TAGS.map((tag) => (
            <button
              key={tag.query}
              className={styles.suggestionTag}
              onClick={() => onSuggestionClick(tag.query)}
            >
              <span className={styles.tagEmoji}>{tag.emoji}</span>
              <span className={styles.tagText}>{tag.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.searchSection}>
        <h3 className={styles.sectionTitle}>🔥 인기 검색어</h3>
        <div className={styles.popularList}>
          {POPULAR_SEARCHES.map((item) => (
            <button
              key={item.query}
              className={styles.popularItem}
              onClick={() => onSuggestionClick(item.query)}
            >
              <span className={styles.popularRank}>{item.rank}</span>
              <span className={styles.popularText}>{item.text}</span>
              <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
