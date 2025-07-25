
// 캐시 저장소 매니저
class CacheManager {
  constructor() {
    this.cache = {
      stores: null,
      userInfo: null,
      lastUpdated: {
        stores: null,
        userInfo: null
      }
    };
    this.CACHE_DURATION = 5 * 60 * 1000; // 5분
  }

  // 캐시 유효성 검사
  isCacheValid(type) {
    const lastUpdated = this.cache.lastUpdated[type];
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < this.CACHE_DURATION;
  }

  // 매장 데이터 가져오기 (캐시 우선)
  async getStores(forceRefresh = false) {
    if (!forceRefresh && this.cache.stores && this.isCacheValid('stores')) {
      console.log('🔄 매장 데이터 캐시 사용');
      return this.cache.stores;
    }

    try {
      console.log('🌐 매장 데이터 서버에서 가져오는 중...');
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      this.cache.stores = data.stores || [];
      this.cache.lastUpdated.stores = Date.now();
      
      console.log('✅ 매장 데이터 캐시 업데이트 완료');
      return this.cache.stores;
    } catch (error) {
      console.error('매장 데이터 로딩 실패:', error);
      // 캐시된 데이터가 있으면 반환
      if (this.cache.stores) {
        console.log('⚠️ 서버 오류로 캐시 데이터 사용');
        return this.cache.stores;
      }
      throw error;
    }
  }

  // 사용자 정보 가져오기 (캐시 우선)
  async getUserInfo(userId, forceRefresh = false) {
    if (!forceRefresh && this.cache.userInfo && this.isCacheValid('userInfo') && this.cache.userInfo.id === userId) {
      console.log('🔄 사용자 정보 캐시 사용');
      return this.cache.userInfo;
    }

    try {
      console.log('🌐 사용자 정보 서버에서 가져오는 중...');
      const response = await fetch('/api/users/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      this.cache.userInfo = data.user;
      this.cache.lastUpdated.userInfo = Date.now();
      
      console.log('✅ 사용자 정보 캐시 업데이트 완료');
      return this.cache.userInfo;
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error);
      // 캐시된 데이터가 있으면 반환
      if (this.cache.userInfo && this.cache.userInfo.id === userId) {
        console.log('⚠️ 서버 오류로 캐시 데이터 사용');
        return this.cache.userInfo;
      }
      throw error;
    }
  }

  // 사용자 정보 업데이트 (로컬 캐시만)
  updateUserInfoCache(updatedInfo) {
    this.cache.userInfo = { ...this.cache.userInfo, ...updatedInfo };
    this.cache.lastUpdated.userInfo = Date.now();
    console.log('🔄 사용자 정보 캐시 로컬 업데이트');
  }

  // 특정 매장 찾기
  findStore(storeId) {
    if (!this.cache.stores) return null;
    return this.cache.stores.find(store => store.id == storeId || store.name === storeId);
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

  // 캐시 초기화
  clearCache() {
    this.cache = {
      stores: null,
      userInfo: null,
      lastUpdated: {
        stores: null,
        userInfo: null
      }
    };
    console.log('🗑️ 캐시 초기화 완료');
  }

  // 사용자 로그아웃시 사용자 정보만 캐시 삭제
  clearUserCache() {
    this.cache.userInfo = null;
    this.cache.lastUpdated.userInfo = null;
    console.log('🗑️ 사용자 캐시 초기화 완료');
  }
}

// 전역 캐시 매니저 인스턴스
const cacheManager = new CacheManager();

// 전역에서 사용할 수 있도록 window 객체에 추가
window.cacheManager = cacheManager;
