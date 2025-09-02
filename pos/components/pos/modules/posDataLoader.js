// POS 데이터 로더 모듈 - 새 스키마 적용
export class POSDataLoader {
  // 🚀 초기 데이터 로드 (통합 함수)
  static async loadInitialData() {
    try {
      console.log('🚀 POS 초기 데이터 로드 시작');

      // URL에서 storeId 추출
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('storeId');

      if (!storeId) {
        throw new Error('매장 ID가 제공되지 않았습니다');
      }

      console.log(`🏪 매장 ID: ${storeId}`);

      // 상태 관리자 import
      const { POSStateManager } = await import('./posStateManager.js');

      // 1. 매장 정보 로드
      const storeData = await this.loadStore(storeId);
      POSStateManager.setCurrentStore(storeData.store);

      // 2. 매장 메뉴 로드
      const menus = await this.loadStoreMenus(storeId);
      console.log(`📋 로드된 메뉴 수: ${menus.length}`);

      // 3. 테이블 정보 로드
      const tables = await this.loadStoreTables(storeId);
      console.log(`🪑 로드된 테이블 수: ${tables.length}`);

      // 4. 매장 정보 표시 업데이트
      this.updateStoreInfoDisplay(storeData.store);

      console.log('✅ POS 초기 데이터 로드 완료');

    } catch (error) {
      console.error('❌ POS 초기 데이터 로드 실패:', error);
      throw error;
    }
  }

  // 🏪 매장 정보 표시 업데이트
  static updateStoreInfoDisplay(store) {
    const storeInfoElement = document.getElementById('storeInfo');
    if (storeInfoElement) {
      storeInfoElement.textContent = `${store.name} | ${store.region_name || '지역정보없음'}`;
    }

    // 활성 테이블 정보 업데이트
    const activeTablesElement = document.getElementById('activeTables');
    if (activeTablesElement) {
      const allTables = POSStateManager.getAllTables();
      const occupiedTables = allTables.filter(table => table.is_occupied || table.isOccupied);
      activeTablesElement.textContent = `${occupiedTables.length}/${allTables.length}`;
    }
  }

