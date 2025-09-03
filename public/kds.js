/**
 * KDS 메인 초기화 스크립트
 * 책임: KDS 시스템 초기화 및 전역 함수 노출
 */

console.log('🚀 TableLink KDS v3.0 시작');

let kdsApp = null;

// DOM 로드 완료 후 KDS 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📟 KDS 페이지 DOM 로드 완료');

    // URL에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = parseInt(urlParams.get('store_id')) || 1;

    console.log('📟 KDS 매장 ID:', storeId);

    // KDS 컨트롤러 초기화
    if (window.KDSController) {
      kdsApp = new KDSController(storeId);
      await kdsApp.init();
      console.log('✅ KDS 앱 초기화 완료');
    } else {
      throw new Error('KDSController를 로드할 수 없습니다');
    }

  } catch (error) {
    console.error('❌ KDS 앱 초기화 실패:', error);

    // 오류 메시지 표시
    const container = document.getElementById('kdsContainer') || document.body;
    container.innerHTML = `
      <div class="error-container">
        <h2>❌ KDS 시스템 오류</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()" class="retry-btn">다시 시도</button>
      </div>
    `;
  }
});

// 페이지 종료 시 정리
window.addEventListener('beforeunload', () => {
  if (kdsApp) {
    kdsApp.destroy();
  }
});

console.log('✅ KDS 메인 스크립트 로드 완료');