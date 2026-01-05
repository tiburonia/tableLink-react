/**
 * KDS 탭 바 컴포넌트
 */

import type { TabType } from '../types';
import { useKDS } from '../context/KDSContext';

interface TabBarProps {
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ onTabChange }: TabBarProps) {
  const { state, getActiveTickets, getCompletedTickets } = useKDS();

  const activeCount = getActiveTickets().length;
  const completedCount = getCompletedTickets().length;

  return (
    <div className="kds-tabs">
      <button
        className={`tab-btn ${state.currentTab === 'active' ? 'active' : ''}`}
        data-tab="active"
        onClick={() => onTabChange('active')}
      >
        <span className="tab-icon">🔥</span>
        <span className="tab-text">진행중 주문</span>
        <span className="tab-count">{activeCount}</span>
      </button>
      <button
        className={`tab-btn ${state.currentTab === 'completed' ? 'active' : ''}`}
        data-tab="completed"
        onClick={() => onTabChange('completed')}
      >
        <span className="tab-icon">✅</span>
        <span className="tab-text">완료된 주문</span>
        <span className="tab-count">{completedCount}</span>
      </button>
    </div>
  );
}

export default TabBar;
