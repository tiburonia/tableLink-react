// 전역 키보드 이벤트 관리자
class GlobalKeyboardEvents {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ 전역 키보드 이벤트가 이미 초기화되었습니다');
      return;
    }

    console.log('🎹 전역 키보드 이벤트 초기화');

    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd 키와 함께 눌렀을 때만 처리 (기본 브라우저 기능 방해 방지)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'l':
            event.preventDefault();
            if (typeof logOut === 'function') {
              console.log('🔑 Ctrl/Cmd + L: 로그아웃 실행');
              logOut();
            } else {
              console.warn('⚠️ logOut 함수를 찾을 수 없습니다');
            }
            break;
        }
      }
    });

    this.isInitialized = true;
    console.log('✅ 전역 키보드 이벤트 설정 완료 - Ctrl/Cmd + L키로 로그아웃 가능');
  }
}

// 전역 인스턴스 생성 및 자동 초기화
window.globalKeyboardEvents = new GlobalKeyboardEvents();
window.globalKeyboardEvents.initialize();