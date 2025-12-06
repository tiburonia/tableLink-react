
/**
 * 검색 데이터 접근 레포지토리
 * API 호출과 데이터 소스 접근만 담당
 */
export const searchRepository = {
  /**
   * 매장 검색 API 호출
   */
  async searchStores(query) {
    try {
      const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 매장 검색 API 호출 실패:', error);
      throw error;
    }
  },

  /**
   * 장소 검색 API 호출 (카카오)
   */
  async searchPlaces(query, lat, lng, radius = 20000) {
    try {
      const response = await fetch(
        `/api/stores/search-place?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 장소 검색 API 호출 실패:', error);
      throw error;
    }
  }
};

// 전역 등록 (호환성)
if (typeof window !== 'undefined') {
  window.searchRepository = searchRepository;
}
