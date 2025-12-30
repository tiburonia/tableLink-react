/**
 * 검색 페이지
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch, SearchHeader, SearchInitial, SearchResults } from '@/features/search'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './SearchPage.module.css'

export const SearchPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { query, setQuery, results, loading, error, performSearch } = useSearch(initialQuery)

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query.trim())
    }
  }

  const handleSuggestionClick = (suggestionQuery: string) => {
    setQuery(suggestionQuery)
    performSearch(suggestionQuery)
  }

  const handleStoreClick = (storeId: number) => {
    navigate(`/rs/${storeId}`)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleRetry = () => {
    performSearch(query)
  }

  const showInitialContent = !query.trim() && results.length === 0

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.searchPage}>
          <SearchHeader
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onBack={handleBack}
          />

          <div className={styles.searchContent}>
            {showInitialContent ? (
              <SearchInitial onSuggestionClick={handleSuggestionClick} />
            ) : (
              <SearchResults
                results={results}
                loading={loading}
                error={error}
                onStoreClick={handleStoreClick}
                onRetry={handleRetry}
              />
            )}
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
