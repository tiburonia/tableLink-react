/**
 * Store Lifecycle Service
 * 매장 초기화 및 라이프사이클 관련 비즈니스 로직
 */

export const storeLifecycleService = {
  /**
   * 매장 추가 정보 로드
   * @param {Object} store - 매장 객체
   * @returns {Promise<Object>} 추가 정보 객체
   */
  async loadStoreAdditionalInfo(store) {
    try {
      const { storeInfoService } = await import('./storeInfoService.js');
      const additionalInfo = await storeInfoService.getStoreAdditionalInfo(store);
      console.log('✅ 매장 추가 정보 로드 완료');
      return additionalInfo;
    } catch (error) {
      console.error('❌ 매장 추가 정보 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 공지사항 로드
   * @param {Object} store - 매장 객체
   * @returns {Promise<Array>} 공지사항 배열
   */
  async loadStoreNotices(store) {
    try {
      const { storeInfoService } = await import('./storeInfoService.js');
      const notices = await storeInfoService.getStoreNotices(store);
      console.log('✅ 공지사항 로드 완료');
      return notices;
    } catch (error) {
      console.error('❌ 공지사항 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 테이블 정보 로드
   * @param {Object} store - 매장 객체
   * @param {boolean} forceRefresh - 강제 새로고침 여부
   * @returns {Promise<Object>} 테이블 정보 객체
   */
  async loadTableInfo(store, forceRefresh = false) {
    try {
      const { tableService } = await import('./tableService.js');
      const tableInfo = await tableService.loadTableInfo(store, forceRefresh);
      console.log('✅ 테이블 정보 로드 완료');
      return tableInfo;
    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 매장 데이터 페칭 (storeService 위임)
   * @param {string} storeId - 매장 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 표준화된 매장 데이터
   */
  async fetchStoreData(storeId, userId) {
    try {
      console.log(`🔍 매장 ${storeId} 데이터 요청 시작`);
      const { storeService } = await import('./storeService.js');
      const storeData = await storeService.fetchStoreData(storeId, userId);
      console.log(`✅ 매장 ${storeId} 데이터 로드 완료`);
      return storeData;
    } catch (error) {
      console.error(`❌ 매장 ${storeId} 데이터 조회 실패:`, error);
      throw error;
    }
  },

  /**
   * 매장 초기 로드 시퀀스 (추가 정보 + 공지사항)
   * @param {Object} store - 매장 객체
   * @returns {Promise<Object>} { additionalInfo, notices }
   */
  async initializeStoreData(store) {
    try {
      const [additionalInfo, notices] = await Promise.all([
        this.loadStoreAdditionalInfo(store),
        this.loadStoreNotices(store)
      ]);

      return { additionalInfo, notices };
    } catch (error) {
      console.error('❌ 매장 데이터 초기화 실패:', error);
      throw error;
    }
  }
};
