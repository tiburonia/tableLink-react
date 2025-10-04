/**
 * TLL Service - 비즈니스 로직
 */

import { tllRepository } from '../repositories/tllRepository.js';

export const tllService = {
  /**
   * 매장 검색 및 필터링
   */
  async searchStores(query) {
    try {
      const data = await tllRepository.searchStores(query);
      
      if (data.success && data.stores) {
        // 영업중인 매장만 필터링
        const openStores = data.stores.filter(store => store.isOpen === true);
        console.log(`📊 검색 결과: 전체 ${data.stores.length}개, 영업중 ${openStores.length}개`);
        return openStores;
      }
      
      return [];
    } catch (error) {
      console.error('❌ 매장 검색 처리 실패:', error);
      return [];
    }
  },

  /**
   * 매장 정보 조회 및 정규화
   */
  async getStoreInfo(storeId, storeName) {
    try {
      const normalizedStoreId = parseInt(storeId);

      if (!normalizedStoreId || !storeName) {
        throw new Error('유효하지 않은 매장 정보');
      }

      // 매장 정보 조회
      const storeData = await tllRepository.getStoreInfo(normalizedStoreId);
      
      if (storeData.success && storeData.store) {
        return {
          ...storeData.store,
          id: normalizedStoreId,
          store_id: normalizedStoreId
        };
      }

      // 기본값 반환
      return {
        id: normalizedStoreId,
        store_id: normalizedStoreId,
        name: storeName,
        menu: [],
        isOpen: true,
        category: '기타',
        address: '주소 정보 없음'
      };
    } catch (error) {
      console.error('❌ 매장 정보 처리 실패:', error);
      
      // 에러시 기본값 반환
      return {
        id: parseInt(storeId),
        store_id: parseInt(storeId),
        name: storeName,
        menu: [],
        isOpen: true
      };
    }
  },

  /**
   * 테이블 정보 조회 및 분류
   */
  async getTables(storeId) {
    try {
      const data = await tllRepository.getTables(storeId);
      const tables = data.tables || [];

      if (tables.length === 0) {
        // 기본 5개 테이블 반환
        console.warn(`⚠️ 테이블 정보 없음, 기본 5개 테이블 사용`);
        return this.getDefaultTables();
      }

      // 사용 가능/점유중 테이블 분리
      const availableTables = tables.filter(table => !table.isOccupied);
      const occupiedTables = tables.filter(table => table.isOccupied);

      console.log(`📊 테이블 현황 - 사용가능: ${availableTables.length}개, 사용중: ${occupiedTables.length}개`);

      return {
        available: availableTables,
        occupied: occupiedTables,
        all: tables
      };
    } catch (error) {
      console.error('❌ 테이블 정보 처리 실패:', error);
      return this.getDefaultTables();
    }
  },

  /**
   * 기본 테이블 옵션 생성
   */
  getDefaultTables() {
    const defaultTables = Array.from({ length: 5 }, (_, i) => ({
      tableNumber: i + 1,
      tableName: `${i + 1}번`,
      isOccupied: false
    }));

    return {
      available: defaultTables,
      occupied: [],
      all: defaultTables
    };
  },

  /**
   * 테이블 옵션 HTML 생성
   */
  generateTableOptions(tables) {
    const availableOptions = tables.available.map(table => 
      `<option value="${table.tableNumber}">${table.tableName || table.tableNumber + '번'}</option>`
    );

    const occupiedOptions = tables.occupied.map(table => {
      const occupiedTime = table.occupiedSince ? 
        ` (${new Date(table.occupiedSince).toLocaleTimeString()}부터)` : '';
      return `<option value="${table.tableNumber}" disabled>${table.tableName || table.tableNumber + '번'} - 사용중${occupiedTime}</option>`;
    });

    return [
      '<option value="">테이블을 선택하세요</option>',
      ...availableOptions,
      ...occupiedOptions
    ].join('');
  },

  /**
   * 주문 시작 검증
   */
  validateOrderStart(selectedStore, tableValue) {
    if (!selectedStore) {
      return { valid: false, message: '매장을 선택해주세요.' };
    }

    if (!tableValue) {
      return { valid: false, message: '테이블을 선택해주세요.' };
    }

    return { valid: true };
  }
};
