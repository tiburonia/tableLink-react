
window.TLL = async function TLL(preselectedStore = null) {
  const main = document.getElementById('main');
  
  // 1. 모던하고 개선된 UI 프레임 렌더링
  main.innerHTML = `
    <div class="tll-layout">
      <div class="tll-header">
        <button id="backBtn" class="back-button" onclick="renderMap()">
          <span class="back-icon">←</span>
          <span class="back-text">지도로 돌아가기</span>
        </button>
        <div class="header-title">
          <h1 class="tll-title">
            <span class="title-icon">📱</span>
            QR 주문
          </h1>
          <p class="tll-subtitle">매장을 선택하고 테이블에서 주문하세요</p>
        </div>
      </div>

      <div class="tll-container">
        <div class="search-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">🔍</span>
              매장 검색
            </h3>
          </div>

          <div class="search-input-wrapper">
            <input 
              id="storeSearchInput" 
              type="text" 
              placeholder="매장 이름을 입력해보세요..." 
              class="search-input"
            />
            <div class="search-icon">🔍</div>
            <div id="storeSearchResults" class="search-results">
            </div>
          </div>

          <div id="selectedStore" class="selected-store">
            <div class="selected-store-header">
              <span class="selected-icon">✅</span>
              <span class="selected-text">선택된 매장</span>
            </div>
            <div class="selected-store-name">
              <span id="selectedStoreName"></span>
            </div>
          </div>
        </div>

        <div class="table-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">🪑</span>
              테이블 선택
            </h3>
          </div>

          <div class="table-select-wrapper">
            <select id="tableSelect" class="table-select" disabled>
              <option value="">매장을 먼저 선택하세요</option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>

        <div class="action-section">
          <button id="startOrderBtn" class="start-order-btn" disabled>
            <span class="btn-icon">🚀</span>
            <span class="btn-text">주문 시작하기</span>
            <div class="btn-shine"></div>
          </button>
        </div>
      </div>
    </div>

    <style>
      .tll-layout {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tll-header {
        max-width: 500px;
        margin: 0 auto 30px;
      }

      .back-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        margin-bottom: 20px;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .back-icon {
        font-size: 18px;
        font-weight: bold;
      }

      .header-title {
        text-align: center;
        color: white;
      }

      .tll-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 32px;
        font-weight: 800;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .title-icon {
        font-size: 36px;
        filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
      }

      .tll-subtitle {
        font-size: 16px;
        margin: 0;
        opacity: 0.9;
        font-weight: 400;
      }

      .tll-container {
        max-width: 500px;
        margin: 0 auto;
        background: white;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.8);
      }

      .search-section {
        margin-bottom: 16px;
      }

      .table-section {
        margin-bottom: 32px;
      }

      .section-header {
        margin-bottom: 16px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .section-icon {
        font-size: 20px;
      }

      .search-input-wrapper {
        position: relative;
        margin-bottom: 16px;
      }

      .search-input {
        width: 100%;
        padding: 16px 20px;
        padding-right: 50px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        background: #f9fafb;
        transition: all 0.3s ease;
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      .search-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 18px;
        pointer-events: none;
      }

      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 2px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 16px 16px;
        max-height: 280px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        margin-top: -2px;
      }

      .store-search-item {
        padding: 16px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.2s ease;
      }

      .store-search-item:hover {
        background: #f8fafc;
      }

      .store-search-item:last-child {
        border-bottom: none;
        border-radius: 0 0 16px 16px;
      }

      .store-search-item > div:first-child {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .store-search-item > div:last-child {
        font-size: 14px;
        color: #6b7280;
      }

      .selected-store {
        background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        border-radius: 16px;
        padding: 16px 20px;
        color: white;
        display: none;
      }

      .selected-store-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        margin-bottom: 8px;
        opacity: 0.9;
      }

      .selected-store-name {
        font-size: 18px;
        font-weight: 700;
      }

      .table-select-wrapper {
        position: relative;
      }

      .table-select {
        width: 100%;
        padding: 16px 20px;
        padding-right: 50px;
        font-size: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        background: #f9fafb;
        cursor: pointer;
        transition: all 0.3s ease;
        appearance: none;
        box-sizing: border-box;
      }

      .table-select:enabled {
        background: white;
        border-color: #d1d5db;
      }

      .table-select:enabled:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      }

      .table-select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .select-arrow {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        font-size: 14px;
        pointer-events: none;
      }

      .action-section {
        text-align: center;
      }

      .start-order-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 18px 24px;
        font-size: 18px;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .start-order-btn:disabled {
        background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
        color: #6b7280;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .start-order-btn:enabled {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
      }

      .start-order-btn:enabled:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4);
      }

      .start-order-btn:enabled:active {
        transform: translateY(-1px);
      }

      .btn-icon {
        font-size: 20px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      .btn-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.6s ease;
      }

      .start-order-btn:enabled:hover .btn-shine {
        left: 100%;
      }

      @media (max-width: 480px) {
        .tll-layout {
          padding: 12px;
        }

        .tll-container {
          padding: 24px 16px;
          border-radius: 20px;
        }

        .tll-title {
          font-size: 28px;
        }

        .title-icon {
          font-size: 32px;
        }

        .search-input,
        .table-select {
          padding: 14px 16px;
          font-size: 15px;
        }

        .start-order-btn {
          padding: 16px 20px;
          font-size: 16px;
        }
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #e0e0e0;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
    </style>
  `;

  // 2. 검색 기능 설정
  let selectedStore = null;
  let searchTimeout = null;

  // 미리 선택된 매장이 있다면 초기화
  if (preselectedStore) {
    console.log(`🏪 TLL - 매장 미리 선택됨: ${preselectedStore.name} (ID: ${preselectedStore.id})`);

    // UI 요소들이 생성된 후 매장 선택 처리
    setTimeout(() => {
      if (typeof window.selectStore === 'function') {
        window.selectStore(preselectedStore.id, preselectedStore.name);
      }
    }, 100);
  }

  const storeSearchInput = document.getElementById('storeSearchInput');
  const storeSearchResults = document.getElementById('storeSearchResults');
  const selectedStoreDiv = document.getElementById('selectedStore');
  const selectedStoreName = document.getElementById('selectedStoreName');
  const tableSelect = document.getElementById('tableSelect');
  const startOrderBtn = document.getElementById('startOrderBtn');

  // DOM 요소 존재 확인
  if (!storeSearchInput || !tableSelect) {
    console.error('❌ 필수 요소를 찾을 수 없습니다');
    return;
  }

  // 매장 검색 이벤트
  storeSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      storeSearchResults.style.display = 'none';
      return;
    }

    // 200ms 딜레이 후 검색 실행
    searchTimeout = setTimeout(() => {
      searchStores(query);
    }, 200);
  });

  // 매장 검색 함수
  async function searchStores(query) {
    try {
      console.log(`🔍 TLL - 매장 검색: "${query}"`);

      const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('검색 실패');
      }

      const data = await response.json();

      if (data.success && data.stores) {
        const openStores = data.stores.filter(store => store.isOpen === true);
        displaySearchResults(openStores);
      } else {
        displaySearchResults([]);
      }
    } catch (error) {
      console.error('매장 검색 실패:', error);
      displaySearchResults([]);
    }
  }

  // 검색 결과 표시 함수
  function displaySearchResults(stores) {
    if (stores.length === 0) {
      storeSearchResults.innerHTML = '<div style="padding:10px;color:#666;text-align:center;">검색 결과가 없습니다</div>';
      storeSearchResults.style.display = 'block';
      return;
    }

    const resultsHTML = stores.map(store => `
      <div class="store-search-item" onclick="selectStore(${store.id}, '${store.name.replace(/'/g, "\\'")}')">
        <div style="font-weight:bold;">${store.name}</div>
        <div style="font-size:12px;color:#666;">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
      </div>
    `).join('');

    storeSearchResults.innerHTML = resultsHTML;
    storeSearchResults.style.display = 'block';
  }

  // 매장 선택 함수 (전역으로 등록)
  window.selectStore = async function(storeId, storeName) {
    console.log(`🏪 TLL - 매장 선택: ${storeName} (ID: ${storeId})`);

    try {
      // 서버에서 최신 테이블 점유 상태 확인
      const tablesResponse = await fetch(`/api/tables/stores/${storeId}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!tablesResponse.ok) throw new Error('테이블 정보 조회 실패');

      const tablesData = await tablesResponse.json();
      if (!tablesData.success) throw new Error('테이블 정보 조회 실패');

      // 매장 정보도 함께 조회
      const storeResponse = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        if (storeData.success) {
          selectedStore = storeData.store;
        }
      }

      if (!selectedStore) {
        selectedStore = { id: storeId, name: storeName, menu: [] };
      }

      // UI 업데이트
      storeSearchInput.value = storeName;
      storeSearchResults.style.display = 'none';
      selectedStoreDiv.style.display = 'block';
      selectedStoreName.textContent = storeName;

      console.log(`✅ TLL - 매장 정보 로드 완료:`, selectedStore);

      // 서버에서 받은 최신 테이블 정보 사용
      const tables = tablesData.tables || [];
      console.log(`🏪 ${storeName}: ${tables.length}개 테이블 정보 로드 완료`);

      if (tables.length > 0) {
        // 점유중이지 않은 테이블만 선택 가능하도록 필터링
        const availableTables = tables.filter(table => !table.isOccupied);
        const occupiedTables = tables.filter(table => table.isOccupied);
        
        const tableOptions = [
          ...availableTables.map(table => 
            `<option value="${table.tableNumber}">${table.tableName}</option>`
          ),
          ...occupiedTables.map(table => 
            `<option value="${table.tableNumber}" disabled>${table.tableName} (사용중)</option>`
          )
        ].join('');

        tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>${tableOptions}`;
        
        console.log(`🏪 ${storeName}: 전체 ${tables.length}개 (사용가능: ${availableTables.length}개, 사용중: ${occupiedTables.length}개)`);
      } else {
        // 테이블이 없는 경우 기본값 사용
        console.warn(`⚠️ ${storeName}에 테이블 정보가 없어 기본값 사용`);
        let tableNum = Array.from({ length: 10 }, (_, i) => i + 1);
        tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>` +
          tableNum.map(num => `<option value="${num}">${num}번</option>`).join('');
      }

      tableSelect.disabled = false;
      startOrderBtn.disabled = true;

    } catch (error) {
      console.error('매장 정보 로드 오류:', error);
      // 에러 시 기본값 사용
      selectedStore = { id: storeId, name: storeName, menu: [] };
      let tableNum = Array.from({ length: 10 }, (_, i) => i + 1);
      tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>` +
        tableNum.map(num => `<option value="${num}">${num}번</option>`).join('');
      tableSelect.disabled = false;
      startOrderBtn.disabled = true;
    }
  };

  // 검색 영역 외부 클릭시 결과 숨기기
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#storeSearchInput') && !e.target.closest('#storeSearchResults')) {
      storeSearchResults.style.display = 'none';
    }
  });

  tableSelect.addEventListener('change', () => {
    if (startOrderBtn) {
      startOrderBtn.disabled = !tableSelect.value;
      if (tableSelect.value) {
        startOrderBtn.style.background = '#297efc';
        startOrderBtn.style.color = '#fff';
        startOrderBtn.style.cursor = 'pointer';
      } else {
        startOrderBtn.style.background = '#ccc';
        startOrderBtn.style.color = '#666';
        startOrderBtn.style.cursor = 'not-allowed';
      }
    }
  });

  if (startOrderBtn) {
    startOrderBtn.addEventListener('click', async () => {
      if (!selectedStore || !tableSelect.value) {
        alert('매장과 테이블을 모두 선택해주세요.');
        return;
      }

      const selectedTableNumber = tableSelect.value;
      const selectedOption = tableSelect.options[tableSelect.selectedIndex];
      
      // 사용중인 테이블인지 확인 (disabled 옵션인지 체크)
      if (selectedOption.disabled) {
        alert('선택하신 테이블은 현재 사용중입니다. 다른 테이블을 선택해주세요.');
        return;
      }

      const tableName = selectedOption.textContent.replace(' (사용중)', '');

      try {
        // 주문 시작 직전 최종 테이블 점유 상태 확인
        console.log(`🔍 TLL - 테이블 ${tableName} 최종 점유 상태 확인 중...`);
        
        const tablesResponse = await fetch(`/api/tables/stores/${selectedStore.id}?_t=${Date.now()}`);
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          if (tablesData.success) {
            const currentTable = tablesData.tables.find(t => t.tableNumber == selectedTableNumber);
            if (currentTable && currentTable.isOccupied) {
              alert('선택하신 테이블이 다른 고객에 의해 사용중이 되었습니다. 다른 테이블을 선택해주세요.');
              // 테이블 목록 새로고침
              window.selectStore(selectedStore.id, selectedStore.name);
              return;
            }
          }
        }

        console.log(`🏪 선택된 매장:`, selectedStore);
        console.log(`🏪 선택된 테이블: ${tableName} (번호: ${selectedTableNumber})`);

        // 점유 처리 없이 바로 주문 시작
        console.log(`✅ TLL - 점유 확인 완료, 주문 화면으로 이동`);
        renderOrderScreen(selectedStore, tableName);

      } catch (error) {
        console.error('❌ 테이블 점유 상태 확인 실패:', error);
        // 에러가 발생해도 주문은 계속 진행 (기존 동작 유지)
        renderOrderScreen(selectedStore, tableName);
      }
    });
  } else {
    console.error('❌ startOrderBtn 요소를 찾을 수 없습니다');
  }
};
