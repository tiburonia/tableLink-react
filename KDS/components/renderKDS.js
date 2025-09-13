/**
 * KDS (Kitchen Display System) 메인 엔트리 포인트
 * - 모듈 로딩 및 초기화
 * - 전역 함수 등록
 * - 에러 처리
 */

(function() {
  'use strict';

  console.log('🍳 KDS 시스템 메인 모듈 로드 시작');

  // =================== 모듈 로더 ===================
  const KDSModuleLoader = {
    modules: [
      { name: '상태 관리', path: '/KDS/modules/kdsState.js', global: 'KDSState' },
      { name: 'WebSocket', path: '/KDS/modules/kdsWebSocket.js', global: 'KDSWebSocket' },
      { name: 'API 서비스', path: '/KDS/modules/kdsAPI.js', global: 'KDSAPIService' },
      { name: '사운드 관리', path: '/KDS/modules/kdsSoundManager.js', global: 'KDSSoundManager' },
      { name: 'UI 렌더러', path: '/KDS/modules/kdsUIRenderer.js', global: 'KDSUIRenderer' },
      { name: '메인 관리자', path: '/KDS/modules/kdsManager.js', global: 'KDSManager' }
    ],

    /**
     * 모든 모듈 로드
     */
    async loadAllModules() {
      console.log('📦 KDS 모듈 로딩 시작...');

      for (const module of this.modules) {
        try {
          // 이미 로드된 모듈 체크
          if (window[module.global]) {
            console.log(`✅ ${module.name} 모듈 이미 로드됨`);
            continue;
          }

          console.log(`🔄 ${module.name} 모듈 로드 중...`);

          await this.loadModule(module);

          // 모듈이 제대로 로드되었는지 확인
          if (window[module.global]) {
            console.log(`✅ ${module.name} 모듈 로드 완료`);
          } else {
            throw new Error(`${module.name} 모듈이 전역 객체에 등록되지 않음`);
          }

        } catch (error) {
          console.error(`❌ ${module.name} 모듈 로드 실패:`, error);
          throw new Error(`KDS ${module.name} 모듈을 로드할 수 없습니다: ${error.message}`);
        }
      }

      console.log('✅ 모든 KDS 모듈 로드 완료');
    },

    /**
     * 개별 모듈 로드
     */
    async loadModule(module) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = module.path;
        script.async = false;

        script.onload = () => {
          // 모듈 로드 후 잠시 대기 (전역 객체 등록 시간 확보)
          setTimeout(() => resolve(), 50);
        };

        script.onerror = () => {
          reject(new Error(`스크립트 로드 실패: ${module.path}`));
        };

        document.head.appendChild(script);
      });
    }
  };

  // =================== 전역 KDS 함수 ===================
  window.renderKDS = async function(storeId) {
    console.log('🍳 KDS 렌더링 시작 - 매장:', storeId);

    try {
      if (!storeId) {
        throw new Error('매장 ID가 필요합니다');
      }

      // 로딩 화면 표시
      const main = document.getElementById('main') || document.body;
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f5f7fa;">
          <div style="font-size: 64px; margin-bottom: 20px; animation: spin 2s linear infinite;">🍳</div>
          <h2 style="color: #2c3e50; margin-bottom: 10px;">KDS 시스템 로드 중...</h2>
          <p style="color: #7f8c8d;">모듈을 불러오고 있습니다</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // 모듈 로드
      await KDSModuleLoader.loadAllModules();

      // KDS 시스템 초기화
      await window.KDSManager.initialize(storeId);

    } catch (error) {
      console.error('❌ KDS 렌더링 실패:', error);

      // 오류 화면 렌더링
      const main = document.getElementById('main') || document.body;
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; background: #f5f7fa;">
          <div style="font-size: 64px; margin-bottom: 20px;">🚨</div>
          <h1 style="color: #e74c3c; margin-bottom: 10px;">KDS 시스템 오류</h1>
          <p style="color: #7f8c8d; margin-bottom: 30px; max-width: 500px;">${error.message}</p>
          <button onclick="location.reload()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
            페이지 새로고침
          </button>
          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; max-width: 600px;">
            <small style="color: #856404;">
              <strong>문제 해결 방법:</strong><br>
              1. 페이지를 새로고침해보세요<br>
              2. 브라우저 캐시를 삭제해보세요<br>
              3. 네트워크 연결을 확인해보세요
            </small>
          </div>
        </div>
      `;
    }
  };

  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    if (window.KDSManager) {
      window.KDSManager.cleanup();
    }
  });

  console.log('✅ KDS 시스템 메인 모듈 로드 완료');
})();