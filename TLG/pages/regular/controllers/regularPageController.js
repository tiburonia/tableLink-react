
/**
 * 단골매장 페이지 Controller
 * 흐름 제어 및 이벤트 처리
 */

import { regularPageService } from '/TLG/pages/regular/services/regularPageService.js';
import { regularPageView } from '/TLG/pages/regular/views/regularPageView.js';

export const regularPageController = {
  /**
   * 페이지 초기화
   */
  async init() {
    console.log('🏪 단골매장 페이지 초기화 시작');

    try {
      // 사용자 정보 가져오기
      const userInfo = window.cacheManager?.getUserInfo();
      if (!userInfo) {
        console.warn('⚠️ 로그인 필요');
        alert('로그인이 필요합니다.');
        return;
      }

      // 데이터 로딩
      const result = await regularPageService.getRegularStoresData(userInfo.id);

      if (!result.success) {
        throw new Error(result.error || '데이터 로딩 실패');
      }

      // UI 렌더링
      const main = document.getElementById('main');
      if (!main) {
        throw new Error('main 엘리먼트를 찾을 수 없습니다.');
      }

      main.innerHTML = regularPageView.render(result);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ 단골매장 페이지 초기화 완료');

    } catch (error) {
      console.error('❌ 단골매장 페이지 초기화 실패:', error);
      this.showError(error.message);
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 정렬 버튼
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        console.log('정렬 버튼 클릭');
        alert('정렬 기능은 곧 구현됩니다!');
      });
    }

    // 검색 버튼
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        console.log('검색 버튼 클릭');
        if (typeof renderSearch === 'function') {
          renderSearch('');
        }
      });
    }
  },

  /**
   * 에러 표시
   */
  showError(message) {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">😢</div>
          <h2 style="color: #1f2937; margin: 0 0 8px 0;">오류가 발생했습니다</h2>
          <p style="color: #9ca3af; margin: 0 0 24px 0;">${message}</p>
          <button onclick="renderSubMain()" style="padding: 12px 24px; background: #FF8A00; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            홈으로 돌아가기
          </button>
        </div>
      `;
    }
  }
};

window.regularPageController = regularPageController;
console.log('✅ regularPageController 모듈 로드 완료');
