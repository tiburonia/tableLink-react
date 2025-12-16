
/**
 * 테이블 Repository - API 호출 전용
 */
export const tableRepository = {
  /**
   * 매장의 테이블 정보 조회
   */
  async fetchTableData(storeId) {
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
      throw new Error(`테이블 조회 실패: ${data.error || '알 수 없는 오류'}`);
    }

    return data.tables || [];
  },

  /**
   * 테이블 배치도 정보 조회
   */
  async fetchTableLayout(storeId) {
    const response = await fetch(`/api/stores/${storeId}/tables?_t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error('테이블 정보 조회 실패');
    }

    const data = await response.json();
    return data.tables || [];
  }
};
