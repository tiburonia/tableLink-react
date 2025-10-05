
import { searchRepository } from '../repositories/searchRepository.js';

/**
 * 검색 비즈니스 로직 서비스
 * 데이터 가공 및 검증 담당
 */
export const searchService = {
  /**
   * 통합 검색 수행
   */
  async performUnifiedSearch(keyword) {
    if (!keyword || !keyword.trim()) {
      return { stores: [], places: [] };
    }

    console.log(`🔍 검색 서비스: "${keyword}"`);

    try {
      // 매장 검색만 수행
      const storeResponse = await searchRepository.searchStores(keyword);

      const stores = storeResponse.stores || [];

      console.log(`✅ 검색 완료: 매장 ${stores.length}개`);

      return { stores, places: [] };
    } catch (error) {
      console.error('❌ 검색 서비스 오류:', error);
      throw error;
    }
  },

  /**
   * 검색 결과 검증
   */
  validateSearchResults(results) {
    return {
      isValid: Array.isArray(results.stores),
      totalCount: (results.stores?.length || 0) + (results.places?.length || 0)
    };
  },

  /**
   * 매장 데이터 정규화
   */
  normalizeStoreData(store) {
    return {
      id: store.id,
      name: store.name || '이름 없음',
      category: store.category || '기타',
      address: store.address || '주소 정보 없음',
      ratingAverage: store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0',
      reviewCount: store.reviewCount || 0,
      isOpen: store.isOpen !== false,
      coord: store.coord || null
    };
  }
};

// 전역 등록
if (typeof window !== 'undefined') {
  window.searchService = searchService;
}
