import type { Store } from '@/entities/store'

export interface StoreFilterState {
  category: string
  sort: 'distance' | 'rating' | 'review'
}

export interface StoreListState {
  stores: Store[]
  filteredStores: Store[]
  searchQuery: string
  filters: StoreFilterState
  loading: boolean
  error: string | null
}

export interface StoreListActions {
  setSearchQuery: (query: string) => void
  setFilters: (filters: StoreFilterState) => void
  refreshStores: () => Promise<void>
}
