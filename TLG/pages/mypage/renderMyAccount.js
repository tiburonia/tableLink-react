// renderMyAccount - 레이어드 아키텍처 진입점
// Repository, Service, View, Controller 모듈을 로드하고 Controller 초기화

async function renderMyAccount() {
  console.log('🚀 renderMyAccount 시작 (레이어드 아키텍처)');

  try {
    // 1. Repository 로드
    if (!window.myAccountRepository) {
      await loadScript('/TLG/pages/mypage/repositories/myAccountRepository.js');
    }

    // 2. Service 로드
    if (!window.myAccountService) {
      await loadScript('/TLG/pages/mypage/services/myAccountService.js');
    }

    // 3. View 로드
    if (!window.myAccountView) {
      await loadScript('/TLG/pages/mypage/views/myAccountView.js');
    }

    // 4. Controller 로드
    if (!window.myAccountController) {
      await loadScript('/TLG/pages/mypage/controllers/myAccountController.js');
    }

    // 5. Controller 초기화
    await window.myAccountController.init();

  } catch (error) {
    console.error('❌ renderMyAccount 로드 실패:', error);
    alert('페이지를 불러오는 중 오류가 발생했습니다.');
  }
}

// 스크립트 로드 헬퍼 함수
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'module';
    
    script.onload = () => {
      console.log(`✅ 로드 완료: ${src}`);
      resolve();
    };
    
    script.onerror = () => {
      console.error(`❌ 로드 실패: ${src}`);
      reject(new Error(`Failed to load ${src}`));
    };
    
    document.head.appendChild(script);
  });
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.renderMyAccount = renderMyAccount;
}
