
/**
 * renderMyAccount - 내 계정 페이지 진입점
 * ES6 모듈 방식으로 동작
 */

import accountSettingsController from './controllers/accountSettingsController.js';

async function renderMyAccount() {
  console.log('🚀 renderMyAccount 시작 (ES6 모듈)');

  try {
    // Controller 초기화
    await accountSettingsController.init();
  } catch (error) {
    console.error('❌ renderMyAccount 로드 실패:', error);
    alert('페이지를 불러오는 중 오류가 발생했습니다.');
  }
}

// 전역 함수로 등록 (하위 호환성 유지)
if (typeof window !== 'undefined') {
  window.renderMyAccount = renderMyAccount;
}

console.log('✅ renderMyAccount 모듈 로드 완료');

export default renderMyAccount;
