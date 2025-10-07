
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MapPage() {
  const { isAuthenticated } = useAuth();
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 기존 renderMap 모듈 동적 로드 (런타임에 script로 로드)
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/legacy/TLG/pages/main/renderMap.js';
    script.onload = () => {
      // renderMap 함수가 전역으로 export되었다면 호출
      if (window.renderMap) {
        window.renderMap();
      }
    };
    script.onerror = (err) => {
      console.error('지도 모듈 로드 실패:', err);
    };
    document.head.appendChild(script);

    return () => {
      // 클린업: 스크립트 제거
      document.head.removeChild(script);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div id="main" ref={mapContainerRef} />;
}
