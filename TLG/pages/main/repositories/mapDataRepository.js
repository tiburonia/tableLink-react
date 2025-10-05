/**
 * 지도 데이터 접근 레포지토리
 * API 호출과 데이터 소스 접근만 담당
 */
export const mapDataRepository = {
  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async fetchViewportStores(bounds, zoom) {
    try {
      const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
      const response = await fetch(
        `/api/clusters/clusters?zoom=${zoom}&bbox=${bbox}`
      );

      if (!response.ok) {
        throw new Error(`매장 데이터 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('fetchViewportStores 오류:', error);
      throw error;
    }
  },

  /**
   * 매장 검색
   */
  async searchStores(query) {
    const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`매장 검색 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 장소 검색 (카카오 API)
   */
  async searchPlaces(query, lat, lng, radius = 20000) {
    const response = await fetch(`/api/stores/search-place?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=${radius}`);

    if (!response.ok) {
      throw new Error(`장소 검색 실패: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * 지역 데이터 조회 (비활성화됨)
   */
  async fetchProvinces() {
    console.log('📍 시도 데이터 조회 기능이 비활성화되었습니다');
    throw new Error('시도 데이터 조회 기능이 비활성화되었습니다');
  },

  async fetchCities(province) {
    console.log('📍 시군구 데이터 조회 기능이 비활성화되었습니다');
    throw new Error('시군구 데이터 조회 기능이 비활성화되었습니다');
  },

  async fetchDistricts(province, city) {
    console.log('📍 읍면동 데이터 조회 기능이 비활성화되었습니다');
    throw new Error('읍면동 데이터 조회 기능이 비활성화되었습니다');
  },

  /**
   * 좌표 정보 조회 (비활성화됨)
   */
  async fetchCoordinates(province, city, district) {
    console.log('📍 좌표 정보 조회 기능이 비활성화되었습니다');
    throw new Error('좌표 정보 조회 기능이 비활성화되었습니다');
  },

  /**
   * 현재 위치 정보 조회 (비활성화됨)
   */
  async fetchLocationInfo(lat, lng) {
    console.log('📍 현재 위치 정보 조회 기능이 비활성화되었습니다');
    throw new Error('현재 위치 정보 조회 기능이 비활성화되었습니다');
  },

  /**
   * 행정기관 좌표 조회 (비활성화됨)
   */
  async fetchAdministrativeOffice(regionType, regionName) {
    console.log('📍 행정기관 좌표 조회 기능이 비활성화되었습니다');
    throw new Error('행정기관 좌표 조회 기능이 비활성화되었습니다');
  },

  /**
   * 읍면동 중심점 조회 (비활성화됨)
   */
  async fetchEupmyeondongCenter(sido, sigungu, eupmyeondong) {
    console.log('📍 읍면동 중심점 조회 기능이 비활성화되었습니다');
    throw new Error('읍면동 중심점 조회 기능이 비활성화되었습니다');
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapDataRepository = mapDataRepository;
}