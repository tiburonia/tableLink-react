
// POS 테이블 관리 모듈
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';

export class POSTableManager {
  // 테이블맵 렌더링
  static async renderTableMap() {
    const tableMapContainer = document.getElementById('tableMapContainer');
    if (!tableMapContainer) {
      console.warn('❌ tableMapContainer 요소를 찾을 수 없습니다.');
      return;
    }

    let allTables = POSStateManager.getAllTables();
    
    // 전역 window.allTables도 확인
    if (allTables.length === 0 && window.allTables) {
      allTables = window.allTables;
      POSStateManager.setAllTables(allTables);
    }

    console.log(`🪑 테이블맵 렌더링: ${allTables.length}개 테이블`);

    if (allTables.length === 0) {
      tableMapContainer.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 60px; font-size: 16px;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🪑</div>
          <p>테이블 정보를 불러오는 중...</p>
        </div>
      `;
      
      // 테이블 정보 다시 로드 시도
      try {
        const currentStore = POSStateManager.getCurrentStore();
        if (currentStore) {
          const { POSDataLoader } = await import('./posDataLoader.js');
          allTables = await POSDataLoader.loadStoreTables(currentStore.id);
          if (allTables.length > 0) {
            this.renderTableMap(); // 재귀 호출
          }
        }
      } catch (error) {
        console.error('❌ 테이블 재로드 실패:', error);
      }
      return;
    }

    // 테이블맵 그리드 생성
    tableMapContainer.innerHTML = `
      <div class="table-map-header">
        <h3>테이블 현황</h3>
        <div class="table-stats">
          <span id="activeTables">0/${allTables.length}</span>
        </div>
      </div>
      <div id="tableMapGrid" class="table-map-grid"></div>
    `;

    const tableMapGrid = document.getElementById('tableMapGrid');

    const tableStatuses = await Promise.all(
      allTables.map(async (table) => {
        try {
          // 간단한 상태 체크로 변경
          if (table.isOccupied) {
            return { ...table, status: 'occupied' };
          } else {
            return { ...table, status: 'available' };
          }
        } catch (error) {
          return { ...table, status: 'available' };
        }
      })
    );

    const tablesHTML = tableStatuses.map(table => {
      let statusText = '빈 자리';
      let timeText = '';

      switch (table.status) {
        case 'occupied':
          statusText = '사용 중';
          break;
        case 'ordering':
          statusText = '주문 중';
          break;
        case 'payment':
          statusText = '결제 대기';
          break;
      }

      return `
        <button class="table-item ${table.status}" 
                onclick="window.selectTableFromMap('${table.tableNumber}')" 
                data-table-number="${table.tableNumber}">
          <div class="table-number">T${table.tableNumber}</div>
          <div class="table-status">${statusText}</div>
          ${timeText ? `<div class="table-time">${timeText}</div>` : ''}
        </button>
      `;
    }).join('');

    tableMapGrid.innerHTML = tablesHTML;

    const activeTables = tableStatuses.filter(t => t.status !== 'available').length;
    const activeTablesElement = document.getElementById('activeTables');
    if (activeTablesElement) {
      activeTablesElement.textContent = `${activeTables}/${allTables.length}`;
    }

    console.log(`✅ 테이블맵 렌더링 완료: ${allTables.length}개 테이블, ${activeTables}개 사용중`);
  }

  // 테이블 선택
  static async selectTable(tableNumber) {
    console.log(`🪑 POSTableManager.selectTable 호출: ${tableNumber}`);
    
    POSStateManager.setCurrentTable(tableNumber);
    POSStateManager.setSelectedItems([]);
    
    console.log(`✅ 테이블 ${tableNumber} 선택 완료`);
  }

  // 테이블 상태 업데이트
  static async updateTableStatus(tableNumber, status) {
    try {
      const currentStore = POSStateManager.getCurrentStore();
      if (!currentStore) {
        throw new Error('현재 매장 정보가 없습니다.');
      }

      const response = await fetch('/api/tables/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          tableNumber: tableNumber,
          isOccupied: status === 'occupied'
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      console.log(`✅ 테이블 ${tableNumber} 상태 업데이트: ${status}`);
      return data;

    } catch (error) {
      console.error('❌ 테이블 상태 업데이트 실패:', error);
      throw error;
    }
  }
}
