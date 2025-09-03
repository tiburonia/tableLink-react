
/**
 * KDS UI 렌더링 모듈 (Simple KDS v2.0)
 * 책임: KDS 화면 렌더링, 사용자 상호작용 처리
 */

window.KDSUIRenderer = {
  // KDS 메인 화면 렌더링
  renderMainScreen: function(storeId) {
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="kds-container">
        <div class="kds-header">
          <div class="store-info">
            <h1>🍽️ KDS - 매장 ${storeId}</h1>
            <div class="status-info">
              <span id="connectionStatus" class="status-connected">연결됨</span>
              <span id="lastUpdate">마지막 업데이트: 방금 전</span>
            </div>
          </div>
          <div class="controls">
            <button onclick="window.kdsRefresh()" class="btn-refresh">
              🔄 새로고침
            </button>
            <button onclick="window.location.reload()" class="btn-reload">
              ⚡ 완전새로고침  
            </button>
          </div>
        </div>

        <div class="station-tabs" id="stationTabs">
          <button class="station-tab active" data-station="all">
            전체 주문
            <span class="ticket-counter" id="counter-all">0</span>
          </button>
        </div>

        <div class="kds-main" id="kdsMain">
          <div class="kds-ready-state" id="readyState">
            <div class="ready-icon">📋</div>
            <h3>KDS 준비 완료</h3>
            <p>새로운 주문을 기다리고 있습니다</p>
          </div>
        </div>
      </div>
    `;

    this.loadStations(storeId);
    this.loadItems(storeId);
  },

  // 스테이션 탭 로딩
  loadStations: async function(storeId) {
    try {
      const response = await fetch(`/api/kds/stations?store_id=${storeId}`);
      const data = await response.json();

      if (data.success) {
        this.renderStationTabs(data.stations);
      }
    } catch (error) {
      console.error('❌ 스테이션 로딩 실패:', error);
    }
  },

  // 스테이션 탭 렌더링
  renderStationTabs: function(stations) {
    const tabsContainer = document.getElementById('stationTabs');
    
    let tabsHTML = `
      <button class="station-tab active" data-station="all">
        전체 주문
        <span class="ticket-counter" id="counter-all">0</span>
      </button>
    `;

    stations.forEach(station => {
      const isExpo = station.is_expo ? ' expo' : '';
      tabsHTML += `
        <button class="station-tab${isExpo}" data-station="${station.id}">
          ${station.name}
          <span class="ticket-counter" id="counter-${station.id}">${station.active_items || 0}</span>
        </button>
      `;
    });

    tabsContainer.innerHTML = tabsHTML;

    // 탭 클릭 이벤트
    tabsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('station-tab')) {
        const stationId = e.target.dataset.station;
        this.switchStation(stationId);
      }
    });
  },

  // 스테이션 전환
  switchStation: function(stationId) {
    // 탭 활성화
    document.querySelectorAll('.station-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-station="${stationId}"]`).classList.add('active');

    // 아이템 로딩
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('storeId') || 1;
    this.loadItems(storeId, stationId);
  },

  // KDS 아이템 로딩
  loadItems: async function(storeId, stationId = 'all') {
    try {
      let url = `/api/kds/items?store_id=${storeId}`;
      if (stationId !== 'all') {
        url += `&station_id=${stationId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        this.renderKDSItems(data.checks || []);
        this.updateItemCounts(data.checks || []);
      }
    } catch (error) {
      console.error('❌ KDS 아이템 로딩 실패:', error);
      this.showError('아이템 로딩에 실패했습니다.');
    }
  },

  // KDS 아이템 렌더링
  renderKDSItems: function(checks) {
    const kdsMain = document.getElementById('kdsMain');
    const readyState = document.getElementById('readyState');

    if (checks.length === 0) {
      readyState.style.display = 'flex';
      kdsMain.innerHTML = `
        <div class="kds-ready-state">
          <div class="ready-icon">📋</div>
          <h3>주문 대기 중</h3>
          <p>새로운 주문이 들어오면 자동으로 표시됩니다</p>
        </div>
      `;
      return;
    }

    readyState.style.display = 'none';

    let itemsHTML = '<div class="kds-grid">';

    checks.forEach(check => {
      itemsHTML += this.renderCheckCard(check);
    });

    itemsHTML += '</div>';
    kdsMain.innerHTML = itemsHTML;
  },

  // 체크 카드 렌더링
  renderCheckCard: function(check) {
    const sourceIcon = check.source_system === 'TLL' ? '📱' : '🖥️';
    const sourceText = check.source_system === 'TLL' ? 'TableLink' : 'POS';
    
    let itemsHTML = '';
    check.items.forEach(item => {
      const statusClass = this.getStatusClass(item.kds_status);
      const elapsedTime = item.elapsed_seconds ? this.formatElapsedTime(item.elapsed_seconds) : '';
      
      itemsHTML += `
        <div class="kds-item ${statusClass}" data-item-id="${item.id}">
          <div class="item-header">
            <span class="menu-name">${item.menu_name}</span>
            <span class="quantity">x${item.quantity}</span>
          </div>
          ${item.options && Object.keys(item.options).length > 0 ? 
            `<div class="item-options">${this.renderOptions(item.options)}</div>` : ''
          }
          <div class="item-status">
            <span class="status-badge">${this.getStatusText(item.kds_status)}</span>
            ${elapsedTime ? `<span class="elapsed-time">${elapsedTime}</span>` : ''}
          </div>
          <div class="item-actions">
            ${this.renderItemActions(item)}
          </div>
        </div>
      `;
    });

    return `
      <div class="kds-card" data-check-id="${check.check_id}">
        <div class="card-header">
          <div class="table-info">
            <span class="table-number">테이블 ${check.table_number}</span>
            <span class="customer-name">${check.customer_name}</span>
          </div>
          <div class="source-info">
            <span class="source-badge">
              ${sourceIcon} ${sourceText}
            </span>
          </div>
        </div>
        <div class="card-items">
          ${itemsHTML}
        </div>
      </div>
    `;
  },

  // 아이템 액션 버튼 렌더링
  renderItemActions: function(item) {
    switch (item.kds_status) {
      case 'PENDING':
        return `
          <button onclick="window.kdsItemAction(${item.id}, 'start')" class="btn-start">
            🔥 조리시작
          </button>
          <button onclick="window.kdsItemAction(${item.id}, 'cancel')" class="btn-cancel">
            ❌ 취소
          </button>
        `;
      case 'COOKING':
        return `
          <button onclick="window.kdsItemAction(${item.id}, 'done')" class="btn-done">
            ✅ 완료
          </button>
          <button onclick="window.kdsItemAction(${item.id}, 'cancel')" class="btn-cancel">
            ❌ 취소
          </button>
        `;
      case 'DONE':
        return `
          <button onclick="window.kdsItemAction(${item.id}, 'serve')" class="btn-serve">
            🍽️ 서빙
          </button>
        `;
      default:
        return '';
    }
  },

  // 상태별 CSS 클래스
  getStatusClass: function(status) {
    const classes = {
      'PENDING': 'status-pending',
      'COOKING': 'status-cooking',
      'DONE': 'status-done',
      'SERVED': 'status-served',
      'CANCELED': 'status-canceled'
    };
    return classes[status] || '';
  },

  // 상태별 텍스트
  getStatusText: function(status) {
    const texts = {
      'PENDING': '대기중',
      'COOKING': '조리중',
      'DONE': '완료',
      'SERVED': '서빙완료',
      'CANCELED': '취소됨'
    };
    return texts[status] || status;
  },

  // 옵션 렌더링
  renderOptions: function(options) {
    if (typeof options === 'string') {
      return options;
    }
    if (typeof options === 'object' && options !== null) {
      return Object.entries(options)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return '';
  },

  // 경과 시간 포맷
  formatElapsedTime: function(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    } else {
      return `${remainingSeconds}초`;
    }
  },

  // 아이템 수 업데이트
  updateItemCounts: function(checks) {
    // 전체 카운트 업데이트
    const totalCount = checks.reduce((sum, check) => sum + check.items.length, 0);
    const allCounter = document.getElementById('counter-all');
    if (allCounter) {
      allCounter.textContent = totalCount;
    }

    // 스테이션별 카운트 업데이트 (향후 구현)
  },

  // 에러 표시
  showError: function(message) {
    const kdsMain = document.getElementById('kdsMain');
    kdsMain.innerHTML = `
      <div class="kds-error">
        <div class="error-icon">⚠️</div>
        <h3>오류 발생</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn-retry">다시 시도</button>
      </div>
    `;
  }
};

// 전역 함수들
window.kdsRefresh = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get('storeId') || 1;
  const activeStation = document.querySelector('.station-tab.active')?.dataset.station || 'all';
  
  window.KDSUIRenderer.loadItems(storeId, activeStation);
};

window.kdsItemAction = async function(itemId, action) {
  try {
    const response = await fetch(`/api/kds/items/${itemId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action,
        actor_type: 'USER',
        actor_id: 'kds_user'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // 성공 시 자동 새로고침
      window.kdsRefresh();
    } else {
      alert('작업 실패: ' + result.message);
    }
  } catch (error) {
    console.error('❌ 아이템 액션 실패:', error);
    alert('작업 중 오류가 발생했습니다.');
  }
};

console.log('✅ KDS UI 렌더러 v2.0 로드 완료');
