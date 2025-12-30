import { mapController } from './controllers/mapController.js';

/**
 * 지도 페이지 진입점 (리팩토링된 버전)
 * 레이어드 아키텍처 적용: Repository → Service → Controller → View
 */
async function renderMap() {
  console.log('🗺️ 지도 페이지 진입 - 레이어드 아키텍처 버전');

  // 마이페이지 렌더링 작업 중단
  if (window.mypageController && window.mypageController.currentRenderingTask) {
    console.log('⏹️ 지도 렌더링으로 인한 마이페이지 작업 중단');
    window.mypageController.currentRenderingTask.cancelled = true;
  }

  try {
    // 컨트롤러를 통한 지도 초기화
    await mapController.initializeMap();

    console.log('✅ 지도 페이지 렌더링 완료');
  } catch (error) {
    console.error('❌ 지도 페이지 렌더링 실패:', error);

    // 폴백 에러 화면
    const main = document.getElementById('main');
    main.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>🚫 지도 로딩 실패</h2>
        <p>지도를 불러오는 중 오류가 발생했습니다.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    `;
  }
}

// 기존 호환성을 위한 전역 함수 등록
window.renderMap = renderMap;

// 모듈 기본 내보내기 (ES6 모듈 시스템)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderMap;
} else if (typeof window !== 'undefined') {
  window.renderMap = renderMap;
}

// ES6 export (모듈 지원 환경에서)
export default renderMap;

console.log('✅ 리팩토링된 renderMap 모듈 로드 완료 (호환성 향상)');