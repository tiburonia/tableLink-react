// 테이블 정보 관리자
window.TableInfoManager = {
  // WebSocket 연결 초기화
  initializeWebSocket(storeId) {
    console.log(`🔌 WebSocket 연결 초기화: 매장 ${storeId}`);

    // 기존 연결 정리
    this.disconnectWebSocket();

    this.currentStoreId = storeId;

    try {
      // WebSocket 서버 URL (현재 서버와 동일한 호스트 사용)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/tables/${storeId}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log(`✅ WebSocket 연결 성공: 매장 ${storeId}`);
        this.reconnectAttempts = 0;

        // 연결 상태 UI 업데이트
        this.updateConnectionStatus('connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신:', data);

          switch(data.type) {
            case 'table_update':
              this.handleTableUpdate(data.payload);
              break;
            case 'table_status_change':
              this.handleTableStatusChange(data.payload);
              break;
            case 'store_status_update':
              this.handleStoreStatusUpdate(data.payload);
              break;
            default:
              console.log('🔍 알 수 없는 메시지 타입:', data.type);
          }
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 오류:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log(`🔌 WebSocket 연결 종료: 매장 ${storeId}, 코드: ${event.code}`);
        this.updateConnectionStatus('disconnected');

        // 비정상 종료인 경우 재연결 시도
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            this.initializeWebSocket(storeId);
          }, this.reconnectInterval);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error);
        this.updateConnectionStatus('error');
      };

    } catch (error) {
      console.error('❌ WebSocket 초기화 실패:', error);
      this.updateConnectionStatus('error');
    }
  },

  // WebSocket 연결 해제
  disconnectWebSocket() {
    if (this.websocket) {
      console.log('🔌 WebSocket 연결 해제');
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }
    this.currentStoreId = null;
    this.reconnectAttempts = 0;
  },

  // 테이블 업데이트 처리
  handleTableUpdate(payload) {
    console.log('🔄 테이블 업데이트 처리:', payload);

    if (payload.storeId === this.currentStoreId) {
      // UI 업데이트
      this.updateTableInfoUI(payload);

      // 테이블 배치도가 있다면 업데이트
      if (document.getElementById('tableLayoutContainer')) {
        this.updateTableLayout(payload);
      }
    }
  },

  // 테이블 상태 변경 처리
  handleTableStatusChange(payload) {
    console.log('📊 테이블 상태 변경:', payload);

    const { tableId, tableNumber, isOccupied, occupiedSince, customerName } = payload;

    // 개별 테이블 카드 업데이트
    const tableCard = document.querySelector(`[data-table-id="${tableId}"]`);
    if (tableCard) {
      this.updateSingleTableCard(tableCard, {
        tableNumber,
        isOccupied,
        occupiedSince,
        customerName
      });
    }

    // 전체 통계 업데이트 요청
    this.refreshTableStatistics();
  },

  // 매장 상태 업데이트 처리
  handleStoreStatusUpdate(payload) {
    console.log('🏪 매장 상태 업데이트:', payload);

    const { storeId, isOpen, totalTables, occupiedTables } = payload;

    if (storeId === this.currentStoreId) {
      // 매장 운영 상태 UI 업데이트
      this.updateStoreStatusUI({ isOpen, totalTables, occupiedTables });
    }
  },

  // 연결 상태 UI 업데이트
  updateConnectionStatus(status) {
    const statusIndicator = document.querySelector('.table-status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `table-status-indicator ${status}`;

      const statusText = {
        'connected': '🟢 실시간',
        'disconnected': '🟡 연결 해제',
        'error': '🔴 오류'
      };

      statusIndicator.textContent = statusText[status] || '🟡 연결 중';
    }
  },

  // 실시간 테이블 정보 UI 업데이트
  updateTableInfoUI(data) {
    const { totalTables, availableTables, occupiedTables, tables } = data;

    // 통계 업데이트
    const statsElements = {
      totalTables: document.querySelector('.stat-total-tables .stat-value'),
      availableTables: document.querySelector('.stat-available-tables .stat-value'),
      occupiedTables: document.querySelector('.stat-occupied-tables .stat-value')
    };

    if (statsElements.totalTables) statsElements.totalTables.textContent = totalTables;
    if (statsElements.availableTables) statsElements.availableTables.textContent = availableTables;
    if (statsElements.occupiedTables) statsElements.occupiedTables.textContent = occupiedTables;

    // 사용률 업데이트
    const usageRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;
    const usageElement = document.querySelector('.usage-rate');
    if (usageElement) {
      usageElement.textContent = `${usageRate}%`;

      // 사용률에 따른 색상 변경
      const usageBar = document.querySelector('.usage-progress-fill');
      if (usageBar) {
        usageBar.style.width = `${usageRate}%`;

        if (usageRate >= 80) {
          usageBar.className = 'usage-progress-fill high';
        } else if (usageRate >= 50) {
          usageBar.className = 'usage-progress-fill medium';
        } else {
          usageBar.className = 'usage-progress-fill low';
        }
      }
    }

    // 상태 표시 업데이트
    const statusElement = document.querySelector('.table-overall-status');
    if (statusElement) {
      let statusText, statusClass;

      if (usageRate >= 90) {
        statusText = 'FULL';
        statusClass = 'full';
      } else if (usageRate >= 70) {
        statusText = 'BUSY';
        statusClass = 'busy';
      } else {
        statusText = 'OPEN';
        statusClass = 'open';
      }

      statusElement.textContent = statusText;
      statusElement.className = `table-overall-status ${statusClass}`;
    }

    console.log(`📊 실시간 업데이트: ${occupiedTables}/${totalTables} (${usageRate}%)`);
  },

  // 개별 테이블 카드 업데이트
  updateSingleTableCard(tableCard, data) {
    const { tableNumber, isOccupied, occupiedSince, customerName } = data;

    // 테이블 상태 클래스 업데이트
    tableCard.className = `table-item ${isOccupied ? 'occupied' : 'available'}`;

    // 상태 표시 업데이트
    const statusElement = tableCard.querySelector('.table-status');
    if (statusElement) {
      statusElement.textContent = isOccupied ? '사용중' : '빈 테이블';
      statusElement.className = `table-status ${isOccupied ? 'occupied' : 'available'}`;
    }

    // 고객 정보 업데이트
    const customerElement = tableCard.querySelector('.table-customer');
    if (customerElement) {
      if (isOccupied && customerName) {
        customerElement.textContent = customerName;
        customerElement.style.display = 'block';
      } else {
        customerElement.style.display = 'none';
      }
    }

    // 사용 시간 업데이트
    const timeElement = tableCard.querySelector('.table-occupied-time');
    if (timeElement) {
      if (isOccupied && occupiedSince) {
        const duration = this.calculateOccupiedDuration(occupiedSince);
        timeElement.textContent = duration;
        timeElement.style.display = 'block';
      } else {
        timeElement.style.display = 'none';
      }
    }
  },

  // 테이블 사용 시간 계산
  calculateOccupiedDuration(occupiedSince) {
    const now = new Date();
    const startTime = new Date(occupiedSince);
    const diffMs = now - startTime;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  },

  // 테이블 통계 새로고침
  async refreshTableStatistics() {
    if (!this.currentStoreId) return;

    try {
      const response = await fetch(`/api/tables/stores/${this.currentStoreId}/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.updateTableInfoUI(data);
        }
      }
    } catch (error) {
      console.error('❌ 테이블 통계 새로고침 실패:', error);
    }
  },

  // 테이블 정보 로드
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
      const occupiedTablesCount = tables.filter(t => t.isOccupied).length;
      const availableTablesCount = tables.filter(t => !t.isOccupied).length;
      const availableSeats = tables.reduce((sum, table) => sum + (t => !t.isOccupied ? t.seats : 0)(), 0);
      const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

      console.log(`🏪 ${store.name} 통계:
      - 총 테이블: ${totalTables}개
      - 총 좌석: ${totalSeats}석
      - 사용중 테이블: ${occupiedTablesCount}개
      - 빈 테이블: ${availableTablesCount}개
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
        availableTables: `${availableTablesCount}개`,
        totalSeats: `${totalSeats}석`,
        availableSeats: `${availableSeats}석`,
        occupancyRate: `${occupancyRate}`,
        statusText: statusText,
        statusClass: statusClass
      });

      console.log(`✅ 새로운 테이블 정보 UI 업데이트 완료: ${statusText} (사용률: ${occupancyRate}%)`);

      // WebSocket 연결 초기화 (실시간 업데이트를 위해)
      this.initializeWebSocket(store.id);

    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      this.displayTableInfoError();
    }
  },

  displayTableInfoError() {
    this.updateTableInfoUI({
      totalTables: '오류',
      availableTables: '오류',
      totalSeats: '오류',
      availableSeats: '오류',
      occupancyRate: '오류',
      statusText: 'ERROR',
      statusClass: 'error'
    });
  },

  updateTableInfoUI(info) {
    // 기존 요소들 업데이트 (하위 호환성)
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

    // 새로운 시각적 요소들 업데이트
    const totalTablesVisual = document.getElementById('totalTablesVisual');
    const availableTablesVisual = document.getElementById('availableTablesVisual');
    const occupiedTablesVisual = document.getElementById('occupiedTablesVisual');
    const occupancyRateNew = document.getElementById('occupancyRateNew');
    const occupancyFillNew = document.getElementById('occupancyFillNew');
    const occupancyGlow = document.getElementById('occupancyGlow');
    const usedSeatsCount = document.getElementById('usedSeatsCount');
    const totalSeatsCount = document.getElementById('totalSeatsCount');
    const seatsVisual = document.getElementById('seatsVisual');

    // 숫자 데이터 계산
    const totalTables = parseInt(info.totalTables) || 0;
    const availableTables = parseInt(info.availableTables) || 0;
    const occupiedTables = totalTables - availableTables;
    const totalSeats = parseInt(info.totalSeats) || 0;
    const availableSeats = parseInt(info.availableSeats) || 0;
    const usedSeats = totalSeats - availableSeats;

    // 시각적 통계 업데이트
    if (totalTablesVisual) totalTablesVisual.textContent = totalTables;
    if (availableTablesVisual) availableTablesVisual.textContent = availableTables;
    if (occupiedTablesVisual) occupiedTablesVisual.textContent = occupiedTables;
    if (occupancyRateNew) occupancyRateNew.textContent = info.occupancyRate + (info.occupancyRate !== '-' ? '%' : '');
    if (usedSeatsCount) usedSeatsCount.textContent = usedSeats;
    if (totalSeatsCount) totalSeatsCount.textContent = totalSeats;

    // 사용률 바 업데이트 (기존)
    if (usageRateFillEl && info.occupancyRate !== '-') {
      const percentage = parseInt(info.occupancyRate) || 0;
      usageRateFillEl.style.width = percentage + '%';

      if (percentage >= 90) {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      } else if (percentage >= 70) {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      } else {
        usageRateFillEl.style.background = 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)';
      }
    } else if (usageRateFillEl) {
      usageRateFillEl.style.width = '0%';
    }

    // 새로운 사용률 바 업데이트
    if (occupancyFillNew && info.occupancyRate !== '-') {
      const percentage = parseInt(info.occupancyRate) || 0;
      occupancyFillNew.style.width = percentage + '%';

      if (occupancyGlow) {
        occupancyGlow.style.width = percentage + '%';
      }
    } else {
      if (occupancyFillNew) occupancyFillNew.style.width = '0%';
      if (occupancyGlow) occupancyGlow.style.width = '0%';
    }

    // 좌석 시각화 생성
    if (seatsVisual && totalSeats > 0) {
      const maxSeatsToShow = 30; // 최대 30개까지만 표시
      const seatsToShow = Math.min(totalSeats, maxSeatsToShow);
      const seatRatio = usedSeats / totalSeats;
      const visualUsedSeats = Math.round(seatsToShow * seatRatio);

      let seatsHTML = '';
      for (let i = 0; i < seatsToShow; i++) {
        const seatClass = i < visualUsedSeats ? 'occupied' : 'available';
        seatsHTML += `<div class="seat-icon ${seatClass}"></div>`;
      }

      if (totalSeats > maxSeatsToShow) {
        seatsHTML += '<span style="font-size: 10px; color: #9ca3af; margin-left: 4px;">...</span>';
      }

      seatsVisual.innerHTML = seatsHTML;
    }

    // 상태 배지 업데이트
    if (statusBadgeEl) {
      statusBadgeEl.textContent = info.statusText;
      statusBadgeEl.className = `tlr-status-badge ${info.statusClass || ''}`;
    }

    // 수동 새로고침 버튼 이벤트 설정
    const manualRefreshBtn = document.getElementById('manualRefreshBtn');
    if (manualRefreshBtn && !manualRefreshBtn.hasAttribute('data-event-set')) {
      manualRefreshBtn.setAttribute('data-event-set', 'true');
      manualRefreshBtn.addEventListener('click', () => {
        if (window.currentStore) {
          this.loadTableInfo(window.currentStore);
        }
      });
    }

    // 헤더의 매장 운영 상태도 함께 업데이트
    this.updateStoreHeaderStatus(info.statusText, info.statusClass);

    console.log(`✅ 새로운 테이블 정보 UI 업데이트 완료: ${info.statusText} (사용률: ${info.occupancyRate}%)`);
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

        .table-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }

        .table-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .table-status-indicator {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .table-status-indicator.connected {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .table-status-indicator.disconnected {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .table-status-indicator.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .table-status-indicator.connecting {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      </style>
    `;
  },

  // 자동 갱신 기능 완전 제거됨
  startAutoRefresh() {
    console.log('ℹ️ 자동 갱신 기능이 비활성화되었습니다');
    return;
  },

  stopAutoRefresh() {
    console.log('ℹ️ 자동 갱신 기능이 이미 비활성화되었습니다');
    return;
  },
};