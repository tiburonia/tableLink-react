
import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Legacy JS 모듈을 마운트하는 Wrapper 컴포넌트
function LegacyModuleWrapper({ scriptPath, renderFn }) {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let script = null;

    // 기존 Vanilla JS 스크립트 동적 로드
    const loadScript = () => {
      console.log(`📦 Loading script: ${scriptPath}`);
      
      script = document.createElement('script');
      script.type = 'module';
      script.src = scriptPath;
      
      script.onload = () => {
        if (!mounted) return;
        
        console.log(`✅ Script loaded: ${scriptPath}`);
        
        // 전역 함수 호출
        setTimeout(() => {
          const renderFunc = window[renderFn];
          
          if (renderFunc && typeof renderFunc === 'function') {
            console.log(`✅ Calling window.${renderFn}()`);
            renderFunc();
            setIsLoaded(true);
          } else {
            console.error(`❌ window.${renderFn} not found`);
            setError(`Function ${renderFn} not available`);
          }
        }, 100);
      };
      
      script.onerror = () => {
        if (!mounted) return;
        console.error(`❌ Failed to load script: ${scriptPath}`);
        setError(`Failed to load ${scriptPath}`);
      };
      
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      mounted = false;
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [scriptPath, renderFn]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>❌ 로딩 오류</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <div id="main" ref={containerRef} />;
}

// 임시 로그인 페이지 (Phase 2에서 React로 전환 예정)
function LoginPage() {
  return (
    <LegacyModuleWrapper 
      scriptPath="/TLG/pages/auth/renderLogin.js" 
      renderFn="renderLogin" 
    />
  );
}

// 임시 메인 페이지 (Phase 3에서 React로 전환 예정)
function MainPage() {
  return (
    <LegacyModuleWrapper 
      scriptPath="/TLG/pages/main/renderMap.js" 
      renderFn="renderMap" 
    />
  );
}

function App() {
  return (
    <BrowserRouter basename="/react">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/map" element={<MainPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
