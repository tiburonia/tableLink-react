/**
 * TLL Repository - API 호출
 */

export const tllRepository = {
  /**
   * 매장 검색
   */
  async searchStores(query) {
    try {
      console.log(`🔍 매장 검색 API 호출: "${query}"`);
      
      const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}&limit=20`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('검색 실패');
      }

      const data = await response.json();
      console.log(`✅ 매장 검색 결과: ${data.stores?.length || 0}개`);
      
      return data;
    } catch (error) {
      console.error('❌ 매장 검색 API 실패:', error);
      throw error;
    }
  },

  /**
   * 매장 정보 조회
   */
  async getStoreInfo(storeId) {
    try {
      console.log(`🔍 매장 ${storeId} 기본 정보 조회 중...`);
      
      const response = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('매장 정보 조회 실패');
      }

      const data = await response.json();
      console.log(`✅ 매장 기본 정보 로드 완료: ${data.store?.name}`);
      
      return data;
    } catch (error) {
      console.error('❌ 매장 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 테이블 정보 조회
   */
  async getTables(storeId) {
    try {
      console.log(`🪑 매장 ${storeId} 테이블 정보 조회 중...`);
      
      const response = await fetch(`/api/tables/stores/${storeId}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`테이블 API 오류 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`테이블 조회 실패: ${data.error}`);
      }

      console.log(`✅ 테이블 ${data.tables?.length || 0}개 로드 완료`);
      return data;
    } catch (error) {
      console.error('❌ 테이블 정보 조회 실패:', error);
      throw error;
    }
  }
};
