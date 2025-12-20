import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export type TabType = 'main' | 'menu' | 'review' |'regular' | 'info'

export const useStoreTabs = (initialTab: TabType = 'main') => {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // URL에서 tab 파라미터 읽기
  const defaultTab = (searchParams.get('tab') as TabType) || initialTab
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  // URL이 바뀌었을 때 상태 동기화
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['main', 'menu', 'review'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const switchTab = (tab: TabType) => {
    setActiveTab(tab)

    // main 탭일 때는 쿼리 파라미터 제거, 다른 탭은 추가
    if (tab === "main") {
      setSearchParams({}) // 모든 쿼리 파라미터 제거
    } else {
      setSearchParams({ tab }) // URL 업데이트
    }
    
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
