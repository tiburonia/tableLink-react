async function TLL() {
  // 🍪 쿠키에서 로그인 상태 확인
  const loginCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('userInfo='));

  if (!loginCookie) {
    // 쿠키가 없으면 로그인 페이지로 라우팅
    console.log('❌ 로그인 쿠키 없음 - 로그인 페이지로 이동');
    renderLogin();
    return;
  }

  try {
    // 쿠키에서 사용자 정보 파싱
    const userInfoString = decodeURIComponent(loginCookie.split('=')[1]);
    window.userInfo = JSON.parse(userInfoString);
    console.log('🍪 쿠키에서 사용자 정보 로드:', userInfo.id);
  } catch (error) {
    console.error('❌ 쿠키 파싱 실패:', error);
    renderLogin();
    return;
  }

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

  storeSelect.addEventListener('change', () => {
    const storeId = Number(storeSelect.value);
    if (!storeId) {
      tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>`;
      tableSelect.disabled = true;
      startOrderBtn.disabled = true;
      return;
    }
    // 선택한 매장 정보 찾기
    const store = stores.find(s => s.id === storeId);
    // 테이블 옵션 채우기 (기본값: 10개 테이블)
    let tableNum = Array.from({ length: 10 }, (_, i) => i + 1);
    tableSelect.innerHTML = `<option value="">테이블을 선택하세요</option>` +
      tableNum.map(num => `<option value="${num}">${num}번</option>`).join('');
    tableSelect.disabled = false;
    startOrderBtn.disabled = true;
  });

  tableSelect.addEventListener('change', () => {
    startOrderBtn.disabled = !tableSelect.value;
  });

  startOrderBtn.addEventListener('click', () => {
    const storeId = Number(storeSelect.value);
    const tableNum = tableSelect.value;
    if (!storeId || !tableNum) return;
    const store = stores.find(s => s.id === storeId);
    // 여기서 주문 시작! (예: renderOrderScreen(store, tableNum) 등)
    alert(`[${store.name}] ${tableNum}번 테이블 주문 시작`);
    // 실제 주문 flow 함수로 넘기면 됨
    renderOrderScreen(store, tableNum);
  });
}
