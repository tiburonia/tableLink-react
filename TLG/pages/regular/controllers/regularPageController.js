
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
    // 사이드 메뉴 버튼
    const sideMenuBtn = document.getElementById('sideMenuBtn');
    if (sideMenuBtn) {
      sideMenuBtn.addEventListener('click', () => {
        console.log('사이드 메뉴 클릭');
        alert('사이드 메뉴 기능은 곧 구현됩니다!');
      });
    }

    // 알림 버튼
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', () => {
        console.log('알림 버튼 클릭');
        if (typeof renderNotification === 'function') {
          renderNotification();
        } else {
          alert('알림 기능은 곧 구현됩니다!');
        }
      });
    }

    // 메시지 버튼
    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn) {
      messageBtn.addEventListener('click', () => {
        console.log('메시지 버튼 클릭');
        alert('메시지 기능은 곧 구현됩니다!');
      });
    }

    // 탭 전환 이벤트
    const nearbyTab = document.getElementById('nearbyTab');
    const followingTab = document.getElementById('followingTab');
    const nearbyPane = document.getElementById('nearbyPane');
    const followingPane = document.getElementById('followingPane');

    if (nearbyTab && followingTab && nearbyPane && followingPane) {
      nearbyTab.addEventListener('click', () => {
        nearbyTab.classList.add('active');
        followingTab.classList.remove('active');
        nearbyPane.style.display = 'block';
        followingPane.style.display = 'none';
        console.log('주변 매장 탭 활성화');
      });

      followingTab.addEventListener('click', () => {
        followingTab.classList.add('active');
        nearbyTab.classList.remove('active');
        followingPane.style.display = 'block';
        nearbyPane.style.display = 'none';
        console.log('팔로우 매장 탭 활성화');
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
