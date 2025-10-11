/**
 * MyPage Event Handler
 * 마이페이지 이벤트 처리 및 패널 핸들링
 */

import { mypagePanelManager } from './mypagePanelManager.js';

export const mypageEventHandler = {
  /**
   * 이벤트 리스너 초기화
   */
  initialize() {
    console.log('🎯 마이페이지 이벤트 핸들러 초기화');

    // Hero Card 데이터 업데이트
    this.updateHeroCard();

    // 설정 버튼 이벤트 리스너 등록
    const settingsBtn = document.querySelector('.settings-btn-icon');
    if (settingsBtn) {
      settingsBtn.onclick = async (e) => {
        e.preventDefault();
        try {
          // 전역 함수 사용 (이미 index.html에서 로드됨)
          if (typeof window.renderMyAccount === 'function') {
            await window.renderMyAccount();
          } else {
            const { default: renderMyAccount } = await import('/TLG/pages/mypage/renderMyAccount.js');
            await renderMyAccount();
          }
        } catch (error) {
          console.error('❌ renderMyAccount 로드 실패:', error);
          alert('계정 페이지를 불러올 수 없습니다.');
        }
      };
      console.log('✅ 설정 버튼 이벤트 리스너 등록 완료');
    }

    // 패널 핸들링 설정

    // 퀵 액션 버튼 이벤트
    this.attachQuickActionListeners();

    // 전체보기 버튼 이벤트
    this.attachViewAllListeners();

    // 주문 내역 전체보기 버튼 이벤트 (모든 버튼에 적용)
    const viewAllOrdersBtns = document.querySelectorAll('[data-action="view-all-orders"]');
    viewAllOrdersBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.userInfo && typeof window.renderAllOrderHTML === 'function') {
          window.renderAllOrderHTML(window.userInfo);
        } else {
          console.error('❌ renderAllOrderHTML 함수 또는 사용자 정보 없음');
        }
      });
    });
    if (viewAllOrdersBtns.length > 0) {
      console.log(`✅ 주문 내역 버튼 ${viewAllOrdersBtns.length}개에 이벤트 등록 완료`);
    }

    console.log('✅ 마이페이지 이벤트 핸들러 초기화 완료');
  },

  /**
   * Hero Card 업데이트
   */
  updateHeroCard() {
    const regularSummary = window.mypageData?.regularSummary;
    if (!regularSummary) return;

    const levelEmojis = {
      'PLATINUM': '💎',
      'GOLD': '👑',
      'SILVER': '⭐',
      'BRONZE': '🥉'
    };

    const levelGradients = {
      'PLATINUM': 'linear-gradient(135deg, #e5e4e2 0%, #f8f9fa 100%)',
      'GOLD': 'linear-gradient(135deg, #ffd700 0%, #fff5e7 100%)',
      'SILVER': 'linear-gradient(135deg, #c0c0c0 0%, #f1f3f5 100%)',
      'BRONZE': 'linear-gradient(135deg, #cd7f32 0%, #fff5eb 100%)'
    };

    const levelEmoji = levelEmojis[regularSummary.topLevel] || '🏅';
    const levelGradient = levelGradients[regularSummary.topLevel] || 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)';

    // DOM 업데이트
    const heroCard = document.querySelector('.mypage-hero-card');
    if (heroCard) {
      heroCard.style.background = levelGradient;
    }

    const heroEmojiEl = document.getElementById('heroEmoji');
    if (heroEmojiEl) heroEmojiEl.textContent = levelEmoji;

    const heroLevelEl = document.getElementById('heroLevel');
    if (heroLevelEl) heroLevelEl.textContent = regularSummary.topLevelName;

    const levelNameEl = document.getElementById('levelName');
    if (levelNameEl) levelNameEl.textContent = regularSummary.topLevelName;

    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.textContent = `${regularSummary.totalPoints.toLocaleString()}P`;

    const totalCouponsEl = document.getElementById('totalCoupons');
    if (totalCouponsEl) totalCouponsEl.textContent = `${regularSummary.totalCoupons}장`;
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