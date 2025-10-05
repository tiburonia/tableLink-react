/**
 * MyPage Controller
 * 마이페이지 전체 흐름 제어
 */

import { mypageService } from '../services/mypageService.js';
import { mypageView } from '../views/mypageView.js';
import { mypageSkeleton } from '../views/mypageSkeleton.js';
import { mypageEventHandler } from '../views/mypageEventHandler.js';

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

      // 4. 이벤트 핸들러 초기화 (View Layer로 위임)
      mypageEventHandler.initialize();

      console.log('✅ 마이페이지 렌더링 완료');

    } catch (error) {
      console.error('❌ 마이페이지 렌더링 실패:', error);
      this.showErrorState();
    }
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