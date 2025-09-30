
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
   * 위치 설정 처리
   */
  async processLocationSetting(province, city, district) {
    console.log(`📍 위치 설정 처리: ${province} ${city} ${district}`);

    let coords = null;
    let locationName = `${province} ${city} ${district}`;

    try {
      // 1. 시군구 행정기관 좌표 시도
      const adminResponse = await mapDataRepository.fetchAdministrativeOffice('sigungu', city);
      if (adminResponse.success && adminResponse.office) {
        coords = {
          lat: adminResponse.office.latitude,
          lng: adminResponse.office.longitude
        };
        locationName = `${city} (행정기관)`;
        console.log(`✅ 시군구 행정기관 좌표 발견`);
      }
    } catch (error) {
      console.warn('시군구 행정기관 좌표 조회 실패:', error);
    }

    // 2. 시도 행정기관 좌표 시도 (실패시)
    if (!coords) {
      try {
        const provinceResponse = await mapDataRepository.fetchAdministrativeOffice('sido', province);
        if (provinceResponse.success && provinceResponse.office) {
          coords = {
            lat: provinceResponse.office.latitude,
            lng: provinceResponse.office.longitude
          };
          locationName = `${province} (도청/시청)`;
          console.log(`✅ 시도 행정기관 좌표 발견`);
        }
      } catch (error) {
        console.warn('시도 행정기관 좌표 조회 실패:', error);
      }
    }

    // 3. 읍면동 중심점 시도 (실패시)
    if (!coords) {
      try {
        const districtResponse = await mapDataRepository.fetchEupmyeondongCenter(province, city, district);
        if (districtResponse.success && districtResponse.center) {
          coords = {
            lat: districtResponse.center.latitude,
            lng: districtResponse.center.longitude
          };
          locationName = `${district} (중심점)`;
          console.log(`✅ 읍면동 중심점 좌표 발견`);
        }
      } catch (error) {
        console.warn('읍면동 중심점 조회 실패:', error);
      }
    }

    // 4. 기본 좌표 API 시도 (모든 것이 실패시)
    if (!coords) {
      const response = await mapDataRepository.fetchCoordinates(province, city, district);
      if (response.success && response.coordinates) {
        coords = response.coordinates;
        locationName = `${province} ${city} ${district}`;
        console.log(`✅ 기본 좌표 API 성공`);
      }
    }

    if (!coords) {
      throw new Error('해당 지역의 좌표를 찾을 수 없습니다');
    }

    return { coords, locationName };
  },

  /**
   * 지역 데이터 로드
   */
  async getRegionData(type, parentData = {}) {
    switch (type) {
      case 'provinces':
        return await mapDataRepository.fetchProvinces();
      case 'cities':
        return await mapDataRepository.fetchCities(parentData.province);
      case 'districts':
        return await mapDataRepository.fetchDistricts(parentData.province, parentData.city);
      default:
        throw new Error(`지원하지 않는 지역 타입: ${type}`);
    }
  },

  /**
   * 현재 위치 정보 업데이트
   */
  async updateCurrentLocationInfo(map) {
    const center = map.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    try {
      const data = await mapDataRepository.fetchLocationInfo(lat, lng);
      
      if (data.success && data.eupmyeondong) {
        return data.eupmyeondong;
      }
      
      return '위치 정보 없음';
    } catch (error) {
      console.error('현재 위치 정보 로딩 실패:', error);
      return '위치 정보 없음';
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
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapService = mapService;
}
