/**
 * renderMyAccount - 레이어드 아키텍처 진입점
 * ES6 모듈 방식으로 동작
 */

import myAccountController from './controllers/myAccountController.js';

async function renderMyAccount() {
  console.log('🚀 renderMyAccount 시작 (ES6 모듈)');

  try {
    // Controller 초기화
    await myAccountController.init();
  } catch (error) {
    console.error('❌ renderMyAccount 로드 실패:', error);
    alert('페이지를 불러오는 중 오류가 발생했습니다.');
  }
}

// 전역 함수로 등록 (하위 호환성 유지)
if (typeof window !== 'undefined') {
  window.renderMyAccount = renderMyAccount;
}

export default renderMyAccount;