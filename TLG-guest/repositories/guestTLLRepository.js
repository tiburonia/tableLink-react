
/**
 * 비회원 TLL Repository
 */
export const guestTLLRepository = {
  /**
   * 매장 검색
   */
  async searchStores(keyword) {
    const response = await fetch(`/api/stores/search?q=${encodeURIComponent(keyword)}`);
    if (!response.ok) throw new Error('매장 검색 실패');
    return await response.json();
  },

  /**
   * 매장 정보 조회
   */
  async getStoreInfo(storeId) {
    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) throw new Error('매장 정보 조회 실패');
    return await response.json();
  },

  /**
   * 테이블 목록 조회
   */
  async getStoreTables(storeId) {
    const response = await fetch(`/api/stores/${storeId}/tables`);
    if (!response.ok) throw new Error('테이블 목록 조회 실패');
    return await response.json();
  },

  /**
   * QR 주문 세션 생성 (비회원)
   */
  async createGuestSession(storeId, tableNumber, guestPhone) {
    const response = await fetch('/api/tll/checks/from-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qr_code: `TABLE_${tableNumber}`,
        guest_phone: guestPhone
      })
    });
    
    if (!response.ok) throw new Error('세션 생성 실패');
    return await response.json();
  }
};
