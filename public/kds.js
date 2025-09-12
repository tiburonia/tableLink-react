
/**
 * KDS 메인 초기화 스크립트 v3.0
 * 책임: KDS 시스템 부트스트랩, 전역 설정, 에러 처리
 */

console.log('🚀 TableLink KDS v3.0 시작');

// 전역 설정
window.KDS_CONFIG = {
  VERSION: '3.0',
  DEBUG: true,
  AUTO_REFRESH_INTERVAL: 30000, // 30초
  SOUND_ENABLED: true,
  NOTIFICATION_ENABLED: true
};

// 에러 핸들러
window.addEventListener('error', (event) => {
  console.error('❌ 전역 에러:', event.error);
  
  if (window.KDSUI && window.KDSUI.showToast) {
    window.KDSUI.showToast('시스템 오류가 발생했습니다', 'error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ 처리되지 않은 Promise 거부:', event.reason);
  
  if (window.KDSUI && window.KDSUI.showToast) {
    window.KDSUI.showToast('비동기 작업 중 오류가 발생했습니다', 'error');
  }
});

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📟 KDS 페이지 DOM 로드 완료');

    // URL에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId') || urlParams.get('store_id') || '1';

    console.log(`📟 KDS 매장 ID: ${storeId}`);

    // 필수 모듈 로딩 확인
    const requiredModules = [
      'KDSCore',
      'KDSUI', 
      'KDSController'
    ];

    for (const module of requiredModules) {
      if (!window[module]) {
        throw new Error(`필수 모듈이 로드되지 않았습니다: ${module}`);
      }
    }

    console.log('✅ 모든 필수 모듈 로드 확인 완료');

    // 기능 지원 확인
    checkBrowserSupport();

    // KDS 컨트롤러 초기화
    await window.KDSController.init(storeId);

    // 성공 메시지
    console.log('🎉 KDS v3.0 초기화 완료!');
    
    // 개발 모드에서 전역 객체 노출
    if (KDS_CONFIG.DEBUG) {
      window.KDS_DEBUG = {
        controller: window.KDSController,
        version: KDS_CONFIG.VERSION,
        config: KDS_CONFIG
      };
      console.log('🔧 디버그 모드: window.KDS_DEBUG 사용 가능');
    }

  } catch (error) {
    console.error('❌ KDS 초기화 실패:', error);
    showInitializationError(error);
  }
});

// 브라우저 지원 확인
function checkBrowserSupport() {
  const features = [
    'fetch',
    'EventSource', 
    'Map',
    'Set',
    'Promise',
    'requestAnimationFrame'
  ];

  const unsupportedFeatures = features.filter(feature => !window[feature]);
  
  if (unsupportedFeatures.length > 0) {
    console.warn('⚠️ 지원되지 않는 브라우저 기능:', unsupportedFeatures);
    
    if (unsupportedFeatures.includes('fetch') || unsupportedFeatures.includes('EventSource')) {
      throw new Error('이 브라우저는 KDS 시스템을 지원하지 않습니다. 최신 브라우저를 사용해주세요.');
    }
  }

  console.log('✅ 브라우저 호환성 확인 완료');
}

// 초기화 에러 처리
function showInitializationError(error) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div style="font-size: 4rem; margin-bottom: 2rem;">⚠️</div>
      <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">
        KDS 시스템 초기화 실패
      </h1>
      <p style="font-size: 1.1rem; margin-bottom: 2rem; color: #cbd5e1; max-width: 600px;">
        ${error.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      <div style="display: flex; gap: 1rem;">
        <button onclick="location.reload()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
        ">
          🔄 새로고침
        </button>
        <button onclick="window.history.back()" style="
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
        ">
          ← 뒤로가기
        </button>
      </div>
      
      ${KDS_CONFIG.DEBUG ? `
        <details style="margin-top: 2rem; text-align: left; max-width: 800px;">
          <summary style="cursor: pointer; color: #94a3b8;">🔧 상세 에러 정보</summary>
          <pre style="
            background: #1e293b;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow: auto;
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #e2e8f0;
          ">${error.stack || error.message}</pre>
        </details>
      ` : ''}
    </div>
  `;
}

// 전역 유틸리티 함수
window.KDS_UTILS = {
  // 매장 ID 조회
  getStoreId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('storeId') || urlParams.get('store_id') || '1';
  },

  // 디버그 정보 출력
  debugInfo() {
    if (!KDS_CONFIG.DEBUG) {
      console.log('디버그 모드가 비활성화되어 있습니다.');
      return;
    }

    const controller = window.KDSController;
    if (!controller) {
      console.log('KDS Controller가 초기화되지 않았습니다.');
      return;
    }

    console.group('🔧 KDS 디버그 정보');
    console.log('버전:', KDS_CONFIG.VERSION);
    console.log('매장 ID:', controller.storeId);
    console.log('초기화 상태:', controller.isInitialized);
    console.log('컨트롤러 상태:', controller.getStatus());
    
    if (controller.core) {
      console.log('코어 요약:', controller.core.getSummary());
      console.log('연결 상태:', controller.core.getConnectionState());
      console.log('스테이션 수:', controller.core.stations.size);
      console.log('티켓 수:', controller.core.tickets.size);
    }
    
    console.groupEnd();
  },

  // 강제 새로고침
  forceRefresh() {
    if (window.KDSController && window.KDSController.isInitialized) {
      return window.KDSController.refresh();
    } else {
      location.reload();
    }
  },

  // 연결 상태 확인
  checkConnection() {
    if (!window.KDSController || !window.KDSController.core) {
      return 'not_initialized';
    }
    
    return window.KDSController.core.getConnectionState();
  },

  // 설정 변경
  updateConfig(key, value) {
    if (KDS_CONFIG.hasOwnProperty(key)) {
      KDS_CONFIG[key] = value;
      console.log(`⚙️ 설정 변경: ${key} = ${value}`);
    } else {
      console.warn(`⚠️ 알 수 없는 설정 키: ${key}`);
    }
  }
};

// 개발자 도구 콘솔에서 사용할 수 있는 단축 명령어
if (KDS_CONFIG.DEBUG) {
  window.kds = window.KDS_UTILS;
  console.log('🔧 개발 모드: window.kds 단축 명령어 사용 가능');
  console.log('   - kds.debugInfo() : 디버그 정보 출력');
  console.log('   - kds.forceRefresh() : 강제 새로고침');  
  console.log('   - kds.checkConnection() : 연결 상태 확인');
}

// 페이지 가시성 변경 처리 (탭 전환 등)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.KDSController) {
    console.log('📖 페이지가 다시 보여짐 - 데이터 새로고침');
    window.KDSController.refresh();
  }
});

// 키보드 단축키 (전역)
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D : 디버그 정보 출력
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    window.KDS_UTILS.debugInfo();
  }
  
  // Ctrl+Shift+R : 강제 새로고침
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    window.KDS_UTILS.forceRefresh();
  }
});

console.log('✅ KDS v3.0 메인 스크립트 로드 완료');
