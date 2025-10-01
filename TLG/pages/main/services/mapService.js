
// 모듈 임포트 (조건부)
let mapDataRepository;

try {
  const repoModule = await import('../repositories/mapDataRepository.js');
  mapDataRepository = repoModule.mapDataRepository;
} catch (error) {
  console.warn('⚠️ mapDataRepository 모듈 임포트 실패:', error);
}

/**
 * 지도 비즈니스 로직 서비스
 * 데이터 가공, 조건 처리, 여러 repository 조합
 */
export const mapService = {
  /**
   * 뷰포트 기반 매장 데이터 처리
   */
  async getViewportStores(map) {
    if (!map) {
      throw new Error('지도 인스턴스가 필요합니다');
    }

    const bounds = map.getBounds();
    const level = map.getLevel();
    
    const bbox = `${bounds.getSouthWest().getLng()},${bounds.getSouthWest().getLat()},${bounds.getNorthEast().getLng()},${bounds.getNorthEast().getLat()}`;

    console.log(`📱 매장 데이터 조회: level=${level}, bbox=${bbox}`);

    const data = await mapDataRepository.fetchViewportStores(level, bbox);

    if (!data.success) {
      throw new Error(data.error || '매장 데이터 조회 실패');
    }

    // 개별 매장 데이터만 필터링 및 변환
    const features = data.data || data.features || [];
    const stores = features
      .filter(feature => feature.kind === 'individual')
      .map(feature => this.transformStoreData(feature))
      .filter(Boolean);

    console.log(`✅ 매장 데이터 변환 완료: ${stores.length}개`);
    return stores;
  },

  /**
   * 통합 검색 처리
   */
  async performUnifiedSearch(keyword, map) {
    if (!keyword.trim()) {
      return { stores: [], places: [] };
    }

    console.log(`🔍 통합 검색: "${keyword}"`);

    const center = map.getCenter();
    
    // 매장 검색과 장소 검색 병렬 실행
    const [storeResponse, placeResponse] = await Promise.all([
      mapDataRepository.searchStores(keyword),
      mapDataRepository.searchPlaces(keyword, center.getLat(), center.getLng())
    ]);

    const stores = storeResponse.stores || [];
    const places = placeResponse.success ? placeResponse.documents || [] : [];

    console.log(`📊 검색 결과: 매장 ${stores.length}개, 장소 ${places.length}개`);

    return { stores, places };
  },

  /**
   * 위치 설정 처리 (비활성화됨)
   */
  async processLocationSetting(province, city, district) {
    console.log(`📍 위치 설정 기능이 비활성화되었습니다: ${province} ${city} ${district}`);
    throw new Error('위치 설정 기능이 비활성화되었습니다');
  },

  /**
   * 지역 데이터 로드 (비활성화됨)
   */
  async getRegionData(type, parentData = {}) {
    console.log(`📍 지역 데이터 로드 기능이 비활성화되었습니다: ${type}`);
    throw new Error('지역 데이터 로드 기능이 비활성화되었습니다');
  },

  /**
   * 현재 위치 정보 업데이트 (비활성화됨)
   */
  async updateCurrentLocationInfo(map) {
    console.log('📍 현재 위치 정보 업데이트 기능이 비활성화되었습니다');
    return '지도';
  },

  /**
   * 표준화된 storeData 객체 생성 (통합 표준)
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

    // 통합된 storeData 객체 표준 형식
    const storeData = {
      id: storeId,
      store_id: storeId,
      name: feature.name || '매장명 없음',
      category: feature.category || '기타',
      address: `${feature.sido || ''} ${feature.sigungu || ''} ${feature.eupmyeondong || ''}`.trim() || '주소 정보 없음',
      ratingAverage: feature.rating_average ? parseFloat(feature.rating_average) : 0.0,
      reviewCount: feature.review_count || 0,
      favoriteCount: 0,
      isOpen: feature.is_open !== false,
      coord: { 
        lat: parseFloat(feature.lat), 
        lng: parseFloat(feature.lng) 
      },
      region: {
        sido: feature.sido,
        sigungu: feature.sigungu,
        eupmyeondong: feature.eupmyeondong
      }
    };

    console.log('✅ 표준화된 storeData 생성:', { 
      id: storeData.id, 
      name: storeData.name, 
      category: storeData.category,
      isOpen: storeData.isOpen
    });

    return storeData;
  },

  /**
   * storeData 객체 유효성 검증
   */
  validateStoreData(storeData) {
    if (!storeData) return false;
    
    const required = ['id', 'name', 'coord'];
    return required.every(field => {
      if (field === 'coord') {
        return storeData.coord && 
               typeof storeData.coord.lat === 'number' && 
               typeof storeData.coord.lng === 'number';
      }
      return storeData.hasOwnProperty(field) && storeData[field];
    });
  },

  /**
   * 레거시 데이터를 storeData 형식으로 변환
   */
  normalizeToStoreData(rawData) {
    if (this.validateStoreData(rawData)) {
      return rawData; // 이미 올바른 형식
    }

    // 레거시 형식에서 변환
    return this.transformStoreData(rawData);
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapService = mapService;
}
