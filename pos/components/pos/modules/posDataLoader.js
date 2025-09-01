
// POS 데이터 로딩 모듈
import { POSStateManager } from './posStateManager.js';

export class POSDataLoader {
  // 매장 정보 로드
  static async loadStore(storeId) {
    const response = await fetch(`/api/stores/${storeId}`);
    const storeData = await response.json();

    if (!storeData.success) {
      throw new Error('매장 정보를 불러올 수 없습니다.');
    }

    return storeData;
  }

  // 매장 메뉴 로드
  static async loadStoreMenus(storeId) {
    try {
      const response = await fetch(`/api/pos/stores/${storeId}/menu`);
      const data = await response.json();

      if (data.success) {
        const menus = data.menu || [];
        POSStateManager.setAllMenus(menus);
        
        const categorySet = new Set(['전체']);
        menus.forEach(item => {
          if (item.category) {
            categorySet.add(item.category);
          }
        });
        
        POSStateManager.setCategories(Array.from(categorySet));
        console.log(`📋 메뉴 ${menus.length}개 로드`);
      }
    } catch (error) {
      console.error('❌ 메뉴 로드 실패:', error);
      POSStateManager.setAllMenus([]);
      POSStateManager.setCategories(['전체']);
    }
  }

  // 매장 테이블 로드
  static async loadStoreTables(storeId) {
    try {
      const response = await fetch(`/api/tables/stores/${storeId}`);
      const data = await response.json();

      if (data.success) {
        const tables = data.tables || [];
        POSStateManager.setAllTables(tables);
        console.log(`🪑 테이블 ${tables.length}개 로드`);
      } else {
        throw new Error('테이블 데이터 로드 실패');
      }
    } catch (error) {
      console.error('❌ 테이블 로드 실패:', error);
      POSStateManager.setAllTables([]);
    }
  }
      const response = await fetch(`/api/pos/stores/${storeId}/tables`);
      const data = await response.json();

      if (data.success) {
        POSStateManager.setAllTables(data.tables || []);
        console.log(`🪑 테이블 ${data.tables?.length || 0}개 로드`);
      }
    } catch (error) {
      console.error('❌ 테이블 로드 실패:', error);
      POSStateManager.setAllTables([]);
    }
  }

  // 테이블 주문 로드
  static async loadTableOrders(tableNumber, storeId) {
    try {
      const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/all-orders`);
      const data = await response.json();

      if (data.success && data.currentSession && data.currentSession.items) {
        // 세션에 저장된 주문들을 메뉴별로 통합
        const consolidatedItems = {};

        data.currentSession.items.forEach(item => {
          const key = `${item.menuName}_${item.price}`;
          if (consolidatedItems[key]) {
            consolidatedItems[key].quantity += parseInt(item.quantity);
          } else {
            consolidatedItems[key] = {
              id: `session_${item.id}`,
              name: item.menuName,
              price: parseInt(item.price),
              quantity: parseInt(item.quantity),
              discount: 0,
              note: '',
              isConfirmed: true,
              isPending: false,
              sessionId: data.currentSession.orderId,
              cookingStatus: item.cookingStatus || 'PENDING'
            };
          }
        });

        return Object.values(consolidatedItems);
      }

      return [];
    } catch (error) {
      console.error('❌ 주문 로드 실패:', error);
      return [];
    }
  }
}
