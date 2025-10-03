
/**
 * 매장 탭 컨트롤러 - 사용자 인터랙션 처리
 */

import { storeTabService } from '../services/storeTabService.js';
import { homeTabView } from '../views/tabs/homeTabView.js';
import { reviewTabView } from '../views/tabs/reviewTabView.js';
import { menuTabView } from '../views/tabs/menuTabView.js'

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

        case 'menu':
          await this.renderMenuTab(store, storeContent)
          break;

        case 'regular':
          storeContent.innerHTML = '<div class="empty-tab">등록된 단골정보가 없습니다...</div>';
          break;
        case 'info':
          storeContent.innerHTML = '<div class="empty-tab">준비 중...</div>';
          
          

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
   * 홈 탭 렌더링
   */
  async renderHomeTab(store, container) {
    console.log('🍽️ 홈 탭 렌더링 시작');

    // 1. 기본 뷰 렌더링
    const homeHTML = homeTabView.render(store);
    container.innerHTML = homeHTML;

    // 2. 테이블 상태 모듈 로드 및 렌더링
    try {
      const { tableStatusHTML } = await import('../views/modules/tableStatusHTML.js');
      const tableStatusContainer = document.getElementById('home-table-status');
      if (tableStatusContainer) {
        tableStatusContainer.innerHTML = tableStatusHTML.renderTableStatusHTML(store);
        
        // 테이블 상태 업데이트
        if (window.storeController && typeof window.storeController.loadTableInfo === 'function') {
          await window.storeController.loadTableInfo(store);
        }
      }
    } catch (error) {
      console.error('❌ 테이블 상태 모듈 로드 실패:', error);
    }

    // 3. 메뉴 모듈 로드 및 렌더링
    try {
      const { menuHTML } = await import('../views/modules/menuHTML.js');
      const menuContainer = document.getElementById('home-menu-section');
      if (menuContainer && store.menu && store.menu.length > 0) {
        menuContainer.innerHTML = `
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">🍽️</span>
              메뉴
            </h3>
          </div>
          ${menuHTML.renderMenuHTML(store)}
        `;
      }
    } catch (error) {
      console.error('❌ 메뉴 모듈 로드 실패:', error);
    }

    // 4. 리뷰 프리뷰 모듈 로드 및 렌더링
    try {
      const { reviewPreviewHTML } = await import('../views/modules/reviewPreviewHTML.js');
      const { reviewPreviewController } = await import('./reviewPreviewController.js');
      
      const reviewContainer = document.getElementById('home-review-preview');
      if (reviewContainer) {
        reviewContainer.innerHTML = reviewPreviewHTML.renderReviewPreviewHTML();
        
        // 리뷰 데이터 로드
        if (reviewPreviewController && typeof reviewPreviewController.renderTopReviews === 'function') {
          await reviewPreviewController.renderTopReviews(store);
        }
      }
    } catch (error) {
      console.error('❌ 리뷰 프리뷰 모듈 로드 실패:', error);
    }

    console.log('✅ 홈 탭 렌더링 완료');
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
  },



  /**
   * 메뉴 탭 렌더링
   */
  async renderMenuTab(store, container) {
    console.log('🍽️ 메뉴 탭 렌더링 시작');

    try {
      // menuTabView 모듈 동적 로드
      const { menuTabView } = await import('../views/tabs/menuTabView.js');
      
      // 메뉴 탭 HTML 렌더링
      const menuHTML = menuTabView.render(store);
      container.innerHTML = menuHTML;

      console.log('✅ 메뉴 탭 렌더링 완료');
    } catch (error) {
      console.error('❌ 메뉴 탭 렌더링 실패:', error);
      container.innerHTML = `
        <div class="error-tab">
          <p>메뉴를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      `;
    }
  },

  /**
   * 매장정보 탭 렌더링
   */
  async renderStoreInfoTab(store, container) {
    
  },
  /**
   * 단골혜택 탭 렌더링
   */
  async renderRegularTab(store, container) {
    
  }
  
};

// 전역 등록 (하위 호환성)
window.StoreTabController = storeTabController;

console.log('✅ storeTabController 모듈 로드 완료');
