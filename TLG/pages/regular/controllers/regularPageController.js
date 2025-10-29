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
      // 사용자 정보 가져오기 (AuthManager 사용)
      const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : window.userInfo;

      if (!userInfo || !userInfo.userId) {
        console.warn('⚠️ 로그인 필요');
        alert('로그인이 필요합니다.');
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        }
        return;
      }

      console.log('✅ 사용자 정보 확인:', userInfo.name, '(PK:', userInfo.userId, ')');

      // 데이터 로딩 (PK 사용)
      const result = await regularPageService.getRegularStoresData(userInfo.userId);

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
    // 탭 전환
    const nearbyTab = document.getElementById('nearbyTab');
    const followingTab = document.getElementById('followingTab');
    const nearbyPane = document.getElementById('nearbyPane');
    const followingPane = document.getElementById('followingPane');

    if (nearbyTab) {
      nearbyTab.addEventListener('click', () => {
        nearbyTab.classList.add('active');
        followingTab?.classList.remove('active');
        nearbyPane.style.display = 'block';
        followingPane.style.display = 'none';
      });
    }

    if (followingTab) {
      followingTab.addEventListener('click', () => {
        followingTab.classList.add('active');
        nearbyTab?.classList.remove('active');
        followingPane.style.display = 'block';
        nearbyPane.style.display = 'none';
      });
    }

    // 즐겨찾기 전체보기
    const viewAllBtns = document.querySelectorAll('.view-all-btn[data-tab="favorite"]');
    viewAllBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.showFavoriteListGrid();
      });
    });

    // 더보기 버튼
    const showAllBtn = document.getElementById('showAllBtn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        this.showAllStores();
      });
    }

    // 피드로 이동 (이벤트 위임)
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action="goto-feed"]');
      if (target) {
        e.preventDefault();
        await this.navigateToFeed();
      }
    });

    // 사이드패널 이벤트
    this.setupSidePanelEvents();
  },

  /**
   * 피드 페이지로 이동
   */
  async navigateToFeed() {
    try {
      const { default: renderFeed } = await import('/TLG/pages/feed/renderFeed.js');
      await renderFeed();
    } catch (error) {
      console.error('❌ 피드 페이지 이동 실패:', error);
      alert('피드 페이지를 불러올 수 없습니다.');
    }
  },

  /**
   * 사이드패널 이벤트 설정
   */
  setupSidePanelEvents() {
    const sideMenuBtn = document.getElementById('sideMenuBtn');
    const sidePanel = document.getElementById('sidePanel');
    const sidePanelOverlay = document.getElementById('sidePanelOverlay');
    const sidePanelCloseBtn = document.getElementById('sidePanelCloseBtn');

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // 사이드패널 열기
    const openSidePanel = () => {
      sidePanel.classList.add('active');
      sidePanelOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    // 사이드패널 닫기
    const closeSidePanel = () => {
      sidePanel.classList.remove('active');
      sidePanelOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    // 전역 함수로 등록 (다른 곳에서도 사용 가능)
    window.closeSidePanel = closeSidePanel;

    // 메뉴 버튼 클릭
    if (sideMenuBtn) {
      sideMenuBtn.addEventListener('click', openSidePanel);
    }

    // 닫기 버튼 클릭
    if (sidePanelCloseBtn) {
      sidePanelCloseBtn.addEventListener('click', closeSidePanel);
    }

    // 오버레이 클릭
    if (sidePanelOverlay) {
      sidePanelOverlay.addEventListener('click', closeSidePanel);
    }

    // 터치 드래그로 닫기
    if (sidePanel) {
      sidePanel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        sidePanel.classList.add('dragging');
      });

      sidePanel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        // 오른쪽으로만 드래그 허용 (패널이 열리는 방향)
        if (deltaX > 0) {
          const translateX = Math.min(deltaX, 280); // 최대 280px까지 이동
          sidePanel.style.transform = `translate3d(${translateX}px, 0, 0)`;
        } else {
          // 왼쪽으로 드래그할 경우 패널을 닫는 동작을 하기 위함
          const translateX = Math.max(deltaX, -280); // 최대 -280px까지 이동 (닫기 동작)
          sidePanel.style.transform = `translate3d(${translateX}px, 0, 0)`;
        }
      });

      sidePanel.addEventListener('touchend', () => {
        if (!isDragging) return;

        isDragging = false;
        sidePanel.classList.remove('dragging');

        const deltaX = currentX - startX;

        // 드래그 거리가 충분하면 닫기 (왼쪽으로 드래그)
        if (deltaX < -100) {
          closeSidePanel();
        } else {
          // 드래그 거리가 충분하지 않으면 원래 위치로 복귀
          sidePanel.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    }

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidePanel.classList.contains('active')) {
        closeSidePanel();
      }
    });
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