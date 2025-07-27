
// JSON 파일 기반 캐시 매니저
class CacheFileManager {
  constructor() {
    this.cacheFilePath = '/cache/tablelink_cache.json';
  }

  // JSON 파일에서 캐시 데이터 로드
  async loadCacheFromFile() {
    try {
      const response = await fetch(this.cacheFilePath);
      if (response.ok) {
        const cacheData = await response.json();
        console.log('📁 JSON 파일에서 캐시 로드 완료');
        return cacheData;
      } else {
        console.log('⚠️ 캐시 파일이 존재하지 않음');
        return null;
      }
    } catch (error) {
      console.error('❌ 캐시 파일 로드 실패:', error);
      return null;
    }
  }

  // 로컬스토리지와 JSON 파일 동기화
  async syncWithLocalStorage() {
    try {
      // 로컬스토리지에서 현재 캐시 가져오기
      const stores = await window.cacheManager.getStores();
      const userInfo = window.cacheManager.getUserInfo();
      
      // JSON 구조로 변환
      const cacheData = {
        stores: stores,
        userInfo: userInfo || {},
        lastUpdated: new Date().toISOString(),
        cacheVersion: "1.0.0",
        description: "TableLink 애플리케이션 캐시 데이터"
      };

      console.log('🔄 캐시 데이터 동기화 완료');
      return cacheData;
    } catch (error) {
      console.error('❌ 캐시 동기화 실패:', error);
      return null;
    }
  }

  // 캐시 데이터를 JSON 형태로 다운로드
  downloadCacheAsJson() {
    try {
      const cacheJson = window.cacheManager.exportCacheAsJson();
      
      if (cacheJson) {
        const blob = new Blob([cacheJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tablelink_cache_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('💾 캐시 JSON 파일 다운로드 완료');
        return true;
      }
    } catch (error) {
      console.error('❌ 캐시 다운로드 실패:', error);
      return false;
    }
  }

  // JSON 파일에서 캐시 가져오기 (파일 업로드)
  uploadCacheFromJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonString = event.target.result;
          const success = window.cacheManager.importCacheFromJson(jsonString);
          
          if (success) {
            console.log('📥 JSON 파일에서 캐시 업로드 완료');
            resolve(true);
          } else {
            reject(new Error('캐시 가져오기 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file);
    });
  }

  // 캐시 통계 정보 생성
  getCacheStats() {
    try {
      const stores = window.cacheManager.getStores();
      const userInfo = window.cacheManager.getUserInfo();
      const status = window.cacheManager.getCacheStatus();
      
      return {
        storesCount: stores.length,
        hasUserInfo: !!userInfo,
        userId: userInfo?.id || null,
        userOrdersCount: userInfo?.orderList?.length || 0,
        userFavoritesCount: userInfo?.favorites?.length || 0,
        userPoint: userInfo?.point || 0,
        cacheAge: status.cacheAge,
        cacheSize: this.calculateCacheSize(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 캐시 통계 생성 실패:', error);
      return null;
    }
  }

  // 캐시 크기 계산 (대략적)
  calculateCacheSize() {
    try {
      const storesData = localStorage.getItem('tablelink_stores_cache');
      const userData = localStorage.getItem('tablelink_userinfo_cache');
      
      let totalSize = 0;
      if (storesData) totalSize += storesData.length;
      if (userData) totalSize += userData.length;
      
      // 바이트를 KB로 변환
      return Math.round(totalSize / 1024 * 100) / 100;
    } catch (error) {
      return 0;
    }
  }
}

// 전역 캐시 파일 매니저 인스턴스 생성
window.cacheFileManager = new CacheFileManager();

// 개발용 함수들
window.downloadCache = () => window.cacheFileManager.downloadCacheAsJson();
window.getCacheStats = () => window.cacheFileManager.getCacheStats();
window.syncCache = () => window.cacheFileManager.syncWithLocalStorage();
