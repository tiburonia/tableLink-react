
// POS 임시저장 관리 모듈
import { POSStateManager } from './posStateManager.js';

export class POSTempStorage {
  // 임시저장 함수
  static saveTempOrder() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();
    const currentOrder = POSStateManager.getCurrentOrder();
    
    if (!currentTable || !currentStore || !currentOrder) return;

    try {
      const tempOrderKey = `temp_order_${currentStore.id}_${currentTable}`;
      const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);
      const sessionItems = currentOrder.filter(item => item.isConfirmed);

      const tempOrderData = {
        tableNumber: currentTable,
        storeId: currentStore.id,
        pendingItems: pendingItems,
        sessionStatus: {
          hasActiveSession: sessionItems.length > 0,
          sessionItemCount: sessionItems.length,
          sessionId: sessionItems[0]?.sessionId || null
        },
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(tempOrderKey, JSON.stringify(tempOrderData));
      console.log(`💾 임시 주문 세션 저장: 테이블 ${currentTable}, 임시: ${pendingItems.length}개, 세션: ${sessionItems.length}개`);

    } catch (error) {
      console.error('❌ 임시 주문 저장 실패:', error);
    }
  }

  // 임시저장 데이터 로드
  static loadTempOrder() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();
    
    if (!currentTable || !currentStore) return [];

    try {
      const tempOrderKey = `temp_order_${currentStore.id}_${currentTable}`;
      const savedData = localStorage.getItem(tempOrderKey);

      if (savedData) {
        const tempOrderData = JSON.parse(savedData);
        const timeDiff = Date.now() - new Date(tempOrderData.lastModified).getTime();

        // 1시간 이내 데이터만 복구
        if (timeDiff < 60 * 60 * 1000) {
          const pendingItems = tempOrderData.pendingItems || tempOrderData.items || [];
          console.log(`🔄 임시 주문 복구: 테이블 ${currentTable}, 세션 상태:`, tempOrderData.sessionStatus);
          return pendingItems;
        } else {
          // 오래된 데이터 삭제
          localStorage.removeItem(tempOrderKey);
          console.log(`🗑️ 만료된 임시 주문 삭제: 테이블 ${currentTable}`);
        }
      }

      console.log(`📭 저장된 임시 주문 없음`);
      return [];

    } catch (error) {
      console.error('❌ 임시 주문 로드 실패:', error);
      return [];
    }
  }

  // 임시저장 데이터 삭제
  static clearTempOrder() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();
    
    if (!currentTable || !currentStore) return;

    try {
      const tempOrderKey = `temp_order_${currentStore.id}_${currentTable}`;
      localStorage.removeItem(tempOrderKey);
      console.log(`🗑️ 임시 주문 데이터 삭제: 테이블 ${currentTable}`);

    } catch (error) {
      console.error('❌ 임시 주문 삭제 실패:', error);
    }
  }
}
