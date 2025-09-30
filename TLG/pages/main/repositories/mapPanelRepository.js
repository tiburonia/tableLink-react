
/**
 * 지도 패널 데이터 접근 레포지토리
 * API 호출과 데이터 소스 접근만 담당
 */
export const mapPanelRepository = {
  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async fetchViewportStores(map, level, bounds) {
    const bbox = `${bounds.getSouthWest().getLng()},${bounds.getSouthWest().getLat()},${bounds.getNorthEast().getLng()},${bounds.getNorthEast().getLat()}`;

    const params = new URLSearchParams({
      level: level.toString(),
      bbox: bbox
    });

    console.log(`📍 패널 API 요청: /api/clusters/clusters?${params}`);

    const response = await fetch(`/api/clusters/clusters?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 패널 API 응답 오류:', response.status, errorText);
      throw new Error(`패널 매장 데이터 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 캐싱된 매장 데이터 조회 (성능 최적화용)
   */
  async fetchCachedStores(cacheKey) {
    // 향후 Redis나 LocalStorage 기반 캐싱 구현 예정
    return null;
  },

  /**
   * 매장 상세 정보 조회
   */
  async fetchStoreDetail(storeId) {
    const response = await fetch(`/api/stores/${storeId}`);
    
    if (!response.ok) {
      throw new Error(`매장 상세 정보 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 매장 즐겨찾기 상태 조회
   */
  async fetchStoreFavoriteStatus(userId, storeId) {
    const response = await fetch(`/api/stores/${storeId}/favorite-status?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`즐겨찾기 상태 조회 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 매장 운영 시간 조회
   */
  async fetchStoreOperatingHours(storeId) {
    const response = await fetch(`/api/stores/${storeId}/operating-hours`);
    
    if (!response.ok) {
      throw new Error(`운영 시간 조회 실패: ${response.status}`);
    }

    return await response.json();
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapPanelRepository = mapPanelRepository;
}
