
// 매장 패널 관리자 (레거시 래퍼 - 하위 호환성 유지)
// 새로운 레이어드 아키텍처로 위임

window.StorePanelManager = {
  async initializePanelHandling() {
    console.log('🔄 [StorePanelManager] 레거시 래퍼 - 새 아키텍처로 위임');
    
    try {
      // 동적으로 panelController 로드
      const { panelController } = await import('../controllers/panelController.js');
      panelController.initializePanelHandling();
    } catch (error) {
      console.error('❌ [StorePanelManager] 패널 컨트롤러 로드 실패:', error);
      this.fallbackInitialization();
    }
  },

  // 폴백 초기화 (에러 시)
  fallbackInitialization() {
    console.log('🔄 [StorePanelManager] 폴백 초기화 실행');
    
    const storePanelContainer = document.getElementById('storePanelContainer');
    if (storePanelContainer) {
      storePanelContainer.style.overflowY = 'auto';
      storePanelContainer.style.overflowX = 'hidden';
      storePanelContainer.style.webkitOverflowScrolling = 'touch';
      storePanelContainer.style.height = 'calc(100% - 24px)';
      
      console.log('✅ [StorePanelManager] 폴백 스크롤 설정 완료');
    }
  }
};
