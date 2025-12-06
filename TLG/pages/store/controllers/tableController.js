
/**
 * 테이블 Controller - 테이블 관련 비즈니스 로직 및 UI 제어
 */
import { tableService } from '../services/tableService.js';
import { tableStatusView } from '../views/tableStatusView.js';

export const tableController = {
  /**
   * 테이블 정보 로드 및 UI 업데이트
   * @param {Object} store - 매장 객체
   * @param {boolean} forceRefresh - 강제 새로고침 여부
   */
  async loadAndDisplayTableInfo(store, forceRefresh = false) {
    try {
      console.log(`🔍 테이블 정보 로드 시작: ${store.name} (강제새로고침: ${forceRefresh})`);

      // Service를 통해 테이블 정보 조회
      const tableInfo = await tableService.loadTableInfo(store, forceRefresh);

      // View를 통해 UI 업데이트
      tableStatusView.updateTableInfoUI(tableInfo);

      console.log(`✅ 테이블 정보 로드 및 UI 업데이트 완료`);
      return tableInfo;

    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      
      // 에러 상태 UI 업데이트
      const errorInfo = tableService.getErrorData();
      tableStatusView.updateTableInfoUI(errorInfo);
      
      throw error;
    }
  },

  /**
   * 테이블 정보 새로고침
   * @param {Object} store - 매장 객체
   */
  async refreshTableInfo(store) {
    return await this.loadAndDisplayTableInfo(store, true);
  },

  /**
   * 테이블 배치도 조회
   * @param {number} storeId - 매장 ID
   */
  async getTableLayout(storeId) {
    try {
      const tables = await tableService.getTableLayout(storeId);
      return tables;
    } catch (error) {
      console.error('❌ 테이블 배치도 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 테이블 상태 조회
   * @param {number} storeId - 매장 ID
   * @param {number} tableNumber - 테이블 번호
   */
  async getTableStatus(storeId, tableNumber) {
    try {
      const response = await fetch(`/api/pos/${storeId}/table/${tableNumber}/status`);
      
      if (!response.ok) {
        throw new Error('테이블 상태 조회 실패');
      }

      const data = await response.json();
      return data.table;
    } catch (error) {
      console.error(`❌ 테이블 ${tableNumber} 상태 조회 실패:`, error);
      throw error;
    }
  }
};

// 전역 등록
window.tableController = tableController;