  // 매장 정보 로드 (새 스키마)
  static async loadStore(storeId) {
    try {
      console.log(`🏪 매장 ${storeId} 정보 로드 시작`);

      const response = await fetch(`/api/stores/${storeId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '매장 정보 조회 실패');
      }

      console.log(`✅ 매장 ${storeId} 정보 로드 완료: ${data.store.name}`);
      return { store: data.store };

    } catch (error) {
      console.error('❌ 매장 정보 로드 실패:', error);
      throw error;
    }
  }

  // 매장 메뉴 전체 로드 (상태 관리용)
  static async loadStoreMenus(storeId) {
    try {
      console.log(`📋 매장 ${storeId} 전체 메뉴 로드 시작`);

      const response = await fetch(`/api/pos/stores/${storeId}/menu`);
      const data = await response.json();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`메뉴 조회 HTTP 오류: ${response.status} - ${errorText}`);
      }

      if (!data.success) {
        throw new Error(data.error || '메뉴 조회 실패');
      }

      // 메뉴 데이터 null/undefined 체크 (menu 또는 menus 필드 모두 처리)
      const menuData = data.menu || data.menus || [];

      console.log(`📋 메뉴 데이터 확인:`, { 
        hasMenuField: !!data.menu, 
        hasMenusField: !!data.menus, 
        menuDataType: typeof menuData,
        isArray: Array.isArray(menuData),
        length: menuData.length 
      });

      if (!Array.isArray(menuData)) {
        console.warn('⚠️ 메뉴 데이터가 배열이 아님, 빈 배열로 설정');
        const emptyMenus = [];

        // 상태 관리자에 빈 메뉴 저장
        const { POSStateManager } = await import('./posStateManager.js');
        POSStateManager.setAllMenus(emptyMenus);
        POSStateManager.setCategories(['전체']);

        return emptyMenus;
      }

      // 상태 관리자에 메뉴 저장
      const { POSStateManager } = await import('./posStateManager.js');
      POSStateManager.setAllMenus(menuData);

      // 카테고리 추출 (안전한 방식)
      const categories = ['전체'];
      if (menuData.length > 0) {
        const categorySet = new Set(
          menuData
            .map(m => m && m.category)
            .filter(cat => cat && typeof cat === 'string' && cat.trim() !== '')
        );
        categories.push(...Array.from(categorySet));
      }
      POSStateManager.setCategories(categories);

      console.log(`✅ 매장 ${storeId} 메뉴 ${menuData.length}개, 카테고리 ${categories.length}개 로드 완료`);
      return menuData;

    } catch (error) {
      console.error('❌ 매장 메뉴 로드 실패:', error);
      return [];
    }
  }

  // 매장 테이블 정보 로드 (새 스키마)
  static async loadStoreTables(storeId) {
    try {
      console.log(`🪑 매장 ${storeId} 테이블 정보 로드 시작`);

      const response = await fetch(`/api/tables/stores/${storeId}`);

      // HTTP 오류 체크
      if (!response.ok) {
        console.warn(`⚠️ 테이블 API HTTP 오류 (${response.status}), 기본 테이블 생성`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.warn(`⚠️ 매장 ${storeId} 테이블 정보 없음, 기본 테이블 생성`);
        throw new Error(data.error || '테이블 정보 없음');
      }

      // 상태 관리자에 테이블 저장
      const { POSStateManager } = await import('./posStateManager.js');
      POSStateManager.setAllTables(data.tables);

      console.log(`✅ 매장 ${storeId} 테이블 ${data.tables.length}개 로드 완료`);
      return data.tables;

    } catch (error) {
      console.error('❌ 매장 테이블 로드 실패:', error);

      // 오류 시 기본 테이블 반환
      const defaultTables = Array.from({ length: 20 }, (_, i) => ({
        table_number: i + 1,
        is_occupied: false,
        occupied_by: null,
        occupied_at: null
      }));

      const { POSStateManager } = await import('./posStateManager.js');
      POSStateManager.setAllTables(defaultTables);

      return defaultTables;
    }
  }
  // 테이블 주문 로드 (새 스키마)
  static async loadTableOrders(tableNumber, storeId) {
    try {
      console.log(`📊 테이블 ${tableNumber} 주문 로드 시작 (새 스키마)`);

      const response = await fetch(`/api/pos/stores/${storeId}/table/${tableNumber}/all-orders`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '주문 조회 실패');
      }

      if (!data.currentSession || !data.currentSession.items) {
        console.log(`📭 테이블 ${tableNumber} 활성 세션 없음`);
        return [];
      }

      const sessionOrders = (data.currentSession?.items || []).map(item => ({
        id: item.id,
        name: item.menuName,
        price: item.price,
        quantity: item.quantity,
        discount: 0,
        notes: item.notes || item.kitchen_notes || '',
        status: item.cookingStatus || 'ordered',
        isConfirmed: true,
        isPending: false,
        checkId: data.currentSession.checkId,
        confirmedAt: item.created_at
      }));

      console.log(`✅ 테이블 ${tableNumber} 세션 주문 ${sessionOrders.length}개 로드 완료`);
      return sessionOrders;

    } catch (error) {
      console.error('❌ 테이블 주문 로드 실패:', error);
      return [];
    }
  }

  // 매장 메뉴 로드 (새 스키마)
  static async loadStoreMenu(storeId) {
    try {
      console.log(`📋 매장 ${storeId} 메뉴 로드 시작`);

      const response = await fetch(`/api/pos/stores/${storeId}/menu`);
      const data = await response.json();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`메뉴 조회 HTTP 오류: ${response.status} - ${errorText}`);
      }

      if (!data.success) {
        throw new Error(data.error || '메뉴 조회 실패');
      }

      console.log(`✅ 매장 ${storeId} 메뉴 ${data.menu.length}개 로드 완료`);
      return data.menu;

    } catch (error) {
      console.error('❌ 매장 메뉴 로드 실패:', error);
      return [];
    }
  }

  // 체크 요약 정보 로드 (새 스키마)
  static async loadCheckSummary(checkId) {
    try {
      console.log(`📊 체크 ${checkId} 요약 로드 시작`);

      const response = await fetch(`/api/pos/checks/${checkId}/summary`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '체크 요약 조회 실패');
      }

      console.log(`✅ 체크 ${checkId} 요약 로드 완료`);
      return data;

    } catch (error) {
      console.error('❌ 체크 요약 로드 실패:', error);
      return null;
    }
  }

  // 세션 상태 확인 (새 스키마)
  static async validateTableSession(tableNumber, storeId) {
    try {
      console.log(`🔍 테이블 ${tableNumber} 세션 검증 시작`);

      const response = await fetch(`/api/stores/${storeId}/table/${tableNumber}/session-status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '세션 상태 확인 실패');
      }

      console.log(`✅ 테이블 ${tableNumber} 세션 검증 완료:`, data.hasActiveSession ? '활성 세션 있음' : '세션 없음');

      return {
        canAddItems: true,
        hasActiveSession: data.hasActiveSession,
        sessionInfo: data.sessionInfo,
        message: 'OK'
      };

    } catch (error) {
      console.error('❌ 세션 검증 실패:', error);
      return {
        canAddItems: false,
        hasActiveSession: false,
        sessionInfo: null,
        message: error.message
      };
    }
  }

  // 아이템 상태 변경 (새 스키마)
  static async updateItemStatus(itemId, status, notes = null) {
    try {
      console.log(`🔄 아이템 ${itemId} 상태 변경: ${status}`);

      const requestBody = { status };
      if (notes) {
        requestBody.notes = notes;
      }

      const response = await fetch(`/api/pos/check-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '아이템 상태 변경 실패');
      }

      console.log(`✅ 아이템 ${itemId} 상태 변경 완료: ${status}`);
      return data;

    } catch (error) {
      console.error('❌ 아이템 상태 변경 실패:', error);
      throw error;
    }
  }

  // 아이템 취소 (새 스키마)
  static async cancelItem(itemId, reason = 'POS 취소') {
    try {
      console.log(`❌ 아이템 ${itemId} 취소 요청`);

      const response = await fetch(`/api/pos/check-items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '아이템 취소 실패');
      }

      console.log(`✅ 아이템 ${itemId} 취소 완료`);
      return data;

    } catch (error) {
      console.error('❌ 아이템 취소 실패:', error);
      throw error;
    }
  }
}