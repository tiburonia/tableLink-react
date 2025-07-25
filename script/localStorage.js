
// 캐시 관리 시스템
class CacheManager {
  constructor() {
    this.cache = {
      stores: null,
      userInfo: null,
      lastUpdate: null
    };
    this.CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시 유지
  }

  // 캐시 유효성 검사
  isCacheValid() {
    if (!this.cache.lastUpdate) return false;
    return (Date.now() - this.cache.lastUpdate) < this.CACHE_DURATION;
  }

  // 매장 데이터 가져오기 (캐시 우선)
  async getStores() {
    if (this.cache.stores && this.isCacheValid()) {
      console.log('🚀 캐시된 매장 데이터 사용');
      return this.cache.stores;
    }

    console.log('🌐 매장 데이터 서버에서 가져오는 중...');
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      this.cache.stores = data.stores || [];
      this.cache.lastUpdate = Date.now();
      console.log('✅ 매장 데이터 캐시 업데이트 완료');
      return this.cache.stores;
    } catch (error) {
      console.error('매장 데이터 로딩 실패:', error);
      return this.cache.stores || [];
    }
  }

  // 특정 매장 찾기
  getStoreById(id) {
    if (!this.cache.stores) return null;
    return this.cache.stores.find(store => store.id === id);
  }

  // 매장 검색
  searchStores(keyword) {
    if (!this.cache.stores) return [];
    const lowerKeyword = keyword.toLowerCase();
    return this.cache.stores.filter(store =>
      store.name.toLowerCase().includes(lowerKeyword) ||
      store.category.toLowerCase().includes(lowerKeyword)
    );
  }

  // 사용자 정보 캐시
  setUserInfo(userInfo) {
    this.cache.userInfo = userInfo;
    window.userInfo = userInfo; // 기존 전역 변수와 호환성 유지
    window.currentUserInfo = userInfo; // 새로운 전역 변수
  }

  getUserInfo() {
    return this.cache.userInfo || window.userInfo;
  }

  // 캐시 초기화
  clearCache() {
    this.cache = {
      stores: null,
      userInfo: null,
      lastUpdate: null
    };
    console.log('🗑️ 캐시 초기화 완료');
  }

  // 매장 데이터 강제 새로고침
  async refreshStores() {
    this.cache.stores = null;
    this.cache.lastUpdate = null;
    return await this.getStores();
  }
}

// 전역 캐시 매니저 인스턴스
window.cacheManager = new CacheManager();
