
/**
 * 비회원 TLL Service
 */
import { guestTLLRepository } from '../repositories/guestTLLRepository.js';

export const guestTLLService = {
  /**
   * 매장 검색
   */
  async searchStores(keyword) {
    if (!keyword || keyword.trim().length < 1) {
      return [];
    }

    const result = await guestTLLRepository.searchStores(keyword.trim());
    return result.stores || [];
  },

  /**
   * 매장 정보 조회
   */
  async getStoreInfo(storeId) {
    const result = await guestTLLRepository.getStoreInfo(storeId);
    
    if (!result.success) {
      throw new Error('매장 정보를 불러올 수 없습니다');
    }

    return result.store;
  },

  /**
   * 테이블 목록 조회
   */
  async getAvailableTables(storeId) {
    const result = await guestTLLRepository.getStoreTables(storeId);
    
    if (!result.success) {
      throw new Error('테이블 정보를 불러올 수 없습니다');
    }

    return result.tables || [];
  },

  /**
   * 주문 시작 (전화번호 입력 후)
   */
  async startGuestOrder(storeId, tableNumber, guestPhone) {
    // 전화번호 유효성 검사
    const phoneRegex = /^010[0-9]{8}$/;
    if (!phoneRegex.test(guestPhone)) {
      throw new Error('올바른 전화번호를 입력해주세요 (예: 01012345678)');
    }

    const result = await guestTLLRepository.createGuestSession(storeId, tableNumber, guestPhone);
    
    if (!result.success) {
      throw new Error('주문 세션 생성 실패');
    }

    return {
      checkId: result.check_id,
      orderId: result.order_id,
      storeId: result.store_id,
      tableNumber: result.table_number
    };
  }
};
