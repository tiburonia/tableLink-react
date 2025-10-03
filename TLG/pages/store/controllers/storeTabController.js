
/**
 * 매장 탭 컨트롤러 - 사용자 인터랙션 처리
 */

import { storeTabService } from '../services/storeTabService.js';
import { homeTabView } from '../views/tabs/menuTabView.js';
import { reviewTabView } from '../views/tabs/reviewTabView.js';

export const storeTabController = {
  currentStore: null,

  /**
   * 탭 네비게이션 초기화
   */
  initializeTabNavigation(store) {
    this.currentStore = store;
    const storeNavBar = document.getElementById('storeNavBar');

    if (!storeNavBar) {
      console.error('❌ storeNavBar 요소를 찾을 수 없습니다');
      return;
    }

    // 탭 클릭 이벤트
    storeNavBar.addEventListener('click', async (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;

      // 활성화된 탭 표시
      storeNavBar.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // 탭 렌더링
      await this.renderTab(btn.dataset.tab, store);
    });

    console.log('✅ 탭 네비게이션 초기화 완료');
  },

  /**
   * 탭 렌더링
   */
  async renderTab(tabName, store) {
    const storeContent = document.getElementById('storeContent');
    if (!storeContent) {
      console.error('❌ storeContent 요소를 찾을 수 없습니다');
      return;
    }

    console.log(`🔄 탭 전환: ${tabName}`, store ? store.name : '매장 정보 없음');

    try {
      switch (tabName) {
        case 'home':
          await this.renderHomeTab(store, storeContent);
          break;

        case 'review':
          await this.renderReviewTab(store, storeContent);
          break;

        case 'photo':
          storeContent.innerHTML = '<div class="empty-tab">등록된 사진이 없습니다...</div>';
          break;

        case 'info':
          storeContent.innerHTML = '<div class="empty-tab">등록된 정보가 없습니다...</div>';
          break;

        default:
          storeContent.innerHTML = '<div class="empty-tab">준비 중...</div>';
      }

      // 패널 레이아웃 조정
      if (window.StorePanelManager) {
        window.StorePanelManager.adjustLayout();
      }
    } catch (error) {
      console.error(`❌ ${tabName} 탭 렌더링 실패:`, error);
      storeContent.innerHTML = `<div class="error-tab">탭 로딩 중 오류가 발생했습니다.</div>`;
    }
  },

  /**
   * 메뉴 탭 렌더링
   */
  async renderHomeTab(store, container) {
    console.log('🍽️ 메뉴 탭 렌더링 시작');

    // 1. 메뉴 데이터 가져오기
    const menuData = store.menu

    // 2. 뷰 렌더링
    const menuHTML = homeTabView.render(store, menuData);
    container.innerHTML = menuHTML;

    console.log('✅ 메뉴 탭 렌더링 완료');
  },

  /**
   * 리뷰 탭 렌더링
   */
  async renderReviewTab(store, container) {
    console.log('📖 리뷰 탭 렌더링 시작');

    // 1. 리뷰 데이터 가져오기
    const reviewData = store.reviews

    // 2. 뷰 렌더링
    const reviewHTML = reviewTabView.render(store, reviewData);
    container.innerHTML = reviewHTML;

    // 3. 이벤트 리스너 설정
    reviewTabView.attachEventListeners(store);

    console.log('✅ 리뷰 탭 렌더링 완료');
  }
};

// 전역 등록 (하위 호환성)
window.StoreTabController = storeTabController;

console.log('✅ storeTabController 모듈 로드 완료');
