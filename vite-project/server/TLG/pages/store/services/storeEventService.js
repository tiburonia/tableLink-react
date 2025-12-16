
/**
 * Store 이벤트 서비스 - 이벤트 관련 비즈니스 로직 처리
 */
export const storeEventService = {
  /**
   * 리뷰 전체보기 실행
   */
  showAllReviews(store) {
    if (typeof renderAllReview === 'function') {
      renderAllReview(store);
    } else {
      console.warn('⚠️ renderAllReview 함수를 찾을 수 없습니다');
    }
  },

  /**
   * 테이블 상세 토글 상태 계산
   */
  calculateTableDetailToggleState(tableDetailContent, tableDetailToggleBtn) {
    const isExpanded = tableDetailContent.style.display !== 'none';
    
    return {
      isExpanded,
      newDisplay: isExpanded ? 'none' : 'block',
      newText: isExpanded ? '테이블 현황 자세히 보기' : '테이블 현황 간단히 보기',
      shouldCollapse: isExpanded
    };
  },

  /**
   * 테이블 상세 토글 애니메이션 처리
   */
  applyTableDetailToggle(tableDetailContent, tableDetailToggleBtn, toggleState) {
    if (toggleState.shouldCollapse) {
      // 닫기
      tableDetailContent.classList.remove('show');
      setTimeout(() => {
        tableDetailContent.style.display = 'none';
      }, 300);
      tableDetailToggleBtn.classList.remove('expanded');
    } else {
      // 열기
      tableDetailContent.style.display = 'block';
      setTimeout(() => {
        tableDetailContent.classList.add('show');
      }, 10);
      tableDetailToggleBtn.classList.add('expanded');
    }

    const toggleText = tableDetailToggleBtn.querySelector('.toggle-text');
    if (toggleText) {
      toggleText.textContent = toggleState.newText;
    }
  },

  /**
   * 패널 핸들링 초기화 (폴백)
   */
  initializeFallbackPanelHandling() {
    console.log('🔄 폴백: 레거시 패널 매니저 시도');
    
    if (window.StorePanelManager && typeof window.StorePanelManager.initializePanelHandling === 'function') {
      console.log('🔄 폴백: StorePanelManager 사용');
      window.StorePanelManager.initializePanelHandling();
      return true;
    }
    
    return false;
  },

  /**
   * 폴백 스크롤 스타일 적용
   */
  applyFallbackScrolling(storePanelContainer) {
    if (!storePanelContainer) {
      console.warn('⚠️ storePanelContainer를 찾을 수 없습니다');
      return false;
    }

    storePanelContainer.style.overflowY = 'auto';
    storePanelContainer.style.overflowX = 'hidden';
    storePanelContainer.style.webkitOverflowScrolling = 'touch';
    storePanelContainer.style.height = 'calc(100% - 24px)';

    console.log('✅ 폴백 스크롤 설정 완료');
    return true;
  },

  /**
   * TLR 컨테이너 클릭 처리
   */
  async handleTLRClick(store) {
    try {
      // tableController를 동적으로 로드
      const { tableController } = await import('../controllers/tableController.js');
      
      // 테이블 정보 로드 및 UI 업데이트 (강제 새로고침)
      await tableController.loadAndDisplayTableInfo(store, true);
      
      console.log('✅ TLR 클릭: 테이블 정보 새로고침 완료');
    } catch (error) {
      console.error('❌ TLR 클릭 처리 실패:', error);
      alert('테이블 정보를 불러올 수 없습니다.');
    }
  }
};

// 전역 등록
window.storeEventService = storeEventService;
