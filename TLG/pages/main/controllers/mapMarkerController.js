
// 모듈 임포트 (조건부)
let mapMarkerService, mapMarkerView;

try {
  const serviceModule = await import('../services/mapMarkerService.js');
  const viewModule = await import('../views/mapMarkerView.js');
  mapMarkerService = serviceModule.mapMarkerService;
  mapMarkerView = viewModule.mapMarkerView;
} catch (error) {
  console.warn('⚠️ mapMarker 모듈 임포트 실패:', error);
  mapMarkerService = window.mapMarkerService;
  mapMarkerView = window.mapMarkerView;
}

/**
 * 지도 마커 컨트롤러 - 마커 이벤트 처리 및 흐름 제어
 */
export const mapMarkerController = {
  // 상태 관리
  state: {
    map: null,
    currentMarkers: new Map(),
    currentLevel: 0,
    currentBounds: null,
    isLoading: false,
    shouldCancel: false,
    lastCallTime: 0,
    debounceTimer: null,
    requestCache: new Map()
  },

  /**
   * 마커 매니저 초기화
   */
  async initializeMarkers(map) {
    console.log('🗺️ 지도 마커 컨트롤러 초기화');

    this.state.map = map;

    try {
      // 지도 이벤트 설정
      this.setupMapEvents();

      // 초기 마커 로딩
      setTimeout(() => {
        this.handleMapLevelChange(map.getLevel());
      }, 500);

      console.log('✅ 지도 마커 컨트롤러 초기화 완료');
    } catch (error) {
      console.error('❌ 지도 마커 초기화 실패:', error);
    }
  },

  /**
   * 지도 이벤트 설정
   */
  setupMapEvents() {
    const map = this.state.map;
    if (!map) return;

    // 레벨 변경 이벤트
    kakao.maps.event.addListener(map, 'zoom_changed', () => {
      this.handleMapLevelChange(map.getLevel());
    });

    // 드래그 완료 이벤트
    kakao.maps.event.addListener(map, 'dragend', () => {
      this.handleMapLevelChange(map.getLevel());
    });

    // 지도 이동 완료 이벤트
    kakao.maps.event.addListener(map, 'idle', () => {
      this.handleMapLevelChange(map.getLevel());
    });

    console.log('✅ 지도 마커 이벤트 설정 완료');
  },

  /**
   * 지도 레벨 변경 처리 (메인 진입점)
   */
  async handleMapLevelChange(level) {
    console.log(`🔄 지도 레벨 ${level} 변경 - 마커 업데이트 시작`);

    // 디바운싱 - 빠른 연속 호출 방지
    if (this.state.lastCallTime && Date.now() - this.state.lastCallTime < 150) {
      console.log('⚡ 디바운싱: 빠른 연속 호출 무시');
      return;
    }
    this.state.lastCallTime = Date.now();

    // 이전 작업 취소
    if (this.state.isLoading) {
      console.log('🔄 기존 작업 취소 후 새 작업 시작');
      this.state.shouldCancel = true;
      clearTimeout(this.state.debounceTimer);
      this.state.debounceTimer = setTimeout(() => this.handleMapLevelChange(level), 150);
      return;
    }

    this.state.isLoading = true;
    this.state.shouldCancel = false;
    this.state.currentLevel = level;

    try {
      const newBounds = this.state.map.getBounds();

      // 뷰포트 변경 체크
      if (this.shouldUpdateForViewportChange(newBounds)) {
        console.log('🔄 뷰포트 변경 감지 - 마커 업데이트 수행');
      }

      // 마커 업데이트
      await this.refreshMarkers(level);
      this.state.currentBounds = newBounds;

    } catch (error) {
      if (!this.state.shouldCancel) {
        console.error('❌ 마커 업데이트 실패:', error);
      }
    } finally {
      this.state.isLoading = false;
    }

    if (!this.state.shouldCancel) {
      console.log(`✅ 지도 레벨 ${level} 마커 업데이트 완료`);
    }
  },

  /**
   * 뷰포트 변경 감지
   */
  shouldUpdateForViewportChange(newBounds) {
    if (!this.state.currentBounds) return true;

    const oldSW = this.state.currentBounds.getSouthWest();
    const oldNE = this.state.currentBounds.getNorthEast();
    const newSW = newBounds.getSouthWest();
    const newNE = newBounds.getNorthEast();

    // 뷰포트가 30% 이상 변경되면 업데이트
    const latDiff = Math.abs(oldNE.getLat() - newNE.getLat()) / Math.abs(oldNE.getLat() - oldSW.getLat());
    const lngDiff = Math.abs(oldNE.getLng() - newNE.getLng()) / Math.abs(oldNE.getLng() - oldSW.getLng());

    return latDiff > 0.3 || lngDiff > 0.3;
  },

  /**
   * 마커 새로고침
   */
  async refreshMarkers(level) {
    console.log(`🌐 마커 새로고침 시작 (레벨: ${level})`);

    try {
      // 매장 데이터 조회
      const stores = await mapMarkerService.getViewportStores(this.state.map, level);

      // 작업 취소 확인
      if (this.state.shouldCancel) {
        console.log('🚫 마커 새로고침 작업 취소됨');
        return;
      }

      // 마커 렌더링
      await this.renderMarkers(stores);

    } catch (error) {
      if (!this.state.shouldCancel) {
        console.error('❌ 마커 새로고침 실패:', error);
      }
    }
  },

  /**
   * 마커 렌더링
   */
  async renderMarkers(stores) {
    console.log(`🏪 마커 ${stores.length}개 렌더링 시작`);

    if (!stores || stores.length === 0) {
      this.clearAllMarkers();
      return;
    }

    const newMarkerKeys = new Set();
    const markersToAdd = [];

    for (const store of stores) {
      try {
        const markerKey = `store-${store.id}-${store.coord.lat}-${store.coord.lng}`;
        newMarkerKeys.add(markerKey);

        // 기존 마커가 없으면 새로 생성
        if (!this.state.currentMarkers.has(markerKey)) {
          const markerData = mapMarkerService.prepareMarkerData(store);
          if (markerData) {
            const marker = mapMarkerView.createStoreMarker(markerData, this.state.map);
            if (marker) {
              markersToAdd.push({ key: markerKey, marker });
            }
          }
        }
      } catch (error) {
        console.error('❌ 개별 마커 생성 실패:', error, store);
      }
    }

    // 작업 취소 최종 확인
    if (!this.state.shouldCancel) {
      // 사라진 마커들 제거
      for (const [key, marker] of this.state.currentMarkers) {
        if (!newMarkerKeys.has(key) && marker && marker.setMap) {
          marker.setMap(null);
        }
      }

      // 새 마커들로 교체
      this.state.currentMarkers.clear();
      for (const { key, marker } of markersToAdd) {
        this.state.currentMarkers.set(key, marker);
      }

      console.log(`✅ 마커 렌더링 완료 - 총: ${this.state.currentMarkers.size}개`);
    }
  },

  /**
   * 마커 클릭 이벤트 처리
   */
  handleMarkerClick(storeData) {
    console.log('🖱️ 마커 클릭:', storeData.name);

    try {
      if (window.renderStore && typeof window.renderStore === 'function') {
        window.renderStore(storeData);
      } else {
        console.error('❌ renderStore 함수를 찾을 수 없음');
      }
    } catch (error) {
      console.error('❌ 마커 클릭 처리 실패:', error);
    }
  },

  /**
   * 모든 마커 제거
   */
  clearAllMarkers() {
    console.log(`🧹 기존 마커 ${this.state.currentMarkers.size}개 제거`);

    for (const [key, marker] of this.state.currentMarkers) {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    }

    this.state.currentMarkers.clear();
  },

  /**
   * 특정 매장 마커 하이라이트
   */
  highlightStoreMarker(storeId) {
    const targetKey = Array.from(this.state.currentMarkers.keys())
      .find(key => key.startsWith(`store-${storeId}-`));

    if (targetKey) {
      const marker = this.state.currentMarkers.get(targetKey);
      if (marker) {
        mapMarkerView.highlightMarker(marker);
        console.log(`✨ 매장 마커 하이라이트: ${storeId}`);
      }
    }
  },

  /**
   * 모든 마커 하이라이트 해제
   */
  removeAllHighlights() {
    for (const [key, marker] of this.state.currentMarkers) {
      mapMarkerView.removeHighlight(marker);
    }
    console.log('🔄 모든 마커 하이라이트 해제');
  },

  /**
   * 완전 초기화 (메모리 관리 강화)
   */
  reset() {
    console.log('🔄 지도 마커 컨트롤러 완전 초기화');

    this.state.shouldCancel = true;
    this.clearAllMarkers();

    // 타이머 정리
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer);
      this.state.debounceTimer = null;
    }

    // 캐시 정리
    this.state.requestCache.clear();

    // 상태 초기화
    this.state.map = null;
    this.state.currentLevel = 0;
    this.state.currentBounds = null;
    this.state.isLoading = false;
    this.state.shouldCancel = false;
    this.state.lastCallTime = 0;

    console.log('✅ 지도 마커 컨트롤러 초기화 완료');
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapMarkerController = mapMarkerController;
}
