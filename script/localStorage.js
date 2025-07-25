
// 로컬스토리지 기반 캐시 매니저
class CacheManager {
  constructor() {
    this.cacheKeys = {
      STORES: 'tablelink_stores_cache',
      USER_INFO: 'tablelink_userinfo_cache',
      CACHE_TIMESTAMP: 'tablelink_cache_timestamp'
    };
    
    // 캐시 유효시간 (밀리초) - 30분
    this.CACHE_DURATION = 30 * 60 * 1000;
  }

  // 캐시 초기화
  initializeCache() {
    console.log('🔄 캐시 시스템 초기화');
    
    // 기존 캐시가 있는지 확인
    const timestamp = localStorage.getItem(this.cacheKeys.CACHE_TIMESTAMP);
    const now = Date.now();
    
    if (timestamp && (now - parseInt(timestamp)) < this.CACHE_DURATION) {
      console.log('✅ 유효한 캐시 발견');
      return true;
    } else {
      console.log('⚠️ 캐시가 만료되었거나 없음');
      this.clearCache();
      return false;
    }
  }

  // 모든 캐시 클리어
  clearCache() {
    console.log('🗑️ 캐시 클리어');
    localStorage.removeItem(this.cacheKeys.STORES);
    localStorage.removeItem(this.cacheKeys.USER_INFO);
    localStorage.removeItem(this.cacheKeys.CACHE_TIMESTAMP);
  }

  // 타임스탬프 업데이트
  updateTimestamp() {
    localStorage.setItem(this.cacheKeys.CACHE_TIMESTAMP, Date.now().toString());
  }

