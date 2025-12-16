import { useState } from 'react'

export type TabType = 'info' | 'menu' | 'review'

export const useStoreTabs = (initialTab: TabType = 'info') => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const switchTab = (tab: TabType) => {
    setActiveTab(tab)
    // 탭 전환 시 스크롤을 탭 영역으로 이동
    const tabNav = document.getElementById('storeTabNav')
    if (tabNav) {
      tabNav.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return {
    activeTab,
    switchTab
  }
}
