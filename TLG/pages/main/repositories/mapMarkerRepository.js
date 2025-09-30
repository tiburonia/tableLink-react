
/**
 * 지도 마커 데이터 접근 레포지토리
 * API 호출과 데이터 소스 접근만 담당
 */
export const mapMarkerRepository = {
  // 요청 캐시 (성능 최적화용)
  requestCache: new Map(),

  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async fetchViewportStores(level, bbox) {
    const params = new URLSearchParams({
      level: level.toString(),
      bbox: bbox
    });

    console.log(`📍 마커 API 요청: /api/clusters/clusters?${params}`);

    const response = await fetch(`/api/clusters/clusters?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 마커 API 응답 오류:', response.status, errorText);
      throw new Error(`마커 매장 데이터 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 특정 매장 상세 정보 조회
   */
  async fetchStoreDetail(storeId) {
    const response = await fetch(`/api/stores/${storeId}/detail`);
    
    if (!response.ok) {
      throw new Error(`매장 상세 정보 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 매장 실시간 상태 조회
   */
  async fetchStoreStatus(storeId) {
    const response = await fetch(`/api/stores/${storeId}/status`);
    
    if (!response.ok) {
      throw new Error(`매장 상태 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 매장 마커 클릭 이벤트 로깅
   */
  async logMarkerClick(storeId, userId = null) {
    try {
      const response = await fetch('/api/analytics/marker-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeId,
          userId: userId,
          timestamp: new Date().toISOString(),
          source: 'map_marker'
        })
      });

      if (!response.ok) {
        console.warn('⚠️ 마커 클릭 로깅 실패:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ 마커 클릭 로깅 오류:', error);
    }
  },

  /**
   * 캐시 정리
   */
  clearCache() {
    this.requestCache.clear();
    console.log('🧹 마커 레포지토리 캐시 정리 완료');
  },

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      totalMemory: JSON.stringify(Array.from(this.requestCache.values())).length
    };
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapMarkerRepository = mapMarkerRepository;
}
