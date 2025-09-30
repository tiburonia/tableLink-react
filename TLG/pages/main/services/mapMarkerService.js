
// 모듈 임포트 (조건부)
let mapMarkerRepository;

try {
  const repoModule = await import('../repositories/mapMarkerRepository.js');
  mapMarkerRepository = repoModule.mapMarkerRepository;
} catch (error) {
  console.warn('⚠️ mapMarkerRepository 모듈 임포트 실패:', error);
  mapMarkerRepository = window.mapMarkerRepository;
}

/**
 * 지도 마커 비즈니스 로직 서비스
 * 마커 데이터 변환, 필터링, 캐싱 등 담당
 */
export const mapMarkerService = {
  // 캐시 설정
  cacheTimeout: 60000, // 1분

  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async getViewportStores(map, level) {
    if (!map) {
      throw new Error('지도 인스턴스가 필요합니다');
    }

    const bounds = map.getBounds();
    const bbox = [
      bounds.getSouthWest().getLng(),
      bounds.getSouthWest().getLat(),
      bounds.getNorthEast().getLng(),
      bounds.getNorthEast().getLat()
    ].join(',');

    console.log(`📍 마커용 매장 데이터 조회: level=${level}, bbox=${bbox}`);

    try {
      // 캐시 확인
      const cacheKey = `${level}-${bbox}`;
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`⚡ 캐시된 데이터 사용: ${cachedData.length}개`);
        return cachedData;
      }

      // API 호출
      const data = await mapMarkerRepository.fetchViewportStores(level, bbox);
      
      if (!data.success) {
        throw new Error(data.error || '매장 데이터 조회 실패');
      }

      // 개별 매장만 필터링 및 변환
      const features = data.data || data.features || [];
      const stores = features
        .filter(feature => feature.kind === 'individual')
        .map(feature => this.transformStoreData(feature))
        .filter(Boolean);

      // 성공한 결과만 캐시
      if (stores.length > 0) {
        this.setCachedData(cacheKey, stores);
      }

      console.log(`✅ 마커용 매장 데이터 변환 완료: ${stores.length}개`);
      return stores;

    } catch (error) {
      console.error('❌ 뷰포트 매장 데이터 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 마커 데이터 준비
   */
  prepareMarkerData(store) {
    if (!store || !store.coord) return null;

    // ID 검증
    let storeId = store.id || store.store_id;
    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || storeId <= 0) {
      console.error('❌ 유효하지 않은 매장 ID:', store);
      return null;
    }

    const isOpen = store.isOpen !== false;
    const rating = store.ratingAverage || '0.0';
    const categoryIcon = this.getCategoryIcon(store.category);

    return {
      id: storeId,
      name: store.name || '매장명 없음',
      category: store.category || '기타',
      isOpen: isOpen,
      rating: rating,
      categoryIcon: categoryIcon,
      position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
      storeData: {
        id: storeId,
        name: store.name,
        category: store.category,
        ratingAverage: store.ratingAverage,
        reviewCount: store.reviewCount,
        isOpen: store.isOpen,
        coord: store.coord,
        fullAddress: store.address
      }
    };
  },

  /**
   * 카테고리별 아이콘 매핑
   */
  getCategoryIcon(category) {
    const iconMap = {
      '한식': '🍚',
      '중식': '🥟',
      '일식': '🍣',
      '양식': '🍝',
      '카페': '☕',
      '치킨': '🍗',
      '피자': '🍕',
      '햄버거': '🍔',
      '분식': '🍲',
      '술집': '🍺',
      '디저트': '🧁',
      '베이커리': '🥖'
    };

    return iconMap[category] || '🍽️';
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
      address: feature.full_address || `${feature.sido || ''} ${feature.sigungu || ''} ${feature.eupmyeondong || ''}`.trim(),
      ratingAverage: feature.rating_average ? parseFloat(feature.rating_average) : 0.0,
      reviewCount: feature.review_count || 0,
      isOpen: feature.is_open !== false,
      coord: { lat: feature.lat, lng: feature.lng }
    };
  },

  /**
   * 캐시 데이터 조회
   */
  getCachedData(cacheKey) {
    if (!mapMarkerRepository.requestCache) return null;

    const cached = mapMarkerRepository.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // 만료된 캐시 삭제
    if (cached) {
      mapMarkerRepository.requestCache.delete(cacheKey);
    }

    return null;
  },

  /**
   * 캐시 데이터 저장
   */
  setCachedData(cacheKey, data) {
    if (!mapMarkerRepository.requestCache) {
      mapMarkerRepository.requestCache = new Map();
    }

    mapMarkerRepository.requestCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    // 캐시 크기 제한 (메모리 관리)
    if (mapMarkerRepository.requestCache.size > 50) {
      const oldestKey = mapMarkerRepository.requestCache.keys().next().value;
      mapMarkerRepository.requestCache.delete(oldestKey);
    }
  },

  /**
   * 거리 기반 매장 정렬
   */
  sortStoresByDistance(stores, centerLat, centerLng) {
    return stores.sort((a, b) => {
      const distanceA = this.calculateDistance(centerLat, centerLng, a.coord.lat, a.coord.lng);
      const distanceB = this.calculateDistance(centerLat, centerLng, b.coord.lat, b.coord.lng);
      return distanceA - distanceB;
    });
  },

  /**
   * 두 지점 간 거리 계산 (Haversine 공식)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * 도를 라디안으로 변환
   */
  toRad(value) {
    return value * Math.PI / 180;
  },

  /**
   * 마커 클러스터링 (향후 구현)
   */
  clusterMarkers(stores, level) {
    // 향후 줌 레벨에 따른 마커 클러스터링 로직 구현
    return stores;
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapMarkerService = mapMarkerService;
}
