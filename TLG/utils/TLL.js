// TLL (TableLink Live) 주문 시스템
window.TLL = async function TLL(preselectedStore = null) {
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

  // 토스페이먼츠 모듈 미리 로드
  if (!window.requestTossPayment || !window.initTossPayments) {
    console.log('🔄 TLL - 토스페이먼츠 모듈 미리 로드 중...');
    const script = document.createElement('script');
    script.src = '/TLG/pages/store/pay/tossPayments.js';
    script.async = false;
    document.head.appendChild(script);
  }

  // 미리 선택된 매장이 있다면 초기화
  if (preselectedStore) {
    console.log(`🏪 TLL - 매장 미리 선택됨: ${preselectedStore.name} (ID: ${preselectedStore.id})`);
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

  // 미리 선택된 매장이 있다면 DOM 요소 초기화 후 자동 선택
  if (preselectedStore) {
    console.log(`🎯 TLL - 매장 자동 선택 시작: ${preselectedStore.name} (ID: ${preselectedStore.id})`);
    setTimeout(() => {
      if (typeof window.selectStore === 'function') {
        console.log('✅ selectStore 함수 발견, 매장 자동 선택 실행');
        window.selectStore(preselectedStore.id, preselectedStore.name);
      } else {
        console.error('❌ selectStore 함수를 찾을 수 없음');
      }
    }, 300); // DOM 완전 렌더링 대기
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

      const response = await fetch(`/api/stores/search/${encodeURIComponent(query)}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });


// 토스페이먼츠 결제 성공 처리 함수 (TLL 스키마에 맞게 수정)
window.handleTossPaymentSuccess = async function(data) {
  console.log('✅ 토스페이먼츠 결제 성공 처리:', data);

  try {
    const { paymentKey, orderId, amount } = data;

    if (!paymentKey || !orderId || !amount) {
      throw new Error('결제 정보가 올바르지 않습니다');
    }

    console.log('🔄 결제 승인 처리 시작:', { paymentKey, orderId, amount });

    // TLL 주문인지 확인
    const isTLLOrder = orderId.startsWith('TLL_');

    if (isTLLOrder) {
      // TLL 결제 확인 API 호출
      const tllOrderData = JSON.parse(sessionStorage.getItem('tllPendingOrder') || '{}');
      const checkId = tllOrderData.checkId || orderId.split('_')[1];

      const confirmResponse = await fetch('/api/tll/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_id: parseInt(checkId),
          payment_key: paymentKey,
          order_id: orderId,
          amount: parseInt(amount)
        })
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'TLL 결제 확인 실패');
      }

      const confirmResult = await confirmResponse.json();
      console.log('✅ TLL 결제 확인 완료:', confirmResult);

      // TLL 주문 데이터 정리
      sessionStorage.removeItem('tllPendingOrder');
      console.log('✅ TLL 주문 완료 처리');

    } else {
      // 일반 주문 - 기존 처리 방식
      const confirmResult = await window.confirmTossPayment(paymentKey, orderId, amount);

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || '결제 승인 실패');
      }

      console.log('✅ 일반 결제 승인 완료:', confirmResult);

      // 일반 주문 데이터 정리
      sessionStorage.removeItem('pendingOrderData');
      console.log('✅ 일반 주문 완료 처리');
    }

    // 성공 알림
    alert(`✅ 결제가 완료되었습니다!\n주문번호: ${orderId}\n결제금액: ₩${parseInt(amount).toLocaleString()}`);

    // 메인 화면으로 이동
    renderMap();

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
    renderMap();
  }
};

// 토스페이먼츠 결제 실패 처리 함수
function handleTossPaymentFailure(data) {
  console.log('❌ 토스페이먼츠 결제 실패 처리:', data);

  const { message } = data;

  if (typeof renderPaymentFailure === 'function') {
    renderPaymentFailure({ message }, {});
  } else {
    alert('결제가 실패했습니다: ' + message);
    renderMap();
  }
}

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
      // 먼저 매장 정보 조회
      console.log(`🔍 매장 ${storeId} 기본 정보 조회 중...`);
      const storeResponse = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        if (storeData.success && storeData.store) {
          selectedStore = storeData.store;
          console.log(`✅ 매장 기본 정보 로드 완료: ${selectedStore.name}`);
        }
      }

      // 매장 정보가 없으면 기본값 설정
      if (!selectedStore) {
        selectedStore = { 
          id: parseInt(storeId), 
          name: storeName, 
          menu: [],
          isOpen: true 
        };
        console.log(`⚠️ 매장 정보 없음, 기본값 사용: ${storeName}`);
      }

      // UI 업데이트
      storeSearchInput.value = storeName;
      storeSearchResults.style.display = 'none';
      selectedStoreDiv.style.display = 'block';
      selectedStoreName.textContent = storeName;

      // 테이블 정보 조회
      console.log(`🪑 매장 ${storeId} 테이블 정보 조회 중...`);
      const tablesResponse = await fetch(`/api/tables/stores/${storeId}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!tablesResponse.ok) {
        const errorText = await tablesResponse.text();
        throw new Error(`테이블 API 오류 (${tablesResponse.status}): ${errorText}`);
      }

      const tablesData = await tablesResponse.json();
      if (!tablesData.success) {
        throw new Error(`테이블 조회 실패: ${tablesData.error}`);
      }

      const tables = tablesData.tables || [];
      console.log(`🏪 ${storeName}: 테이블 ${tables.length}개 로드 완료`);

      if (tables.length > 0) {
        // 사용 가능한 테이블과 점유중인 테이블 분리
        const availableTables = tables.filter(table => !table.isOccupied);
        const occupiedTables = tables.filter(table => table.isOccupied);

        console.log(`📊 테이블 현황 - 사용가능: ${availableTables.length}개, 사용중: ${occupiedTables.length}개`);

        // 테이블 옵션 생성
        const availableOptions = availableTables.map(table => 
          `<option value="${table.tableNumber}">${table.tableName || table.tableNumber + '번'}</option>`
        );

        const occupiedOptions = occupiedTables.map(table => {
          const occupiedTime = table.occupiedSince ? 
            ` (${new Date(table.occupiedSince).toLocaleTimeString()}부터)` : '';
          return `<option value="${table.tableNumber}" disabled>${table.tableName || table.tableNumber + '번'} - 사용중${occupiedTime}</option>`;
        });

        const allOptions = [
          '<option value="">테이블을 선택하세요</option>',
          ...availableOptions,
          ...occupiedOptions
        ].join('');

        tableSelect.innerHTML = allOptions;

        if (availableTables.length === 0) {
          console.warn(`⚠️ ${storeName}: 사용 가능한 테이블이 없습니다`);
          tableSelect.innerHTML = '<option value="">사용 가능한 테이블이 없습니다</option>';
        }
      } else {
        // 테이블 정보가 없을 때 기본 5개 테이블 표시 (store_tables 기본값에 맞춤)
        console.warn(`⚠️ ${storeName}: 테이블 정보 없음, 기본 5개 테이블 사용`);
        const defaultTables = Array.from({ length: 5 }, (_, i) => i + 1);
        const defaultOptions = [
          '<option value="">테이블을 선택하세요</option>',
          ...defaultTables.map(num => `<option value="${num}">${num}번</option>`)
        ].join('');
        tableSelect.innerHTML = defaultOptions;
      }

      tableSelect.disabled = false;
      startOrderBtn.disabled = true;

      console.log(`✅ TLL - 매장 ${storeName} 선택 완료`);

    } catch (error) {
      console.error('❌ TLL - 매장 정보 로드 오류:', error);

      // 에러 발생 시 기본 설정으로 폴백
      selectedStore = { 
        id: parseInt(storeId), 
        name: storeName, 
        menu: [],
        isOpen: true 
      };

      // UI 업데이트
      storeSearchInput.value = storeName;
      storeSearchResults.style.display = 'none';
      selectedStoreDiv.style.display = 'block';
      selectedStoreName.textContent = storeName;

      // 기본 테이블 5개 설정 (store_tables 기본값에 맞춤)
      const defaultTables = Array.from({ length: 5 }, (_, i) => i + 1);
      const defaultOptions = [
        '<option value="">테이블을 선택하세요</option>',
        ...defaultTables.map(num => `<option value="${num}">${num}번</option>`)
      ].join('');
      tableSelect.innerHTML = defaultOptions;

      tableSelect.disabled = false;
      startOrderBtn.disabled = true;

      console.log(`⚠️ TLL - 에러 복구: 매장 ${storeName} 기본 설정으로 진행`);
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

  // TLL 주문 시작 로직 변경: 장바구니 기반으로 수정
  if (startOrderBtn) {
    startOrderBtn.addEventListener('click', async () => {
      if (!selectedStore || !tableSelect.value) {
        alert('매장과 테이블을 선택해주세요.');
        return;
      }

      try {
        startOrderBtn.disabled = true;
        startOrderBtn.innerHTML = `
          <div class="loading-spinner"></div>
          <span class="btn-text">주문 화면 로딩 중...</span>
        `;

        const tableNumber = parseInt(tableSelect.value);
        const tableName = `${tableNumber}번 테이블`;

        console.log(`🚀 TLL - 주문 시작: 매장 ${selectedStore.name}, 테이블 ${tableName}`);

        // 사용자 정보 확인
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.id) {
          alert('로그인이 필요합니다.');
          renderLogin();
          return;
        }

        // TLL 주문 화면으로 이동 (올바른 테이블 정보 전달)
        if (typeof renderOrderScreen === 'function') {
          renderOrderScreen(selectedStore, tableName, tableNumber);
        } else {
          console.error('❌ renderOrderScreen 함수를 찾을 수 없습니다');
          alert('주문 시스템을 로드할 수 없습니다.');
        }

      } catch (error) {
        console.error('❌ TLL - 주문 시작 실패:', error);
        alert('주문 시작 중 오류가 발생했습니다: ' + error.message);

        startOrderBtn.disabled = false;
        startOrderBtn.innerHTML = `
          <span class="btn-icon">🚀</span>
          <span class="btn-text">주문 시작하기</span>
          <div class="btn-shine"></div>
        `;
      }
    });
  }
};

// TLL 테이블 선택 처리
window.selectTLLTable = function(tableName, tableNumber) {
  console.log(`🏪 선택된 테이블: ${tableName} (번호: ${tableNumber})`);
  console.log('✅ TLL - 주문 화면으로 이동');

  // 현재 선택된 매장 정보가 있는지 확인
  if (!window.selectedStore) {
    console.error('❌ 선택된 매장 정보가 없습니다');
    alert('매장을 먼저 선택해주세요.');
    return;
  }

  // 테이블 번호 검증 및 정규화
  const validTableNumber = tableNumber || parseInt(tableName?.replace(/[^0-9]/g, '')) || 1;
  const validTableName = tableName || `${validTableNumber}번`;

  console.log(`🔍 TLL 테이블 정보 검증: ${validTableName} (번호: ${validTableNumber})`);

  // TLL 주문 화면으로 이동 (올바른 테이블 정보 전달)
  window.renderOrderScreen(window.selectedStore, validTableName, validTableNumber);
};

// 앱 초기화 함수
async function initApp() {
  console.log('🚀 앱 초기화 시작');

  // postMessage 리스너 추가 (결제 완료 후 리디렉션 처리)
  window.addEventListener('message', (event) => {
    console.log('📨 postMessage 수신:', event.data);

    // 토스페이먼츠 결제 완료 처리
    if (event.data.type === 'TOSS_PAYMENT_SUCCESS') {
      console.log('✅ 토스페이먼츠 결제 성공 postMessage 수신:', event.data);

      // 결제 승인 및 주문 처리
      handleTossPaymentSuccess(event.data);
      return;
    }

    // 토스페이먼츠 결제 실패 처리
    if (event.data.type === 'TOSS_PAYMENT_FAILURE') {
      console.log('❌ 토스페이먼츠 결제 실패 postMessage 수신:', event.data);

      // 결제 실패 처리
      handleTossPaymentFailure(event.data);
      return;
    }

    // 기존 결제 완료 후 리디렉션 처리
    if (event.data.type === 'PAYMENT_SUCCESS_REDIRECT' || event.data.type === 'PAYMENT_REDIRECT') {
      console.log('💳 결제 완료 후 리디렉션 요청:', event.data);

      if (event.data.action === 'navigate') {
        if (event.data.url === '/') {
          renderMap();
        } else if (event.data.url === '/mypage') {
          if (typeof renderMyPage === 'function') {
            renderMyPage();
          } else {
            renderMap();
          }
        }
      }
    }
  });

  // 사용자 정보 확인
  const userInfo = getUserInfo();

  if (userInfo && userInfo.id) {
    console.log('✅ 기존 사용자 정보 발견:', userInfo.id);
    window.userInfo = userInfo;
    renderMap();
  } else {
    console.log('ℹ️ 저장된 사용자 정보 없음 - 로그인 화면 표시');
    renderLogin();
  }

  console.log('✅ 앱 초기화 완료');
}

// TLL 함수를 전역에 안전하게 등록
(function() {
  console.log('🔧 TLL 함수 전역 등록 시작...');
  
  // 함수가 이미 정의되었는지 확인
  if (typeof window.TLL === 'function') {
    console.log('✅ TLL 함수가 이미 등록되어 있음');
    return;
  }
  
  // TLL 함수 등록 확인
  if (typeof TLL !== 'undefined') {
    window.TLL = TLL;
    console.log('✅ TLL 함수 전역 등록 완료');
    console.log('🔍 등록된 TLL 함수 타입:', typeof window.TLL);
  } else {
    console.error('❌ TLL 함수 정의를 찾을 수 없음');
  }
})();