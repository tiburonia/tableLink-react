
// 전역 키보드 이벤트 처리
function initGlobalKeyboardEvents() {
  console.log('🎹 전역 키보드 이벤트 초기화');

  // 전역 키보드 이벤트 리스너
  document.addEventListener('keydown', (event) => {
    // 입력 필드에서는 키보드 단축키 비활성화
    const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
                         event.target.contentEditable === 'true';
    
    if (isInputActive) {
      return; // 입력 필드에서는 단축키 무시
    }

    // Ctrl, Alt, Shift와 함께 눌린 경우 무시
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
      return;
    }

    // 'l' 키를 눌렀을 때 로그아웃
    if (event.key.toLowerCase() === 'l') {
      event.preventDefault(); // 기본 동작 방지
      
      // 로그아웃 확인
      const confirmLogout = confirm('정말 로그아웃하시겠습니까?');
      if (confirmLogout) {
        console.log('🔑 L키로 로그아웃 실행');
        
        // logOutF 함수가 존재하는지 확인하고 실행
        if (typeof logOutF === 'function') {
          logOutF();
        } else {
          console.warn('⚠️ logOutF 함수를 찾을 수 없습니다');
          alert('로그아웃 기능을 찾을 수 없습니다');
        }
      }
    }
  });

  console.log('✅ 전역 키보드 이벤트 설정 완료 - L키로 로그아웃 가능');
}

// DOM이 로드되면 자동으로 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalKeyboardEvents);
} else {
  initGlobalKeyboardEvents();
}

// 전역 함수로 내보내기 (필요시 수동 초기화용)
window.initGlobalKeyboardEvents = initGlobalKeyboardEvents;
