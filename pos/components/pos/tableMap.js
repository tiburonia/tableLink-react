
// 테이블 맵 관리 모듈

// 테이블 맵 렌더링
function renderTableMap() {
  const mapGrid = document.getElementById('mapGrid');

  if (!window.allTables || window.allTables.length === 0) {
    mapGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #64748b; margin-top: 50px;">
        테이블 정보를 불러오는 중...
      </div>
    `;
    return;
  }

  mapGrid.innerHTML = window.allTables.map(table => {
    const status = table.isOccupied ? 'occupied' : 'available';
    const statusText = table.isOccupied ? '사용중' : '이용가능';
    const occupiedTime = table.isOccupied && table.occupiedSince 
      ? getTimeDifferenceText(table.occupiedSince) 
      : '';

    return `
      <div class="table-item ${status}" onclick="selectTableFromMap('${table.tableNumber}')">
        <div class="table-number">T${table.tableNumber}</div>
        <div class="table-info">${table.seats}석</div>
        <div class="table-badges">
          <div class="badge ${status === 'occupied' ? 'timer' : 'amount'}">${statusText}</div>
          ${occupiedTime ? `<div class="badge timer">${occupiedTime}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 테이블 맵에서 테이블 선택
function selectTableFromMap(tableNumber) {
  // 기존 선택 해제
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });

  // 새로운 선택
  event.target.closest('.table-item').classList.add('selected');
  window.currentTable = tableNumber;

  // 세부 패널 업데이트
  updateDetailPanel(tableNumber);
}

// 시간 차이 텍스트 반환
function getTimeDifferenceText(occupiedSince) {
  const now = new Date();
  const occupied = new Date(occupiedSince);
  const diffMinutes = Math.floor((now - occupied) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}시간 ${diffMinutes % 60}분 전`;
}

// 테이블 점유 기능
async function occupyTable(tableNumber) {
  try {
    console.log(`🔒 [POS] 테이블 ${tableNumber} 점유 요청`);

    const response = await fetch('/api/tables/occupy-manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        duration: 0
      })
    });

    const data = await response.json();

    if (data.success) {
      showPOSNotification(`테이블 ${tableNumber}이 점유 상태로 변경되었습니다.`, 'success');
      await window.loadTables();
      renderTableMap();
      updateDetailPanel(tableNumber);
    } else {
      showPOSNotification('오류: ' + data.error, 'error');
    }

  } catch (error) {
    console.error('❌ [POS] 테이블 점유 실패:', error);
    showPOSNotification('테이블 점유 요청 실패', 'error');
  }
}

// 테이블 해제 기능
async function releaseTable(tableNumber) {
  try {
    console.log(`🔓 [POS] 테이블 ${tableNumber} 해제 요청`);

    const response = await fetch('/api/tables/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: window.currentStore.id,
        tableName: `테이블 ${tableNumber}`,
        isOccupied: false
      })
    });

    const data = await response.json();

    if (data.success) {
      showPOSNotification(`테이블 ${tableNumber}이 해제되었습니다.`, 'success');
      await window.loadTables();
      renderTableMap();
      updateDetailPanel(tableNumber);
    } else {
      showPOSNotification('오류: ' + data.error, 'error');
    }

  } catch (error) {
    console.error('❌ [POS] 테이블 해제 실패:', error);
    showPOSNotification('테이블 해제 요청 실패', 'error');
  }
}

// 테이블 맵 스타일 추가
const tableMapStyles = `
  <style>
    .table-item {
      position: relative;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }

    .table-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .table-item.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .table-item.available { 
      border-color: #10b981; 
      background: #ecfdf5; 
    }
    
    .table-item.occupied { 
      border-color: #ef4444; 
      background: #fef2f2; 
    }

    .table-number {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .table-info {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .table-badges {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .badge {
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }

    .badge.timer { 
      background: #ddd6fe; 
      color: #7c3aed; 
    }
    
    .badge.amount { 
      background: #dcfce7; 
      color: #16a34a; 
    }
  </style>
`;

// 스타일 추가
if (!document.getElementById('tableMapStyles')) {
  const style = document.createElement('div');
  style.id = 'tableMapStyles';
  style.innerHTML = tableMapStyles;
  document.head.appendChild(style);
}

// 전역 함수 등록
window.renderTableMap = renderTableMap;
window.selectTableFromMap = selectTableFromMap;
window.occupyTable = occupyTable;
window.releaseTable = releaseTable;
window.getTimeDifferenceText = getTimeDifferenceText;
