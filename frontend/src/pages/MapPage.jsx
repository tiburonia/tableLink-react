
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MapPage() {
  const { isAuthenticated } = useAuth();
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 기존 renderMap 모듈 동적 로드
    import('../../TLG/pages/main/renderMap.js')
      .then((module) => {
        if (module.renderMap) {
          module.renderMap();
        }
      })
      .catch((err) => {
        console.error('지도 모듈 로드 실패:', err);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div id="main" ref={mapContainerRef} />;
}
