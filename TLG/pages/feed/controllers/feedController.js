
/**
 * 단골 소식 피드 Controller
 * 흐름 제어 및 이벤트 처리
 */

import { feedService } from '/TLG/pages/feed/services/feedService.js';
import { feedView } from '/TLG/pages/feed/views/feedView.js';

export const feedController = {
  currentTab: 'following',

  /**
   * 피드 페이지 초기화
   */
  async init(tab = 'following') {
    console.log('📰 단골 소식 피드 페이지 초기화 시작');

    try {
      // 사용자 정보 가져오기
      const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : window.userInfo;
      
      if (!userInfo || !userInfo.userId) {
        console.warn('⚠️ 로그인 필요');
        alert('로그인이 필요합니다.');
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        }
        return;
      }

      this.currentTab = tab;

      // 피드 데이터 로딩
      const result = await feedService.getFeedData(userInfo.userId, tab);

      if (!result.success) {
        throw new Error(result.error || '피드 데이터 로딩 실패');
      }

      // UI 렌더링
      const main = document.getElementById('main');
      if (!main) {
        throw new Error('main 엘리먼트를 찾을 수 없습니다.');
      }

      main.innerHTML = feedView.render(result, tab);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ 단골 소식 피드 페이지 초기화 완료');

    } catch (error) {
      console.error('❌ 단골 소식 피드 페이지 초기화 실패:', error);
      this.showError(error.message);
    }
  },

  /**
   * 탭 전환
   */
  async switchTab(tab) {
    console.log('🔄 피드 탭 전환:', tab);
    this.currentTab = tab;
    await this.init(tab);
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색 버튼
    const searchBtn = document.getElementById('searchFeedBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        console.log('🔍 피드 검색');
        alert('피드 검색 기능은 곧 구현됩니다!');
      });
    }

    // 필터 버튼
    const filterBtn = document.getElementById('filterFeedBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        console.log('🎛️ 피드 필터');
        alert('피드 필터 기능은 곧 구현됩니다!');
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
          <button onclick="renderRegularPage()" style="padding: 12px 24px; background: #FF8A00; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            단골매장으로 돌아가기
          </button>
        </div>
      `;
    }
  }
};

window.feedController = feedController;
console.log('✅ feedController 모듈 로드 완료');
