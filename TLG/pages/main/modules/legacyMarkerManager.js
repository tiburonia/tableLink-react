// 레거시 마커 시스템 완전 차단 가드
console.log('🚫 레거시 마커 시스템 차단 가드 로드됨');

// 모든 레거시 호출을 차단하는 Proxy
window.LegacyMarkerManager = new Proxy({}, {
  get(target, prop) {
    console.warn(`🚫 LegacyMarkerManager.${prop} 호출 차단됨 - 타일 시스템 사용 중`);
    return () => {
      console.warn(`🚫 LegacyMarkerManager.${prop}() 실행 차단됨`);
    };
  }
});

// 레거시 전역 함수들도 차단
window.loadViewportStores = () => {
  console.warn('🚫 loadViewportStores 호출 차단됨 - 타일 시스템 사용 중');
};

window.renderLegacyMarkers = () => {
  console.warn('🚫 renderLegacyMarkers 호출 차단됨 - 타일 시스템 사용 중');
};

window.updateLegacyMarkers = () => {
  console.warn('🚫 updateLegacyMarkers 호출 차단됨 - 타일 시스템 사용 중');
};

// 읍면동 관련 함수들도 차단
window.aggregateByDong = () => {
  console.warn('🚫 aggregateByDong 호출 차단됨 - 타일 시스템 사용 중');
};

// 매장 상세 정보 표시는 유지 (타일 시스템에서 사용)
window.renderStore = (store) => {
  console.log('🏪 매장 선택:', store.name);
  if (typeof showStoreDetail === 'function') {
    showStoreDetail(store);
  }
};

console.log('✅ 레거시 마커 시스템 차단 완료');

// 메인 진입점 - 지도 이벤트 등록
  initialize(map, options = {}) {
    // 레거시 시스템 비활성화 체크
    if (window.DISABLE_LEGACY_MARKERS) {
      console.log('🚫 레거시 마커 시스템 비활성화됨 - 초기화 중단');
      return;
    }

    this.map = map;