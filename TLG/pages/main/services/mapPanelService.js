
// 모듈 임포트 (조건부)
let mapPanelRepository;

try {
  const repoModule = await import('../repositories/mapPanelRepository.js');
  mapPanelRepository = repoModule.mapPanelRepository;
} catch (error) {
  console.warn('⚠️ mapPanelRepository 모듈 임포트 실패:', error);
  mapPanelRepository = window.mapPanelRepository;
}

/**
 * 지도 패널 비즈니스 로직 서비스
 * 데이터 변환, 필터링, 정렬 등 담당
 */
export const mapPanelService = {
  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async getViewportStores(map) {
    if (!map) {
      throw new Error('지도 인스턴스가 필요합니다');
    }

    const bounds = map.getBounds();
    const level = map.getLevel();
    
    console.log(`📱 패널용 매장 데이터 조회: level=${level}`);

    try {
      const data = await mapPanelRepository.fetchViewportStores(map, level, bounds);
      
      if (!data.success) {
        throw new Error(data.error || '매장 데이터 조회 실패');
      }

      // 개별 매장 데이터만 필터링 및 변환
      const features = data.data || data.features || [];
      const stores = features
        .filter(feature => feature.kind === 'individual')
        .map(feature => this.transformStoreData(feature))
        .filter(Boolean);

      console.log(`✅ 패널용 매장 데이터 변환 완료: ${stores.length}개`);
      return stores;

    } catch (error) {
      console.error('❌ 뷰포트 매장 데이터 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 필터 적용
   */
  applyFilters(stores, activeFilters) {
    if (!stores || stores.length === 0) return [];
    if (!activeFilters || Object.keys(activeFilters).length === 0) return stores;

    return stores.filter(store => {
      // 카테고리 필터
      if (activeFilters.category && store.category !== activeFilters.category) {
        return false;
      }

      // 운영 상태 필터
      if (activeFilters.status) {
        if (activeFilters.status === 'open' && !store.isOpen) return false;
        if (activeFilters.status === 'closed' && store.isOpen) return false;
      }

      // 별점 필터
      if (activeFilters.rating) {
        const requiredRating = parseFloat(activeFilters.rating.replace('+', ''));
        const storeRating = parseFloat(store.ratingAverage) || 0;
        if (storeRating < requiredRating) return false;
      }

      return true;
    });
  },

  /**
   * 매장 데이터 정렬
   */
  sortStores(stores, sortType = 'distance') {
    const sortedStores = [...stores];

    switch (sortType) {
      case 'rating':
        return sortedStores.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
      case 'review':
        return sortedStores.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      case 'name':
        return sortedStores.sort((a, b) => a.name.localeCompare(b.name));
      case 'distance':
      default:
        return sortedStores; // 기본적으로 API에서 거리순으로 정렬됨
    }
  },

  /**
   * 매장 검색
   */
  searchStores(stores, keyword) {
    if (!keyword || !stores) return stores;

    const searchTerm = keyword.toLowerCase().trim();
    
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm) ||
      store.category.toLowerCase().includes(searchTerm) ||
      store.address.toLowerCase().includes(searchTerm)
    );
  },

  /**
   * 매장 카드 데이터 준비
   */
  prepareStoreCardData(store) {
    if (!store) return null;

    // ID 검증
    let storeId = store.id || store.store_id;
    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || storeId <= 0) {
      console.error('❌ 유효하지 않은 매장 ID:', store);
      return null;
    }

    const normalizedStore = {
      ...store,
      id: storeId,
      store_id: storeId
    };

    try {
      // JSON 직렬화 안전성 검사
      const jsonString = JSON.stringify(normalizedStore);
      return {
        store: normalizedStore,
        jsonData: jsonString.replace(/"/g, '&quot;'),
        isValid: true
      };
    } catch (error) {
      console.error('❌ 매장 데이터 JSON 직렬화 실패:', error);
      // 최소한의 데이터로 폴백
      const minimalStore = {
        id: storeId,
        store_id: storeId,
        name: store.name || '매장명 없음',
        category: store.category || '기타',
        isOpen: store.isOpen !== false
      };
      return {
        store: minimalStore,
        jsonData: JSON.stringify(minimalStore).replace(/"/g, '&quot;'),
        isValid: false
      };
    }
  },

  /**
   * 매장 데이터 변환 (내부 헬퍼)
   */
  transformStoreData(feature) {
    // ID 우선순위: id > store_id
    let storeId = feature.id || feature.store_id;
    
    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || storeId <= 0) {
      console.error('❌ 유효하지 않은 매장 ID:', feature);
      return null;
    }

    return {
      id: storeId,
      store_id: storeId,
      name: feature.name || '매장명 없음',
      category: feature.category || '기타',
      address: `${feature.sido || ''} ${feature.sigungu || ''} ${feature.eupmyeondong || ''}`.trim() || '주소 정보 없음',
      ratingAverage: feature.rating_average ? parseFloat(feature.rating_average) : 0.0,
      reviewCount: feature.review_count || 0,
      favoriteCount: 0,
      isOpen: feature.is_open !== false,
      coord: { lat: feature.lat, lng: feature.lng },
      region: {
        sido: feature.sido,
        sigungu: feature.sigungu,
        eupmyeondong: feature.eupmyeondong
      }
    };
  },

  /**
   * 카테고리별 통계
   */
  getCategoryStats(stores) {
    const stats = {};
    
    stores.forEach(store => {
      const category = store.category || '기타';
      if (!stats[category]) {
        stats[category] = {
          count: 0,
          openCount: 0,
          avgRating: 0,
          totalRating: 0
        };
      }
      
      stats[category].count++;
      if (store.isOpen) stats[category].openCount++;
      stats[category].totalRating += store.ratingAverage || 0;
    });

    // 평균 평점 계산
    Object.keys(stats).forEach(category => {
      const stat = stats[category];
      stat.avgRating = stat.count > 0 ? (stat.totalRating / stat.count).toFixed(1) : '0.0';
    });

    return stats;
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapPanelService = mapPanelService;
}
