
/**
 * KDS 메인 초기화 스크립트
 * 책임: KDS 시스템 초기화 및 전역 함수 노출
 */

console.log('🚀 TableLink KDS v3.0 시작');

let kdsController = null;

// 모듈 로딩 확인 함수
function waitForModules() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기
    
    const checkModules = () => {
      attempts++;
      
      if (window.KDSDataManager && window.KDSUIRenderer && window.KDSController) {
        console.log('✅ 모든 KDS 모듈 로드 완료');
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('KDS 모듈 로딩 시간 초과'));
      } else {
        console.log(`🔄 KDS 모듈 로딩 중... (${attempts}/${maxAttempts})`);
        setTimeout(checkModules, 100);
      }
    };
    
    checkModules();
  });
}

// DOM 로드 완료 후 KDS 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📟 KDS 페이지 DOM 로드 완료');

    // 로딩 표시 업데이트
    const loadingElement = document.getElementById('loadingIndicator');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        KDS 모듈 로딩 중...
      `;
    }

    // 모듈들이 로드될 때까지 대기
    await waitForModules();

    // URL에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = parseInt(urlParams.get('store_id')) || 1;

    console.log('📟 KDS 매장 ID:', storeId);

    // 로딩 표시 업데이트
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        KDS 시스템 초기화 중...
      `;
    }

    // KDS 컨트롤러 초기화
    kdsController = new KDSController(storeId);
    window.kdsController = kdsController; // 전역 접근 가능하도록
    
    await kdsController.init();
    
    // 로딩 숨기고 메인 컨테이너 표시
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    const ticketsContainer = document.getElementById('ticketsContainer');
    if (ticketsContainer) {
      ticketsContainer.style.display = 'block';
    }
    
    console.log('✅ KDS 앱 초기화 완료');

  } catch (error) {
    console.error('❌ KDS 앱 초기화 실패:', error);

    // 오류 메시지 표시
    const container = document.getElementById('kdsMain') || document.body;
    container.innerHTML = `
      <div class="error-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 2rem;
        background: #f8f9fa;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        ">
          <h2 style="color: #dc3545; margin-bottom: 1rem;">❌ KDS 시스템 오류</h2>
          <p style="color: #6c757d; margin-bottom: 1.5rem;">${error.message}</p>
          <button onclick="location.reload()" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
          ">다시 시도</button>
          <div style="margin-top: 1rem; font-size: 0.9rem; color: #6c757d;">
            매장 ID: ${urlParams.get('store_id') || '1'}
          </div>
        </div>
      </div>
    `;
  }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (kdsController) {
    kdsController.destroy();
  }
});

console.log('✅ KDS 메인 스크립트 로드 완료');
