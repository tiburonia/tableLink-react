
/**
 * 지도 데이터 접근 레포지토리
 * API 호출과 데이터 소스 접근만 담당
 */
export const mapDataRepository = {
  /**
   * 뷰포트 기반 매장 데이터 조회
   */
  async fetchViewportStores(level, bbox) {
    const params = new URLSearchParams({
      level: level.toString(),
      bbox: bbox
    });

    const response = await fetch(`/api/clusters/clusters?${params}`);
    
    if (!response.ok) {
      throw new Error(`매장 데이터 조회 실패: ${response.status}`);
    }

    return await response.json();
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
   * 지역 데이터 조회
   */
  async fetchProvinces() {
    const response = await fetch('/api/stores/regions/provinces');
    return await response.json();
  },

  async fetchCities(province) {
    const response = await fetch(`/api/stores/regions/cities?province=${encodeURIComponent(province)}`);
    return await response.json();
  },

  async fetchDistricts(province, city) {
    const response = await fetch(`/api/stores/regions/districts?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}`);
    return await response.json();
  },

  /**
   * 좌표 정보 조회
   */
  async fetchCoordinates(province, city, district) {
    const response = await fetch(`/api/stores/regions/coordinates?province=${encodeURIComponent(province)}&city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`);
    return await response.json();
  },

  /**
   * 현재 위치 정보 조회
   */
  async fetchLocationInfo(lat, lng) {
    const response = await fetch(`/api/stores/get-location-info?lat=${lat}&lng=${lng}`);
    return await response.json();
  },

  /**
   * 행정기관 좌표 조회
   */
  async fetchAdministrativeOffice(regionType, regionName) {
    const response = await fetch(`/api/stores/administrative-office?regionType=${regionType}&regionName=${encodeURIComponent(regionName)}`);
    return await response.json();
  },

  /**
   * 읍면동 중심점 조회
   */
  async fetchEupmyeondongCenter(sido, sigungu, eupmyeondong) {
    const response = await fetch(`/api/stores/eupmyeondong-center?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}&eupmyeondong=${encodeURIComponent(eupmyeondong)}`);
    return await response.json();
  }
};
