
/**
 * MyPage Event Handler
 * 마이페이지 이벤트 처리 및 패널 핸들링
 */

import { mypagePanelManager } from './mypagePanelManager.js';

export const mypageEventHandler = {
  /**
   * 이벤트 핸들러 초기화
   */
  initialize() {
    // 패널 핸들링 설정
    mypagePanelManager.setup();

    // 퀵 액션 버튼 이벤트
    this.attachQuickActionListeners();
    
    // 전체보기 버튼 이벤트
    this.attachViewAllListeners();

    console.log('✅ 마이페이지 이벤트 핸들러 초기화 완료');
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
        await this.loadScript('/TLG/pages/store/views/order/renderAllOrderHTML.js');
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
  }
};
