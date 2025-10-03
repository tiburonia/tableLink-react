export const OrderRepository = {
  async loadStoreMenu(storeId) {
    console.log(`🔄 매장 ${storeId} 메뉴 데이터 로드 중...`);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/menu/tll`);
      
      if (!response.ok) {
        console.warn('⚠️ 메뉴 API 호출 실패:', response.status);
        return { success: false, menu: [] };
      }
      
      const result = await response.json();
      console.log('📋 메뉴 API 응답:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 메뉴 로드 API 오류:', error);
      return { success: false, menu: [], error: error.message };
    }
  }
};
