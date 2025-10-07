
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function MapPage() {
  const { isAuthenticated, loading } = useAuth();
  const mapContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    console.log('🗺️ MapPage 마운트됨, 지도 로딩 시작');

    // 중복 로드 방지
    if (scriptLoadedRef.current) {
      console.log('⚠️ 지도 스크립트 이미 로드됨, 재로드 생략');
      if (window.renderMap) {
        window.renderMap();
      }
      return;
    }

    // 기존 renderMap 모듈 동적 로드
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/legacy/TLG/pages/main/renderMap.js';
    script.onload = () => {
      console.log('✅ renderMap 스크립트 로드 완료');
      scriptLoadedRef.current = true;
      
      // renderMap 함수가 전역으로 export되었다면 호출
      if (window.renderMap) {
        window.renderMap();
      } else {
        console.error('❌ window.renderMap 함수를 찾을 수 없습니다');
      }
    };
    script.onerror = (err) => {
      console.error('❌ 지도 모듈 로드 실패:', err);
    };
    document.head.appendChild(script);

    return () => {
      // 클린업: 지도 컨트롤러 리셋
      if (window.mapController && typeof window.mapController.reset === 'function') {
        window.mapController.reset();
      }
    };
  }, [isAuthenticated, loading]);

  // 로딩 중
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  // 미인증 시 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    console.log('🚫 MapPage: 인증되지 않음, /login으로 리다이렉트');
    return <Navigate to="/login" replace />;
  }

  return <div id="main" ref={mapContainerRef} />;
}
