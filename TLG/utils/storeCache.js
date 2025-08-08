
// 매장 정보 전용 캐시 시스템
class StoreCache {
  constructor() {
    this.cacheKey = 'tablelink_store_cache';
    this.cacheValidityDuration = 30 * 60 * 1000; // 30분
    console.log('🗄️ 매장 캐시 시스템 초기화');
  }

  // 캐시 데이터 가져오기
  getStoreData() {
    try {
      const cachedData = localStorage.getItem(this.cacheKey);
      if (!cachedData) {
        console.log('📭 캐시에 매장 데이터 없음');
        return null;
      }

      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;

      if (cacheAge > this.cacheValidityDuration) {
        console.log('⏰ 매장 캐시가 만료됨');
        this.clearCache();
        return null;
      }

      console.log('✅ 유효한 매장 캐시 발견 - 매장 수:', parsed.stores.length);
      return parsed.stores;
    } catch (error) {
      console.error('❌ 매장 캐시 읽기 실패:', error);
      this.clearCache();
      return null;
    }
  }

  // 캐시에 매장 데이터 저장
  setStoreData(stores) {
    try {
      const cacheData = {
        stores: stores,
        timestamp: Date.now()
      };

      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      console.log('💾 매장 데이터 캐시 저장 완료 - 매장 수:', stores.length);
    } catch (error) {
      console.error('❌ 매장 캐시 저장 실패:', error);
    }
  }

  // 캐시에 매장 데이터 저장 (비동기)
  async setStoreDataAsync(stores) {
    return new Promise((resolve) => {
      try {
        const cacheData = {
          stores: stores,
          timestamp: Date.now()
        };

        localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        console.log('💾 매장 데이터 캐시 저장 완료 (비동기) - 매장 수:', stores.length);
        resolve();
      } catch (error) {
        console.error('❌ 매장 캐시 저장 실패 (비동기):', error);
        resolve(); // 에러가 나도 완료 처리
      }
    });
  }

  // 캐시 삭제
  clearCache() {
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('🗑️ 매장 캐시 삭제 완료');
    } catch (error) {
      console.error('❌ 매장 캐시 삭제 실패:', error);
    }
  }

  // 캐시 삭제 (비동기)
  async clearCacheAsync() {
    return new Promise((resolve) => {
      try {
        localStorage.removeItem(this.cacheKey);
        console.log('🗑️ 매장 캐시 삭제 완료 (비동기)');
        resolve();
      } catch (error) {
        console.error('❌ 매장 캐시 삭제 실패 (비동기):', error);
        resolve(); // 에러가 나도 완료 처리
      }
    });
  }

  // 캐시 상태 확인
  hasCachedData() {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (!cachedData) return false;

    try {
      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;
      return cacheAge <= this.cacheValidityDuration;
    } catch {
      return false;
    }
  }
}

// 전역 인스턴스 생성
window.storeCache = new StoreCache();
