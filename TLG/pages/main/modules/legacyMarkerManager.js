
// 기존 마커 시스템 비활성화 - 타일 시스템으로 대체됨
window.LegacyMarkerManager = {
  // 빈 메서드들로 대체하여 기존 호출에서 에러 방지
  initialize: () => {
    console.log('⚠️ 기존 마커 시스템이 비활성화됨 - 타일 시스템 사용 중');
  },
  
  updateMarkersForLevel: () => {
    // 아무것도 하지 않음
  },
  
  clearAllMarkers: () => {
    // 아무것도 하지 않음  
  },
  
  cleanup: () => {
    // 아무것도 하지 않음
  }
};

// 기존 전역 함수들도 비활성화
window.loadViewportStores = () => {
  console.log('⚠️ loadViewportStores 비활성화됨 - 타일 시스템 사용 중');
};

window.renderStore = (store) => {
  console.log('🏪 매장 선택:', store.name);
  // 매장 상세 정보 표시 로직은 유지
  if (typeof showStoreDetail === 'function') {
    showStoreDetail(store);
  }
};
