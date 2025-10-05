
/**
 * MyPage Controller
 * 마이페이지 전체 흐름 제어
 */

import { mypageService } from '../services/mypageService.js';
import { mypageView } from '../views/mypageView.js';
import { mypageSkeleton } from '../views/mypageSkeleton.js';

export const mypageController = {
  /**
   * 마이페이지 렌더링
   */
  async renderMyPage() {
    try {
      console.log('🏠 마이페이지 렌더링 시작');

      // 사용자 정보 확인
      if (!window.userInfo || !window.userInfo.id) {
        console.error('❌ 사용자 정보 없음');
        if (typeof renderLogin === 'function') {
          renderLogin();
        }
        return;
      }

      const main = document.getElementById('main');
      if (!main) {
        console.error('❌ #main 요소를 찾을 수 없습니다');
        return;
      }

      // 0. 스켈레톤 UI 렌더링
      main.innerHTML = mypageSkeleton.render();

      // 1. 데이터 로드 (Service Layer) - window.userInfo.id는 users.id (PK)
      const userPk = window.userInfo.userId;
      console.log('👤 사용자 PK로 마이페이지 데이터 로드:', userPk);
      const data = await mypageService.loadMypageData(userPk); // hasReview 포함

      // 2. 스타일 주입
      mypageView.injectStyles();

      // 3. HTML 렌더링 (View Layer)
      main.innerHTML = mypageView.renderHTML(data);

      // 4. 패널 핸들링 설정
      this.setupPanelHandling();

      // 5. 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ 마이페이지 렌더링 완료');

    } catch (error) {
      console.error('❌ 마이페이지 렌더링 실패:', error);
      this.showErrorState();
    }
  },

  /**
   * 패널 핸들링 설정
   */
  setupPanelHandling() {
    const panel = document.getElementById('mypagePanel');
    const panelHandle = document.getElementById('mypagePanelHandle');
    const panelContainer = document.getElementById('mypagePanelContainer');

    if (!panel || !panelContainer) return;

    this.adjustPanelLayout();
    window.addEventListener('resize', () => this.adjustPanelLayout());
    panel.addEventListener('transitionend', () => this.adjustPanelLayout());

    this.setupWheelEvents(panel, panelContainer);
    this.setupTouchEvents(panel, panelContainer);

    setTimeout(() => this.adjustPanelLayout(), 0);
  },

  /**
   * 패널 레이아웃 조정
   */
  adjustPanelLayout() {
    const panel = document.getElementById('mypagePanel');
    const panelContainer = document.getElementById('mypagePanelContainer');
    const bottomBar = document.getElementById('bottomBar');
    const panelHandle = document.getElementById('mypagePanelHandle');

    if (!panel || !panelContainer) return;

    const vh = window.innerHeight;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const bottomBarHeight = bottomBar ? bottomBar.offsetHeight : 78;
    const handleHeight = panelHandle ? panelHandle.offsetHeight + 8 : 24;
    const isExpanded = top === 0;

    let panelHeight;
    if (isExpanded) {
      panelHeight = vh - bottomBarHeight - handleHeight;
      panelContainer.style.paddingBottom = '120px';
    } else {
      panelHeight = vh - top - bottomBarHeight - handleHeight;
      panelContainer.style.paddingBottom = '100px';
    }

    panelContainer.style.height = `${panelHeight}px`;
    panelContainer.style.maxHeight = `${panelHeight}px`;
    panelContainer.style.overflowY = 'auto';
    panelContainer.style.overflowX = 'hidden';
    panelContainer.style.webkitOverflowScrolling = 'touch';
  },

  /**
   * 휠 이벤트 설정
   */
  setupWheelEvents(panel, panelContainer) {
    panel.addEventListener('wheel', (e) => {
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      if (e.deltaY > 0) {
        if (isCollapsed) {
          e.preventDefault();
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
          setTimeout(() => this.adjustPanelLayout(), 30);
          return;
        }
        return;
      }

      if (e.deltaY < 0) {
        if (isExpanded) {
          if (panelContainer.scrollTop <= 0) {
            e.preventDefault();
            panel.classList.remove('expanded');
            panel.classList.add('collapsed');
            panel.style.top = '100px';
            setTimeout(() => this.adjustPanelLayout(), 30);
            return;
          }
          return;
        }
      }
    });
  },

  /**
   * 터치 이벤트 설정
   */
  setupTouchEvents(panel, panelContainer) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let initialScrollTop = 0;

    panel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      initialScrollTop = panelContainer.scrollTop;
      isDragging = true;
      panel.style.transition = 'none';
    });

    panel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
      const isExpanded = top === 0;
      const isCollapsed = !isExpanded;

      if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(100, -deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }

      if (isCollapsed && deltaY > 0) {
        e.preventDefault();
        const newTop = Math.max(0, Math.min(100, 100 - deltaY));
        panel.style.top = `${newTop}px`;
        return;
      }
    });

    panel.addEventListener('touchend', (e) => {
      if (!isDragging) return;

      isDragging = false;
      const deltaY = startY - currentY;
      const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

      panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
        } else {
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '100px';
        }
      } else {
        if (top < 50) {
          panel.classList.remove('collapsed');
          panel.classList.add('expanded');
          panel.style.top = '0px';
        } else {
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '100px';
        }
      }

      setTimeout(() => this.adjustPanelLayout(), 30);
    });
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 퀵 액션 버튼들
    this.attachQuickActionListeners();
    
    // 전체보기 버튼들
    this.attachViewAllListeners();
  },

  /**
   * 퀵 액션 리스너 설정
   */
  attachQuickActionListeners() {
    const quickOrdersBtn = document.querySelector('#quickOrdersBtn');
    const quickCouponsBtn = document.querySelector('#quickCouponsBtn');
    const quickFavoritesBtn = document.querySelector('#quickFavoritesBtn');
    const quickPointsBtn = document.querySelector('#quickPointsBtn');

    if (quickOrdersBtn) {
      quickOrdersBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/store/order/renderAllOrderHTML.js');
        if (typeof renderAllOrderHTML === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllOrderHTML(window.userInfo);
        }
      });
    }

    if (quickCouponsBtn) {
      quickCouponsBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllCoupons.js');
        if (typeof renderAllCoupons === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllCoupons(window.userInfo);
        }
      });
    }

    if (quickFavoritesBtn) {
      quickFavoritesBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllFavorites.js');
        if (typeof renderAllFavorites === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllFavorites(window.userInfo);
        }
      });
    }

    if (quickPointsBtn) {
      quickPointsBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllPoints.js');
        if (typeof renderAllPoints === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllPoints(window.userInfo);
        }
      });
    }
  },

  /**
   * 전체보기 리스너 설정
   */
  attachViewAllListeners() {
    const viewAllReviewsBtn = document.querySelector('#viewAllReviewsBtn');
    const viewAllFavoritesBtn = document.querySelector('#viewAllFavoritesBtn');
    const viewAllLevelsBtn = document.querySelector('#viewAllLevelsBtn');
    const viewAllPointsBtn = document.querySelector('#viewAllPointsBtn');

    if (viewAllReviewsBtn) {
      viewAllReviewsBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllReview.js');
        if (typeof renderMyReviews === 'function') {
          window.previousScreen = 'renderMyPage';
          renderMyReviews(window.userInfo.userId, window.userInfo);
        }
      });
    }

    if (viewAllFavoritesBtn) {
      viewAllFavoritesBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllFavorites.js');
        if (typeof renderAllFavorites === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllFavorites(window.userInfo);
        }
      });
    }

    if (viewAllLevelsBtn) {
      viewAllLevelsBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllRegularLevels.js');
        if (typeof renderAllRegularLevels === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllRegularLevels(window.userInfo);
        }
      });
    }

    if (viewAllPointsBtn) {
      viewAllPointsBtn.addEventListener('click', async () => {
        await this.loadScript('/TLG/pages/mypage/renderAllPoints.js');
        if (typeof renderAllPoints === 'function') {
          window.previousScreen = 'renderMyPage';
          renderAllPoints(window.userInfo);
        }
      });
    }
  },

  /**
   * 스크립트 동적 로드
   */
  async loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * 에러 상태 표시
   */
  showErrorState() {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 마이페이지를 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">잠시 후 다시 시도해주세요</p>
          <button onclick="renderMyPage()" style="
            padding: 10px 20px;
            background: #297efc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">다시 시도</button>
        </div>
      `;
    }
  }
};
