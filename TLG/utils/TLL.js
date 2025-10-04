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
    background: #f3f4f6;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tll-header {
    width: 100%;
    max-width: 480px;
    margin-bottom: 20px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #374151;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s ease;
    margin-bottom: 10px;
  }
  .back-button:hover {
    color: #1e40af;
  }

  .header-title {
    text-align: center;
    color: #1f2937;
  }

  .tll-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 4px 0;
  }

  .title-icon {
    font-size: 26px;
  }

  .tll-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .tll-container {
    width: 100%;
    max-width: 480px;
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  }

  .section-header {
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-input {
    width: 100%;
    padding: 14px 16px;
    font-size: 15px;
    border: 1.5px solid #d1d5db;
    border-radius: 12px;
    background: #f9fafb;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #297efc;
    background: white;
    box-shadow: 0 0 0 3px rgba(41, 126, 252, 0.15);
  }

  .store-search-item {
    padding: 12px 14px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .store-search-item:hover {
    background: #f9fafb;
  }

  .selected-store {
    background: #297efc;
    border-radius: 12px;
    padding: 12px 14px;
    color: white;
    margin-top: 10px;
  }

  .selected-store-header {
    font-size: 13px;
    opacity: 0.85;
    margin-bottom: 4px;
  }

  .selected-store-name {
    font-size: 17px;
    font-weight: 600;
  }

  .table-select {
    width: 100%;
    padding: 14px 16px;
    font-size: 15px;
    border: 1.5px solid #d1d5db;
    border-radius: 12px;
    background: #fff;
    transition: all 0.2s ease;
  }

  .table-select:focus {
    border-color: #297efc;
    box-shadow: 0 0 0 3px rgba(41, 126, 252, 0.1);
    outline: none;
  }

  .start-order-btn {
    width: 100%;
    margin-top: 20px;
    background: #297efc;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    padding: 14px 0;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .start-order-btn:hover:enabled {
    background: #1e40af;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(30, 64, 175, 0.25);
  }

  .start-order-btn:disabled {
    background: #d1d5db;
    color: #6b7280;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .tll-container {
      padding: 20px 16px;
    }
    .tll-title {
      font-size: 22px;
    }
    .start-order-btn {
      font-size: 15px;
      padding: 12px;
    }
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
    window.preselectedStoreForTLL = preselectedStore;
  } else {
    // 여러 전역 변수에서 매장 정보 찾기
    preselectedStore = window.preselectedStoreForTLL || 
                      window.selectedStore || 
                      window.currentStoreForTLL || 
                      window.currentStore;

    if (preselectedStore) {
      console.log(`🏪 TLL - 전역 매장 정보 사용: ${preselectedStore.name} (ID: ${preselectedStore.id})`);
    }
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
  if (preselectedStore && preselectedStore.id && preselectedStore.name) {
    console.log(`🎯 TLL - 매장 자동 선택 시작: ${preselectedStore.name} (ID: ${preselectedStore.id})`);

    // DOM 로딩 완료를 기다리는 함수
    const autoSelectStore = (retryCount = 0) => {
      console.log('🔄 매장 자동 선택 시도 중...', `(${retryCount + 1}번째 시도)`);

      // 최대 50번 재시도 (5초)
      if (retryCount >= 50) {
        console.error('❌ DOM 요소 로딩 시간 초과 - 매장 자동 선택 중단');
        return;
      }

      // DOM 요소가 준비되지 않았다면 재시도
      // '필요한_DOM_선택자'는 실제 DOM 요소의 선택자로 대체되어야 합니다.
      // 여기서는 예시로 storeSearchInput, selectedStoreDiv, selectedStoreName을 사용합니다.
      const storeSearchInput = document.getElementById('storeSearchInput');
      const selectedStoreDiv = document.getElementById('selectedStore');
      const selectedStoreName = document.getElementById('selectedStoreName');

      if (!storeSearchInput || !selectedStoreDiv || !selectedStoreName) {
        console.warn('⚠️ DOM 요소가 아직 준비되지 않음, 재시도...', `(${retryCount + 1}/50)`);
        setTimeout(() => autoSelectStore(retryCount + 1), 100);
        return;
      }

      if (typeof window.selectStore === 'function') {
        console.log('✅ selectStore 함수 발견, 매장 자동 선택 실행');
        window.selectStore(preselectedStore.id, preselectedStore.name);

        // UI 강제 업데이트 (selectStore가 완료되지 않을 경우 대비)
        setTimeout(() => {
          if (selectedStoreDiv.style.display !== 'block') {
            console.log('🔧 UI 강제 업데이트 실행');
            storeSearchInput.value = preselectedStore.name;
            selectedStoreDiv.style.display = 'block';
            selectedStoreName.textContent = preselectedStore.name;

            // 테이블 셀렉트 활성화
            const tableSelect = document.getElementById('tableSelect');
            if (tableSelect) {
              tableSelect.disabled = false;
              // 기본 테이블 옵션 설정
              const defaultOptions = [
                '<option value="">테이블을 선택하세요</option>',
                '<option value="1">1번</option>',
                '<option value="2">2번</option>',
                '<option value="3">3번</option>',
                '<option value="4">4번</option>',
                '<option value="5">5번</option>'
              ].join('');
              tableSelect.innerHTML = defaultOptions;
            }
            console.log('✅ 매장 정보 UI 강제 업데이트 완료');
          }
        }, 800);

      } else {
        console.error('❌ selectStore 함수를 찾을 수 없음, 재시도 중...');
        setTimeout(() => autoSelectStore(retryCount + 1), 200);
      }
    };

    // DOM이 완전히 로드된 후 매장 자동 선택 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoSelectStore);
    } else {
      // 이미 로드된 경우 바로 실행
      autoSelectStore();
    }
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

      const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query)}&limit=20`, {
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

    // 지도 화면으로 이동 (로그인 상태 유지)
    try {
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        console.error('❌ renderMap 함수를 찾을 수 없음');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ renderMap 실행 실패:', error);
      window.location.reload();
    }

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
      // 매장 ID 정규화
      const normalizedStoreId = parseInt(storeId);

      if (!normalizedStoreId || !storeName) {
        console.error('❌ 유효하지 않은 매장 정보:', { storeId, storeName });
        alert('유효하지 않은 매장 정보입니다.');
        return;
      }

      // 매장 정보 조회
      console.log(`🔍 매장 ${normalizedStoreId} 기본 정보 조회 중...`);
      const storeResponse = await fetch(`/api/stores/${normalizedStoreId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        if (storeData.success && storeData.store) {
          selectedStore = {
            ...storeData.store,
            id: normalizedStoreId,
            store_id: normalizedStoreId
          };
          console.log(`✅ 매장 기본 정보 로드 완료: ${selectedStore.name}`);
        }
      }

      // 매장 정보가 없으면 기본값 설정
      if (!selectedStore) {
        selectedStore = { 
          id: normalizedStoreId,
          store_id: normalizedStoreId,
          name: storeName, 
          menu: [],
          isOpen: true,
          category: '기타',
          address: '주소 정보 없음'
        };
        console.log(`⚠️ 매장 정보 없음, 기본값 사용: ${storeName}`);
      }

      // 전역에 선택된 매장 저장 (여러 변수로 중복 저장)
      window.selectedStore = selectedStore;
      window.preselectedStoreForTLL = selectedStore;
      window.currentStoreForTLL = selectedStore;

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