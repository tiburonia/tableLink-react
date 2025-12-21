import { searchController } from './controllers/searchController.js';

/**
 * 검색 페이지 진입점 (레이어드 아키텍처 버전)
 * Repository → Service → Controller → View
 */
async function renderSearch(initialQuery = '') {
  console.log('🔍 검색 페이지 진입 - 레이어드 아키텍처 버전');

  try {
    await searchController.initialize(initialQuery);
    console.log('✅ 검색 페이지 렌더링 완료');
  } catch (error) {
    console.error('❌ 검색 페이지 렌더링 실패:', error);

    const main = document.getElementById('main');
    main.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>🚫 검색 로딩 실패</h2>
        <p>검색을 불러오는 중 오류가 발생했습니다.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    `;
  }
}

// 전역 함수로 등록
window.renderSearch = renderSearch;

// ES6 모듈 내보내기
export default renderSearch;