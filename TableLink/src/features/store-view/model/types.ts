export type TabType = 'main' | 'menu' | 'review' | 'regular' | 'info'

export interface StoreViewState {
  activeTab: TabType
  selectedPhoto: string | null
  isFavorite: boolean
}

export interface StoreViewActions {
  switchTab: (tab: TabType) => void
  selectPhoto: (url: string | null) => void
  toggleFavorite: () => void
}
