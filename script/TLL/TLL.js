async function TLL() {
  // 캐시에서 스토어 정보 가져오기 (캐시 우선, 없으면 서버에서 가져와서 캐시 저장)
  let stores = [];
  try {
    stores = await cacheManager.getStores();
    console.log('📱 TLL에서 캐시된 매장 데이터 사용:', stores.length, '개 매장');
  } catch (error) {
    console.error('스토어 정보 로딩 실패:', error);
    alert('스토어 정보를 불러올 수 없습니다.');
    return;
  }

  const storeOptions = stores.map(s =>
    `<option value="${s.id}">${s.name}</option>`
  ).join('');

  main.innerHTML = `
  <button id="backBtn" onclick="renderMap()"></button>
    <div class="tll-container">
      <h2 style="margin:20px 0 16px 0;font-weight:700;">QR 주문 시뮬레이터 (데스크탑)</h2>
      <label style="display:block;margin-bottom:6px;font-size:15px;">매장 선택</label>
      <select id="storeSelect" style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;">
        <option value="">매장을 선택하세요</option>
        ${storeOptions}
      </select>
      <label style="display:block;margin:18px 0 6px 0;font-size:15px;">테이블 번호</label>
      <select id="tableSelect" style="width:100%;padding:8px 6px;font-size:15px;border-radius:8px;" disabled>
        <option value="">테이블을 선택하세요</option>
      </select>
      <button id="startOrderBtn" style="width:100%;margin-top:24px;padding:10px 0;font-size:17px;border-radius:10px;background:#297efc;color:#fff;border:none;cursor:pointer;" disabled>
        주문 시작
      </button>
    </div>
    <style>
      .tll-container { max-width:400px;margin:30px auto 0;background:#fff;border-radius:16px;box-shadow:0 2px 18px rgba(30,110,255,0.06);padding:28px 18px 38px 18px;}
      @media (max-width: 480px) { .tll-container { margin-top:10px; padding:12px 4px 20px 4px; } }
    </style>
  `;

  // 이벤트 바인딩
  const storeSelect = document.getElementById('storeSelect');
  const tableSelect = document.getElementById('tableSelect');
  const startOrderBtn = document.getElementById('startOrderBtn');

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
      // 🆕 PostgreSQL에서 실제 테이블 정보 가져오기
      const response = await fetch(`/api/stores/${storeId}/tables`);
      if (!response.ok) throw new Error('테이블 정보 조회 실패');
      
      const data = await response.json();
      const tables = data.tables || [];
      
      console.log(`🏪 ${store.name}: ${tables.length}개 테이블 로드 완료`);
      
      // 실제 테이블 번호로 옵션 생성
      if (tables.length > 0) {
        const tableOptions = tables.map(table => 
          `<option value="${table.tableNumber}">${table.tableName}${table.isOccupied ? ' (사용중)' : ''}</option>`
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
}
