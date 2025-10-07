
import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Legacy JS 모듈을 마운트하는 Wrapper 컴포넌트
function LegacyModuleWrapper({ modulePath, renderFn }) {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 기존 Vanilla JS 모듈 동적 로드
    const loadModule = async () => {
      try {
        console.log(`📦 Loading module: ${modulePath}`);
        
        // @TLG alias를 사용한 동적 import
        const mod = await import(/* @vite-ignore */ `@TLG/${modulePath}`);
        
        if (!mounted) return;

        // 기본 export 또는 named export 호출
        const renderFunc = mod.default || mod[renderFn];
        
        if (renderFunc && typeof renderFunc === 'function') {
          console.log(`✅ Calling ${renderFn}()`);
          renderFunc();
          setIsLoaded(true);
        } else {
          console.error(`❌ ${renderFn} function not found in ${modulePath}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load ${modulePath}:`, err);
      }
    };

    loadModule();

    return () => {
      mounted = false;
    };
  }, [modulePath, renderFn]);

  return <div id="main" ref={containerRef} />;
}

// 임시 로그인 페이지 (Phase 2에서 React로 전환 예정)
function LoginPage() {
  return (
    <LegacyModuleWrapper 
      modulePath="TLG/pages/auth/renderLogin.js" 
      renderFn="renderLogin" 
    />
  );
}

// 임시 메인 페이지 (Phase 3에서 React로 전환 예정)
function MainPage() {
  return (
    <LegacyModuleWrapper 
      modulePath="TLG/pages/main/renderMap.js" 
      renderFn="renderMap" 
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/map" element={<MainPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
