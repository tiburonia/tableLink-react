// POS 테이블 관리 모듈
import { POSStateManager } from './posStateManager.js';
import { POSDataLoader } from './posDataLoader.js';

export class POSTableManager {
  // 테이블맵 렌더링
  static async renderTableMap() {
    const tableMapGrid = document.getElementById('tableMapGrid');
    if (!tableMapGrid) return;

    const allTables = POSStateManager.getAllTables();
    const currentStore = POSStateManager.getCurrentStore();

    if (allTables.length === 0) {
      tableMapGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 60px; font-size: 16px;">
          <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🪑</div>
          <p>테이블 정보가 없습니다.</p>
        </div>
      `;
      return;
    }

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
        case 'ordering':
          statusText = '주문 중';
          break;
        case 'payment':
          statusText = '결제 대기';
          break;
      }

      return `
        <button class="table-item ${table.status}" onclick="selectTableFromMap(${table.tableNumber})" data-table-number="${table.tableNumber}">
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
  }

  // 테이블 선택
  static async selectTable(tableNumber) {
    POSStateManager.setCurrentTable(tableNumber);
    POSStateManager.setSelectedItems([]);
    console.log(`🪑 테이블 ${tableNumber} 선택`);
  }
}

// Helper function to be called from HTML onclick attribute
function selectTableFromMap(tableElement) {
  const tableNumber = tableElement.dataset.tableNumber || tableElement;
  POSTableManager.selectTable(tableNumber);
}