
// 패널 뷰 - UI 업데이트 및 시각적 피드백
let panelRepository;

try {
  const repoModule = await import('../../repositories/panelRepository.js');
  panelRepository = repoModule.panelRepository;
} catch (error) {
  console.warn('⚠️ panelRepository 모듈 임포트 실패:', error);
}

export const panelView = {
  /**
   * 패널 DOM 요소 가져오기
   */
  getPanelElements() {
    return panelRepository.getPanelElements();
  },

  /**
   * 초기 스크롤 설정 적용
   */
  applyInitialScrollSettings(container) {
    panelRepository.forceScrollSettings(container);
  },

  /**
   * 패널 높이 업데이트
   */
  updatePanelHeight(container, height) {
    panelRepository.setPanelContainerHeight(container, height);
    panelRepository.forceScrollSettings(container);
  },

  /**
   * 컨텐츠 최소 높이 업데이트
   */
  updateContentMinHeight(content, minHeight) {
    panelRepository.setContentMinHeight(content, minHeight);
  },

  /**
   * 패널 확장
   */
  expandPanel(panel) {
    panelRepository.togglePanelClass(panel, 'collapsed', false);
    panelRepository.togglePanelClass(panel, 'expanded', true);
    panelRepository.setPanelPosition(panel, 85);
  },

  /**
   * 패널 축소
   */
  collapsePanel(panel) {
    panelRepository.togglePanelClass(panel, 'expanded', false);
    panelRepository.togglePanelClass(panel, 'collapsed', true);
    panelRepository.setPanelPosition(panel, 200);
  },

  /**
   * 패널 위치 설정
   */
  setPanelTop(panel, top) {
    panelRepository.setPanelPosition(panel, top);
  },

  /**
   * 패널 현재 위치 가져오기
   */
  getPanelTop(panel) {
    return panelRepository.getPanelTop(panel);
  },

  /**
   * 스크롤 위치 가져오기
   */
  getScrollTop(container) {
    return panelRepository.getScrollTop(container);
  },

  /**
   * 트랜지션 비활성화
   */
  disableTransition(panel) {
    panelRepository.setPanelTransition(panel, 'none');
    panelRepository.setBodyUserSelect('none');
  },

  /**
   * 트랜지션 활성화
   */
  enableTransition(panel) {
    panelRepository.setPanelTransition(panel, 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)');
    panelRepository.setBodyUserSelect('');
  }
};

// 전역 등록
window.panelView = panelView;
