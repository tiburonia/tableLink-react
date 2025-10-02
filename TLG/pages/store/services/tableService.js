
/**
 * 테이블 Service - 비즈니스 로직 처리
 */
import { tableRepository } from '../repositories/tableRepository.js';

export const tableService = {
  /**
   * 테이블 정보 로드 및 통계 계산
   * @param {Object} store - 매장 객체 (tables 배열 포함)
   * @param {boolean} forceRefresh - true일 경우 API 강제 호출
   */
  async loadTableInfo(store, forceRefresh = false) {
    try {
      console.log(`🔍 매장 ${store.name} (ID: ${store.id}) 테이블 정보 조회 중... (강제새로고침: ${forceRefresh})`);

      // 매장이 운영중지 상태면 기본 데이터 반환
      if (store.isOpen === false) {
        console.log(`🔴 매장 ${store.name}이 운영중지 상태입니다.`);
        return this.getClosedStoreData();
      }

      let tables;

      // 강제 새로고침이 아니면 store 객체의 tables 배열 우선 사용
      if (!forceRefresh && Array.isArray(store.tables) && store.tables.length > 0) {
        console.log(`✅ store 객체에서 ${store.tables.length}개 테이블 데이터 로드 (API 호출 생략)`);
        tables = store.tables;
      } else {
        // 새로고침이거나 store에 tables가 없으면 API 호출
        console.log(`🔄 테이블 API 호출 중...`);
        tables = await tableRepository.fetchTableData(store.id);
      }

      if (tables.length === 0) {
        console.warn(`⚠️ 매장 ${store.name}에 테이블 데이터가 없습니다`);
        return this.getEmptyTableData();
      }

      // 통계 계산
      return this.calculateTableStats(tables, store.name);

    } catch (error) {
      console.error('❌ 테이블 정보 로딩 실패:', error);
      return this.getErrorData();
    }
  },

  /**
   * 테이블 통계 계산
   */
  calculateTableStats(tables, storeName) {
    const totalTables = tables.length;
    const totalSeats = tables.reduce((sum, table) => sum + (table.seats || 4), 0);
    const occupiedTables = tables.filter(t => t.isOccupied === true);
    const availableTables = tables.filter(t => t.isOccupied !== true);
    const occupiedSeats = occupiedTables.reduce((sum, table) => sum + (table.seats || 4), 0);
    const availableSeats = totalSeats - occupiedSeats;
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    console.log(`🏪 ${storeName} 통계:
      - 총 테이블: ${totalTables}개
      - 총 좌석: ${totalSeats}석
      - 사용중 테이블: ${occupiedTables.length}개
      - 빈 테이블: ${availableTables.length}개
      - 사용중 좌석: ${occupiedSeats}석
      - 잔여 좌석: ${availableSeats}석
      - 사용률: ${occupancyRate}%`);

    // 상태 판정
    let statusText = 'OPEN';
    let statusClass = '';
    if (occupancyRate >= 90) {
      statusText = 'FULL';
      statusClass = 'full';
    } else if (occupancyRate >= 70) {
      statusText = 'BUSY';
      statusClass = 'busy';
    } else if (occupancyRate >= 50) {
      statusText = 'NORMAL';
      statusClass = 'normal';
    }

    return {
      totalTables: `${totalTables}개`,
      availableTables: `${availableTables.length}개`,
      totalSeats: `${totalSeats}석`,
      availableSeats: `${availableSeats}석`,
      occupancyRate: `${occupancyRate}`,
      statusText,
      statusClass,
      rawData: { totalTables, availableTables: availableTables.length, totalSeats, availableSeats, occupiedTables: occupiedTables.length }
    };
  },

  /**
   * 운영중지 상태 데이터
   */
  getClosedStoreData() {
    return {
      totalTables: '-',
      availableTables: '-',
      totalSeats: '-',
      availableSeats: '-',
      occupancyRate: '-',
      statusText: '운영중지',
      statusClass: 'closed',
      rawData: { totalTables: 0, availableTables: 0, totalSeats: 0, availableSeats: 0, occupiedTables: 0 }
    };
  },

  /**
   * 빈 테이블 데이터
   */
  getEmptyTableData() {
    return {
      totalTables: '0개',
      availableTables: '0개',
      totalSeats: '0석',
      availableSeats: '0석',
      occupancyRate: '0',
      statusText: 'NO TABLES',
      statusClass: 'empty',
      rawData: { totalTables: 0, availableTables: 0, totalSeats: 0, availableSeats: 0, occupiedTables: 0 }
    };
  },

  /**
   * 에러 상태 데이터
   */
  getErrorData() {
    return {
      totalTables: '오류',
      availableTables: '오류',
      totalSeats: '오류',
      availableSeats: '오류',
      occupancyRate: '오류',
      statusText: 'ERROR',
      statusClass: 'error',
      rawData: { totalTables: 0, availableTables: 0, totalSeats: 0, availableSeats: 0, occupiedTables: 0 }
    };
  }
};
