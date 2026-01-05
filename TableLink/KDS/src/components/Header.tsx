/**
 * KDS 헤더 컴포넌트
 */

import { useState, useEffect } from 'react';
import { useKDS } from '../context/KDSContext';

interface HeaderProps {
  onRefresh: () => void;
}

export function Header({ onRefresh }: HeaderProps) {
  const { state } = useKDS();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시간 업데이트 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleRefresh = () => {
    // 버튼 회전 애니메이션은 CSS에서 처리
    onRefresh();
  };

  return (
    <header className="kds-header">
      <div className="header-left">
        <div className="current-time">{timeString}</div>
        <div className="store-info">매장 {state.storeId}</div>
      </div>
      <div className="header-center">
        <h1 className="kds-title">
          <span className="title-icon">🍳</span>
          Kitchen Display System
        </h1>
      </div>
      <div className="header-right">
        <div className={`connection-status ${state.isConnected ? 'connected' : 'disconnected'}`}>
          {state.isConnected ? '연결됨' : '연결 안됨'}
        </div>
        <button className="refresh-btn" onClick={handleRefresh}>
          🔄
        </button>
      </div>
    </header>
  );
}

export default Header;