  // 매장 데이터 캐시 저장
  setStores(stores) {
    try {
      const storesData = {
        stores: stores,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(this.cacheKeys.STORES, JSON.stringify(storesData));
      this.updateTimestamp();
      console.log('💾 매장 데이터 캐시 저장 완료:', stores.length, '개 매장');
      return true;
    } catch (error) {
      console.error('❌ 매장 데이터 캐시 저장 실패:', error);
      return false;
    }
  }

  // 매장 데이터 캐시 가져오기
  async getStores() {
    try {
      const cachedData = localStorage.getItem(this.cacheKeys.STORES);
      
      if (cachedData) {
        const storesData = JSON.parse(cachedData);
        console.log('📁 캐시된 매장 데이터 사용:', storesData.stores.length, '개 매장');
        return storesData.stores;
      } else {
        console.log('🌐 매장 데이터 서버에서 가져오는 중...');
        
        const response = await fetch('/api/stores');
        const data = await response.json();
        const stores = data.stores || [];
        
        // 서버에서 가져온 데이터를 캐시에 저장
        this.setStores(stores);
        console.log('✅ 매장 데이터 캐시 업데이트 완료');
        
        return stores;
      }
    } catch (error) {
      console.error('❌ 매장 데이터 가져오기 실패:', error);
      return [];
    }
  }

  // 사용자 정보 캐시 저장
  setUserInfo(userInfo) {
    try {
      const userData = {
        userInfo: userInfo,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(this.cacheKeys.USER_INFO, JSON.stringify(userData));
      this.updateTimestamp();
      console.log('💾 사용자 정보 캐시 저장 완료:', userInfo.id);
      return true;
    } catch (error) {
      console.error('❌ 사용자 정보 캐시 저장 실패:', error);
      return false;
    }
  }

  // 사용자 정보 캐시 가져오기
  getUserInfo() {
    try {
      const cachedData = localStorage.getItem(this.cacheKeys.USER_INFO);
      
      if (cachedData) {
        const userData = JSON.parse(cachedData);
        console.log('📁 캐시된 사용자 정보 사용:', userData.userInfo.id);
        return userData.userInfo;
      } else {
        console.log('⚠️ 캐시된 사용자 정보 없음');
        return null;
      }
    } catch (error) {
      console.error('❌ 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  // 사용자 정보 서버에서 새로 가져와서 캐시 업데이트
  async refreshUserInfo(userId) {
    try {
      console.log('🔄 사용자 정보 서버에서 새로고침 중...');
      
      const response = await fetch('/api/users/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId })
      });

      if (!response.ok) {
        throw new Error('사용자 정보 조회 실패');
      }

      const data = await response.json();
      const userInfo = data.user;
      
      // 캐시 업데이트
      this.setUserInfo(userInfo);
      console.log('✅ 사용자 정보 캐시 업데이트 완료');
      
      return userInfo;
    } catch (error) {
      console.error('❌ 사용자 정보 새로고침 실패:', error);
      return null;
    }
  }

  // 특정 매장 정보 가져오기
  async getStoreById(storeId) {
    try {
      const stores = await this.getStores();
      const store = stores.find(s => s.id === storeId);
      
      if (store) {
        console.log('🏪 캐시에서 매장 정보 찾음:', store.name);
        return store;
      } else {
        console.log('⚠️ 매장 정보를 찾을 수 없음:', storeId);
        return null;
      }
    } catch (error) {
      console.error('❌ 매장 정보 조회 실패:', error);
      return null;
    }
  }

  // 매장 검색 (캐시 기반)
  async searchStores(keyword) {
    try {
      const stores = await this.getStores();
      const results = stores.filter(store =>
        store.name.toLowerCase().includes(keyword.toLowerCase()) ||
        store.category.toLowerCase().includes(keyword.toLowerCase())
      );
      
      console.log('🔍 캐시에서 검색 완료:', results.length, '개 결과');
      return results;
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error);
      return [];
    }
  }

  // 캐시 상태 확인
  getCacheStatus() {
    const timestamp = localStorage.getItem(this.cacheKeys.CACHE_TIMESTAMP);
    const storesCache = localStorage.getItem(this.cacheKeys.STORES);
    const userCache = localStorage.getItem(this.cacheKeys.USER_INFO);
    
    return {
      hasStoresCache: !!storesCache,
      hasUserCache: !!userCache,
      cacheAge: timestamp ? Date.now() - parseInt(timestamp) : null,
      isValid: this.initializeCache()
    };
  }

  // JSON 형태로 전체 캐시 데이터 내보내기
  exportCacheAsJson() {
    try {
      const storesData = localStorage.getItem(this.cacheKeys.STORES);
      const userData = localStorage.getItem(this.cacheKeys.USER_INFO);
      const timestamp = localStorage.getItem(this.cacheKeys.CACHE_TIMESTAMP);
      
      const exportData = {
        timestamp: timestamp,
        stores: storesData ? JSON.parse(storesData) : null,
        userInfo: userData ? JSON.parse(userData) : null,
        exportedAt: new Date().toISOString()
      };
      
      console.log('📤 캐시 데이터 JSON 내보내기 완료');
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ 캐시 데이터 내보내기 실패:', error);
      return null;
    }
  }

  // JSON 데이터로 캐시 가져오기
  importCacheFromJson(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      if (importData.stores) {
        localStorage.setItem(this.cacheKeys.STORES, JSON.stringify(importData.stores));
      }
      
      if (importData.userInfo) {
        localStorage.setItem(this.cacheKeys.USER_INFO, JSON.stringify(importData.userInfo));
      }
      
      if (importData.timestamp) {
        localStorage.setItem(this.cacheKeys.CACHE_TIMESTAMP, importData.timestamp);
      }
      
      console.log('📥 JSON 데이터로 캐시 가져오기 완료');
      return true;
    } catch (error) {
      console.error('❌ JSON 데이터 가져오기 실패:', error);
      return false;
    }
  }
}

// 전역 캐시 매니저 인스턴스 생성
window.cacheManager = new CacheManager();

// 페이지 로드 시 캐시 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 TableLink 캐시 시스템 시작');
  window.cacheManager.initializeCache();
});

// 개발용: 캐시 상태 확인 함수
window.checkCacheStatus = () => {
  const status = window.cacheManager.getCacheStatus();
  console.log('📊 캐시 상태:', status);
  return status;
};

// 개발용: 캐시 클리어 함수
window.clearAllCache = () => {
  window.cacheManager.clearCache();
  console.log('🗑️ 모든 캐시 클리어 완료');
};

// 개발용: 캐시 JSON 내보내기
window.exportCache = () => {
  return window.cacheManager.exportCacheAsJson();
};
