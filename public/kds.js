/**
 * KDS 메인 초기화 스크립트 v2.0
 * 책임: KDS 시스템 초기화 및 전역 함수 노출
 */

console.log('🚀 Simple KDS v2.0 시작');

// DOM 로드 완료 후 KDS 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('📟 KDS 페이지 DOM 로드 완료');

    // URL에서 매장 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId') || 1;

    console.log(`📟 KDS 매장 ID: ${storeId}`);

    // 모듈 로딩 확인
    if (!window.KDSUIRenderer || !window.SimpleKDS) {
      console.error('❌ KDS 모듈이 로드되지 않았습니다');
      return;
    }

    // Simple KDS 시스템 초기화
    window.SimpleKDS.init(storeId);

  } catch (error) {
    console.error('❌ KDS 초기화 실패:', error);

    // 에러 화면 표시
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div class="kds-error">
          <div class="error-icon">⚠️</div>
          <h2>KDS 시스템 오류</h2>
          <p>시스템을 초기화할 수 없습니다.</p>
          <p>오류: ${error.message}</p>
          <button onclick="location.reload()" class="btn-retry">다시 시도</button>
        </div>
      `;
    }
  }
});

console.log('✅ KDS 메인 스크립트 v2.0 로드 완료');