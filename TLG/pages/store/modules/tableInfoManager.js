// 테이블 정보 관리자
window.TableInfoManager = {
  async loadTableInfo(store) {
    try {
      console.log(`🔍 매장 ${store.name} (ID: ${store.id}) 테이블 정보 조회 중...`);

      // 매장이 운영중지 상태면 테이블 정보를 가져오지 않고 바로 운영중지 표시
      if (!store.isOpen) {
        console.log(`🔴 매장 ${store.name}이 운영중지 상태입니다.`);
        this.updateTableInfoUI({
          totalTables: '-',
          availableTables: '-',
          totalSeats: '-',
          availableSeats: '-',
          occupancyRate: '-',
          statusText: '운영중지',
          statusClass: 'closed'
        });
        return;
      }

      const response = await fetch(`/api/stores/${store.id}/tables?_t=${Date.now()}`);
      if (!response.ok) throw new Error('테이블 정보 조회 실패');

      const data = await response.json();
      console.log(`📊 테이블 데이터:`, data);

      const tables = data.tables || [];
      const totalTables = tables.length;
      const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
      const occupiedTables = tables.filter(t => t.isOccupied);
      const availableTables = tables.filter(t => !t.isOccupied);
      const availableSeats = availableTables.reduce((sum, table) => sum + table.seats, 0);
      const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

      console.log(`🏪 ${store.name} 통계:
      - 총 테이블: ${totalTables}개
      - 총 좌석: ${totalSeats}석
      - 사용중 테이블: ${occupiedTables.length}개
      - 빈 테이블: ${availableTables.length}개
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
      }

      // UI 업데이트
      this.updateTableInfoUI({
        totalTables: `${totalTables}개`,
        availableTables: `${availableTables.length}개`,
        totalSeats: `${totalSeats}석`,
        availableSeats: `${availableSeats}석`,
        occupancyRate: `${occupancyRate}`,
        statusText: statusText,
        statusClass: statusClass
      });

    } catch (error) {
      console.error('테이블 정보 로딩 실패:', error);
      this.updateTableInfoUI({
        totalTables: '오류',
        availableTables: '오류',
        totalSeats: '오류',
        availableSeats: '오류',
        occupancyRate: '오류',
        statusText: 'ERROR',
        statusClass: 'error'
      });
    }
  },

  updateTableInfoUI(info) {
    const totalTablesEl = document.getElementById('totalTables');
    const availableTablesEl = document.getElementById('availableTables');
    const totalSeatsEl = document.getElementById('totalSeats');
    const availableSeatsEl = document.getElementById('availableSeats');
    const occupancyRateEl = document.getElementById('occupancyRate');
    const statusBadgeEl = document.getElementById('tableStatusBadge');
    const usageRateFillEl = document.getElementById('usageRateFill');

    if (totalTablesEl) totalTablesEl.textContent = info.totalTables;
    if (availableTablesEl) availableTablesEl.textContent = info.availableTables;
    if (totalSeatsEl) totalSeatsEl.textContent = info.totalSeats;
    if (availableSeatsEl) availableSeatsEl.textContent = info.availableSeats;
    if (occupancyRateEl) occupancyRateEl.textContent = info.occupancyRate + (info.occupancyRate !== '-' ? '%' : '');

    // 사용률 바 업데이트
    if (usageRateFillEl && info.occupancyRate !== '-') {
      const percentage = parseInt(info.occupancyRate) || 0;
      usageRateFillEl.style.width = percentage + '%';
      
      // 사용률에 따라 바 색상 변경
      if (percentage >= 90) {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'; // 빨간색
      } else if (percentage >= 70) {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'; // 주황색
      } else {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'; // 기본 초록-파랑
      }
    } else if (usageRateFillEl) {
      usageRateFillEl.style.width = '0%';
    }

    if (statusBadgeEl) {
      statusBadgeEl.textContent = info.statusText;
      statusBadgeEl.className = `tlr-status-badge ${info.statusClass || ''}`;
    }

    // 헤더의 매장 운영 상태도 함께 업데이트
    this.updateStoreHeaderStatus(info.statusText, info.statusClass);

    console.log(`✅ 테이블 정보 UI 업데이트 완료: ${info.statusText} (사용률: ${info.occupancyRate}%)`);
  },

  updateStoreHeaderStatus(statusText, statusClass) {
    // 매장 상세 페이지의 헤더에 있는 운영 상태 요소들도 업데이트
    const storeStatusElements = document.querySelectorAll('.store-status, .status-badge');
    storeStatusElements.forEach(element => {
      if (element) {
        element.textContent = statusText === '운영중지' ? '🔴 운영중지' : '🟢 운영중';
        element.className = element.className.replace(/\b(open|closed)\b/g, '') + ` ${statusClass || ''}`;
      }
    });
  },

  async renderTableLayout(store) {
    try {
      // 매장이 운영중지 상태면 테이블 배치도를 보여주지 않음
      if (!store.isOpen) {
        alert('현재 운영중지된 매장입니다.');
        return;
      }

      const response = await fetch(`/api/stores/${store.id}/tables?_t=${Date.now()}`);
      if (!response.ok) throw new Error('테이블 정보 조회 실패');

      const data = await response.json();
      const tables = data.tables;

      // 테이블을 카테고리별로 분류
      const regularTables = tables.filter(t => t.tableName.includes('테이블'));
      const vipTables = tables.filter(t => t.tableName.includes('VIP룸'));
      const coupleTables = tables.filter(t => t.tableName.includes('커플석'));
      const groupTables = tables.filter(t => t.tableName.includes('단체석'));

      const main = document.getElementById('main');
      main.innerHTML = this.getTableLayoutHTML(store, tables, regularTables, vipTables, coupleTables, groupTables);

      // 테이블 클릭 이벤트 설정
      this.setupTableClickEvents(tables);

    } catch (error) {
      console.error('테이블 배치도 로딩 실패:', error);
      alert('테이블 정보를 불러올 수 없습니다.');
    }
  },

  getTableLayoutHTML(store, tables, regularTables, vipTables, coupleTables, groupTables) {
    return `
      <header class="table-layout-header">
        <button id="tableLayoutBackBtn" class="header-btn" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
          <span class="header-btn-ico">⬅️</span>
        </button>
        <h2>${store.name} - 테이블 배치도</h2>
      </header>

      <div class="table-layout-container">
        <div class="table-status-summary">
          <div class="status-item">
            <span class="status-dot available"></span>
            <span>빈 테이블 (${tables.filter(t => !t.isOccupied).length})</span>
          </div>
          <div class="status-item">
            <span class="status-dot occupied"></span>
            <span>사용중 (${tables.filter(t => t.isOccupied).length})</span>
          </div>
          <div class="status-item">
            <span class="status-dot total"></span>
            <span>전체 ${tables.length}개</span>
          </div>
        </div>

        ${this.getTableSectionHTML('🍽️ 일반 테이블', regularTables, 'regular')}
        ${this.getTableSectionHTML('👑 VIP룸', vipTables, 'vip')}
        ${this.getTableSectionHTML('💕 커플석', coupleTables, 'couple')}
        ${this.getTableSectionHTML('👥 단체석', groupTables, 'group')}

        <div class="table-info-panel">
          <h3>테이블 정보</h3>
          <div id="selectedTableInfo">테이블을 선택해주세요</div>
        </div>
      </div>

      ${this.getTableLayoutStyles()}
    `;
  },

  getTableSectionHTML(title, tables, gridClass) {
    if (tables.length === 0) return '';

    return `
      <div class="table-section">
        <h3 class="section-title">${title}</h3>
        <div class="table-grid ${gridClass}">
          ${tables.map(table => {
            const statusClass = table.isOccupied ? 'occupied' : 'available';
            const specialClass = gridClass === 'vip' ? 'vip-room' : 
                               gridClass === 'couple' ? 'couple-seat' : 
                               gridClass === 'group' ? 'group-seat' : '';
            return `
              <div class="table-slot ${statusClass} ${specialClass}" data-table-id="${table.id}">
                <div class="table-number">${table.tableNumber}</div>
                <div class="table-name">${table.tableName}</div>
                <div class="table-seats">${table.seats}석</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  setupTableClickEvents(tables) {
    document.querySelectorAll('.table-slot:not(.empty)').forEach(slot => {
      slot.addEventListener('click', (e) => {
        this.handleTableClick(e, tables);
      });
    });
  },

  handleTableClick(e, tables) {
    // 이전 선택 제거
    document.querySelectorAll('.table-slot').forEach(s => s.classList.remove('selected'));
    // 현재 선택 추가
    e.currentTarget.classList.add('selected');

    const tableId = e.currentTarget.dataset.tableId;
    const table = tables.find(t => t.id == tableId);

    if (table) {
      const selectedTableInfo = document.getElementById('selectedTableInfo');
      const occupiedText = table.isOccupied 
        ? `<span style="color: #F44336;">사용중</span> (${new Date(table.occupiedSince).toLocaleString()}부터)`
        : `<span style="color: #4CAF50;">빈 테이블</span>`;

      selectedTableInfo.innerHTML = `
        <strong>${table.tableName}</strong><br>
        테이블 번호: ${table.tableNumber}번<br>
        좌석 수: ${table.seats}석<br>
        상태: ${occupiedText}
      `;
    }
  },

  getTableLayoutStyles() {
    return `
      <style>
        .table-layout-header {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 80px;
          background: white;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 16px;
          z-index: 1001;
          box-sizing: border-box;
        }

        .table-layout-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .header-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f8fafd;
          color: #297efc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(30,110,255,0.05);
        }

        .table-layout-container {
          position: absolute;
          top: 80px;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 430px;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fb;
          box-sizing: border-box;
        }

        .table-status-summary {
          display: flex;
          justify-content: space-around;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-dot.available {
          background: #4CAF50;
        }

        .status-dot.occupied {
          background: #F44336;
        }

        .status-dot.total {
          background: #2196F3;
        }

        .table-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .table-grid {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: grid;
          gap: 12px;
        }

        .table-grid.regular {
          grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        }

        .table-grid.vip {
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        }

        .table-grid.couple {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        }

        .table-grid.group {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        .table-slot {
          height: 85px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
          position: relative;
        }

        .table-slot.vip-room {
          background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
          border-color: #FF8F00;
          color: #8B4513;
        }

        .table-slot.vip-room.occupied {
          background: linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%);
          border-color: #F44336;
        }

        .table-slot.couple-seat {
          background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%);
          border-color: #E91E63;
          color: #880E4F;
        }

        .table-slot.couple-seat.occupied {
          background: linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%);
          border-color: #F44336;
        }

        .table-slot.group-seat {
          background: linear-gradient(135deg, #E8F5E8 0%, #A5D6A7 100%);
          border-color: #4CAF50;
          color: #2E7D32;
        }

        .table-slot.group-seat.occupied {
          background: linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%);
          border-color: #F44336;
        }

        .table-slot.available {
          background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%);
          border-color: #4CAF50;
          color: #2E7D32;
        }

        .table-slot.occupied {
          background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
          border-color: #F44336;
          color: #C62828;
        }

        .table-slot:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .table-slot.selected {
          border-color: #297efc;
          box-shadow: 0 0 0 3px rgba(41, 126, 252, 0.3);
          transform: translateY(-2px);
        }

        .table-number {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .table-name {
          font-size: 11px;
          font-weight: 600;
          margin: 2px 0;
          text-align: center;
        }

        .table-seats {
          font-size: 10px;
          font-weight: 500;
          opacity: 0.8;
        }

        .table-info-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .table-info-panel h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        #selectedTableInfo {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
      </style>
    `;
  },

  // 주기적으로 테이블 정보 갱신
  startAutoRefresh(store, intervalMs = 30000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      console.log('🔄 테이블 정보 자동 갱신...');
      this.loadTableInfo(store);
    }, intervalMs);
  },

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
};