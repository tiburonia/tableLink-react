window.TLL = async function TLL() {
  // 1. UI 프레임 먼저 렌더링 (검색 기능 포함)
  main.innerHTML = `
  <button id="backBtn" onclick="renderMap()"></button>
    <div class="tll-container">
      <h2 style="margin:20px 0 16px 0;font-weight:700;">QR 주문 시뮬레이터 (데스크탑)</h2>
      <label style="display:block;margin-bottom:6px;font-size:15px;">매장 검색</label>
      <div style="position:relative;">
        <input 
          id="storeSearchInput" 
          type="text" 
          placeholder="매장 이름을 입력하세요" 
          style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;border:1px solid #ddd;"
        />
        <div id="storeSearchResults" style="position:absolute;top:100%;left:0;right:0;background:white;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;max-height:200px;overflow-y:auto;z-index:1000;display:none;">
        </div>
      </div>
      <div id="selectedStore" style="margin-top:10px;padding:8px;background:#f0f8ff;border-radius:8px;display:none;">
        <span style="font-size:14px;color:#666;">선택된 매장:</span>
        <span id="selectedStoreName" style="font-weight:bold;margin-left:5px;"></span>
      </div>
      <label style="display:block;margin:18px 0 6px 0;font-size:15px;">테이블 번호</label>
      <select id="tableSelect" style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;" disabled>
        <option value="">매장을 먼저 선택하세요</option>
      </select>
      <button id="startOrderBtn" style="width:100%;margin-top:24px;padding:10px 0;font-size:17px;border-radius:10px;background:#ccc;color:#666;border:none;cursor:not-allowed;" disabled>
        주문 시작
      </button>
    </div>
    <style>
      .tll-container { max-width:400px;margin:30px auto 0;background:#fff;border-radius:16px;box-shadow:0 2px 18px rgba(30,110,255,0.06);padding:28px 18px 38px 18px;}
      @media (max-width: 480px) { .tll-container { margin-top:10px; padding:12px 4px 20px 4px; } }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #e0e0e0; border-top: 2px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
      .store-search-item { padding:10px; cursor:pointer; border-bottom:1px solid #f0f0f0; }
      .store-search-item:hover { background:#f8f9fa; }
      .store-search-item:last-child { border-bottom:none; }
    </style>
  `;

  // 2. 검색 기능 설정
  let selectedStore = null;
  let searchTimeout = null;

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
    selectedStore = { id: storeId, name: storeName };
    
    // UI 업데이트
    storeSearchInput.value = storeName;
    storeSearchResults.style.display = 'none';
    selectedStoreDiv.style.display = 'block';
    selectedStoreName.textContent = storeName;

    console.log(`✅ TLL - 매장 선택: ${storeName} (ID: ${storeId})`);

    // 테이블 정보 로드
    try {
      console.log(`🌐 TLL - 매장 ${storeId} 테이블 정보 서버에서 직접 조회 중...`);
      const response = await fetch(`/api/stores/${storeId}/tables`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('테이블 정보 조회 실패');

      const data = await response.json();
      const tables = data.tables || [];

      console.log(`🏪 ${storeName}: ${tables.length}개 테이블 서버에서 직접 로드 완료`);

      // 실제 테이블 번호로 옵션 생성
      if (tables.length > 0) {
        const tableOptions = tables.map(table => 
          `<option value="${table.tableNumber}" ${table.isOccupied ? 'disabled' : ''}>${table.tableName}${table.isOccupied ? ' (사용중)' : ''}</option>`
        ).join('');

        tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>${tableOptions}`;
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
      console.error('테이블 정보 로드 오류:', error);
      // 에러 시 기본값 사용
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
    }
  });

  if (startOrderBtn) {
    startOrderBtn.addEventListener('click', () => {
      if (!selectedStore || !tableSelect.value) {
        alert('매장과 테이블을 모두 선택해주세요.');
        return;
      }

      const selectedTableNumber = tableSelect.value;
      
      // 선택한 테이블의 실제 이름 가져오기
      const selectedOption = tableSelect.options[tableSelect.selectedIndex];
      const tableName = selectedOption.textContent.replace(' (사용중)', ''); // "(사용중)" 텍스트 제거

      console.log(`🏪 선택된 매장: ${selectedStore.name} (ID: ${selectedStore.id})`);
      console.log(`🏪 선택된 테이블: ${tableName} (번호: ${selectedTableNumber})`);

      // 여기서 주문 시작! (테이블 이름으로 전달)
      alert(`[${selectedStore.name}] ${tableName} 주문 시작`);
      // 실제 주문 flow 함수로 테이블 이름 전달
      renderOrderScreen(selectedStore, tableName);
    });
  } else {
    console.error('❌ startOrderBtn 요소를 찾을 수 없습니다');
  }
};