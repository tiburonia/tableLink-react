window.TLL = async function TLL() {
  // 1. UI 프레임 먼저 렌더링 (로딩 상태)
  main.innerHTML = `
  <button id="backBtn" onclick="renderMap()"></button>
    <div class="tll-container">
      <h2 style="margin:20px 0 16px 0;font-weight:700;">QR 주문 시뮬레이터 (데스크탑)</h2>
      <label style="display:block;margin-bottom:6px;font-size:15px;">매장 선택</label>
      <select id="storeSelect" style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;" disabled>
        <option value="">매장 정보를 불러오는 중...</option>
      </select>
      <label style="display:block;margin:18px 0 6px 0;font-size:15px;">테이블 번호</label>
      <select id="tableSelect" style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;" disabled>
        <option value="">테이블을 선택하세요</option>
      </select>
      <button id="startOrderBtn" style="width:100%;margin-top:24px;padding:10px 0;font-size:17px;border-radius:10px;background:#ccc;color:#666;border:none;cursor:not-allowed;" disabled>
        주문 시작
      </button>
      <div id="loadingIndicator" style="text-align:center;margin-top:16px;color:#666;font-size:14px;">
        🔄 매장 정보를 불러오고 있습니다...
      </div>
    </div>
    <style>
      .tll-container { max-width:400px;margin:30px auto 0;background:#fff;border-radius:16px;box-shadow:0 2px 18px rgba(30,110,255,0.06);padding:28px 18px 38px 18px;}
      @media (max-width: 480px) { .tll-container { margin-top:10px; padding:12px 4px 20px 4px; } }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #e0e0e0; border-top: 2px solid #297efc; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
    </style>
  `;

  // 2. 비동기로 매장 데이터 로드
  let stores = [];
  try {
    console.log('🌐 TLL - 서버에서 매장 데이터 직접 가져오는 중... (캐시 사용 안함)');
    const response = await fetch('/api/stores', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('매장 데이터 조회 실패');
    }
    
    const data = await response.json();
    if (data.success && data.stores) {
      stores = data.stores;
      console.log('📱 TLL에서 서버 매장 데이터 사용:', stores.length, '개 매장');
    } else {
      throw new Error(data.error || '매장 데이터 형식 오류');
    }
  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    
    // 에러 시 UI 업데이트
    const storeSelect = document.getElementById('storeSelect');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (storeSelect) {
      storeSelect.innerHTML = '<option value="">매장 정보 로드 실패</option>';
      storeSelect.style.color = '#dc3545';
    }
    if (loadingIndicator) {
      loadingIndicator.innerHTML = '❌ 매장 정보를 불러올 수 없습니다.';
      loadingIndicator.style.color = '#dc3545';
    }
    
    alert('스토어 정보를 불러올 수 없습니다.');
    return;
  }

  // 3. 성공 시 UI 업데이트
  const openStores = stores.filter(store => store.isOpen === true);
  const storeOptions = openStores.map(s =>
    `<option value="${s.id}">${s.name}</option>`
  ).join('');

  const storeSelect = document.getElementById('storeSelect');
  const startOrderBtn = document.getElementById('startOrderBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');

  if (storeSelect) {
    storeSelect.innerHTML = `
      <option value="">매장을 선택하세요</option>
      ${storeOptions}
    `;
    storeSelect.disabled = false;
    storeSelect.style.color = '#333';
  }

  if (startOrderBtn) {
    startOrderBtn.style.background = '#297efc';
    startOrderBtn.style.color = '#fff';
    startOrderBtn.style.cursor = 'pointer';
  }

  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }

  // 이벤트 바인딩
  const tableSelect = document.getElementById('tableSelect');

  storeSelect.addEventListener('change', async () => {
    const storeId = Number(storeSelect.value);
    if (!storeId) {
      tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>`;
      tableSelect.disabled = true;
      startOrderBtn.disabled = true;
      return;
    }

    // 선택한 매장 정보 찾기
    const store = stores.find(s => s.id === storeId);

    try {
      // 테이블 정보 서버에서 직접 요청 (캐시 사용 안함)
      console.log(`🌐 TLL - 매장 ${storeId} 테이블 정보 서버에서 직접 조회 중... (캐시 사용 안함)`);
      const response = await fetch(`/api/stores/${storeId}/tables`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('테이블 정보 조회 실패');

      const data = await response.json();
      const tables = data.tables || [];

      console.log(`🏪 ${store.name}: ${tables.length}개 테이블 서버에서 직접 로드 완료`);

      // 실제 테이블 번호로 옵션 생성
      if (tables.length > 0) {
        const tableOptions = tables.map(table => 
          `<option value="${table.tableNumber}" ${table.isOccupied ? 'disabled' : ''}>${table.tableName}${table.isOccupied ? ' (사용중)' : ''}</option>`
        ).join('');

        tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>${tableOptions}`;
      } else {
        // 테이블이 없는 경우 기본값 사용
        console.warn(`⚠️ ${store.name}에 테이블 정보가 없어 기본값 사용`);
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
  });

  tableSelect.addEventListener('change', () => {
    startOrderBtn.disabled = !tableSelect.value;
  });

  startOrderBtn.addEventListener('click', () => {
    const storeId = Number(storeSelect.value);
    const selectedTableNumber = tableSelect.value;
    if (!storeId || !selectedTableNumber) return;

    const store = stores.find(s => s.id === storeId);

    // 🆕 선택한 테이블의 실제 이름 가져오기
    const selectedOption = tableSelect.options[tableSelect.selectedIndex];
    const tableName = selectedOption.textContent.replace(' (사용중)', ''); // "(사용중)" 텍스트 제거

    console.log(`🏪 선택된 테이블: ${tableName} (번호: ${selectedTableNumber})`);

    // 여기서 주문 시작! (테이블 이름으로 전달)
    alert(`[${store.name}] ${tableName} 주문 시작`);
    // 실제 주문 flow 함수로 테이블 이름 전달
    renderOrderScreen(store, tableName);
  });
};