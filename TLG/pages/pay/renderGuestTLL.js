
/**
 * 비회원 전용 TLL QR 주문 화면 렌더링
 */

export async function renderGuestTLL() {
  const main = document.getElementById('main');
  if (!main) return;

  console.log('🎫 비회원 TLL QR 주문 화면 렌더링 시작');

 

  main.innerHTML = `
    <div class="guest-tll-layout">
      <!-- 헤더 -->
      <header class="guest-tll-header">
        <button id="guestTllBackBtn" class="native-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="native-header-title">
          <h1>비회원 QR 주문</h1>
        </div>
        <div class="header-spacer"></div>
      </header>

      <!-- 메인 컨텐츠 -->
      <div class="guest-tll-content">
        <!-- 비회원 안내 카드 -->
        <div class="guest-info-card">
          <div class="guest-badge">🎫 비회원 모드</div>
          <p class="guest-notice">QR 코드를 스캔하여 주문을 시작하세요</p>
        </div>

        <!-- 매장 검색 섹션 -->
        <div class="native-section">
          <div class="section-label">
            <span class="label-icon">🏪</span>
            <span class="label-text">매장 선택</span>
          </div>
          
          <div class="native-search-wrapper">
            <div class="search-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9CA3AF" stroke-width="2"/>
                <path d="M21 21L16.65 16.65" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <input 
              id="guestStoreSearchInput" 
              type="text" 
              placeholder="매장 이름 검색..." 
              class="native-search-input"
            />
            <div id="guestStoreSearchResults" class="native-search-results"></div>
          </div>

          <!-- 선택된 매장 표시 -->
          <div id="guestSelectedStore" class="selected-store-card" style="display:none;">
            <div class="selected-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="selected-info">
              <div class="selected-label">선택된 매장</div>
              <div id="guestSelectedStoreName" class="selected-name"></div>
            </div>
          </div>
        </div>

        <!-- 테이블 선택 섹션 -->
        <div class="native-section">
          <div class="section-label">
            <span class="label-icon">🪑</span>
            <span class="label-text">테이블 선택</span>
          </div>
          
          <div class="native-select-wrapper">
            <select id="guestTableSelect" class="native-select" disabled>
              <option value="">매장을 먼저 선택하세요</option>
            </select>
            <div class="select-arrow-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 고정 버튼 -->
      <div class="guest-tll-footer">
        <button id="guestStartOrderBtn" class="native-primary-btn" disabled>
          <span class="btn-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>주문 시작하기</span>
          </span>
        </button>
      </div>
    </div>

    ${getGuestTLLStyles()}
  `;

  // 이벤트 리스너 설정
  setupEventListeners();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  let selectedStoreId = null;
  let selectedTableNumber = null;

  // 뒤로가기 버튼
  const backBtn = document.getElementById('guestTllBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (typeof window.renderLogin === 'function') {
        window.renderLogin();
      }
    });
  }

  // 매장 검색 입력
  const searchInput = document.getElementById('guestStoreSearchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchStores(e.target.value);
      }, 300);
    });
  }

  // 주문 시작 버튼
  const startOrderBtn = document.getElementById('guestStartOrderBtn');
  if (startOrderBtn) {
    startOrderBtn.addEventListener('click', async () => {
      if (!selectedStoreId || !selectedTableNumber) {
        alert('매장과 테이블을 선택해주세요.');
        return;
      }

      try {
        startOrderBtn.disabled = true;
        startOrderBtn.innerHTML = `
          <span class="btn-content">
            <div class="loading-spinner"></div>
            <span>로딩 중...</span>
          </span>
        `;

        // 비회원 전용 주문 화면으로 이동
        const store = { id: selectedStoreId };
        const tableName = `${selectedTableNumber}번`;

        if (typeof window.renderGuestOrderScreen === 'function') {
          await window.renderGuestOrderScreen(store, tableName, selectedTableNumber);
        } else {
          // 비회원 주문 화면 모듈 동적 로드
          const script = document.createElement('script');
          script.type = 'module';
          script.src = '/TLG/pages/pay/renderGuestOrderScreen.js';
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          if (typeof window.renderGuestOrderScreen === 'function') {
            await window.renderGuestOrderScreen(store, tableName, selectedTableNumber);
          }
        }
      } catch (error) {
        console.error('❌ 주문 시작 실패:', error);
        alert('주문을 시작할 수 없습니다. 다시 시도해주세요.');
        startOrderBtn.disabled = false;
        startOrderBtn.innerHTML = `
          <span class="btn-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>주문 시작하기</span>
          </span>
        `;
      }
    });
  }

  // 테이블 선택
  const tableSelect = document.getElementById('guestTableSelect');
  if (tableSelect) {
    tableSelect.addEventListener('change', (e) => {
      selectedTableNumber = parseInt(e.target.value);
      updateStartButton(selectedStoreId && selectedTableNumber);
    });
  }

  /**
   * 매장 검색
   */
  async function searchStores(keyword) {
    if (!keyword || keyword.length < 1) {
      document.getElementById('guestStoreSearchResults').style.display = 'none';
      return;
    }

    try {
      const response = await fetch(`/api/stores/search?query=${encodeURIComponent(keyword)}`);
      const data = await response.json();

      if (data.success && data.stores) {
        displaySearchResults(data.stores);
      }
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error);
    }
  }

  /**
   * 검색 결과 표시
   */
  function displaySearchResults(stores) {
    const resultsContainer = document.getElementById('guestStoreSearchResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (stores.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E5E7EB" stroke-width="2"/>
            <path d="M12 8V12M12 16H12.01" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>검색 결과가 없습니다</p>
        </div>
      `;
      resultsContainer.style.display = 'block';
      return;
    }

    stores.forEach(store => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'native-search-item';
      itemDiv.innerHTML = `
        <div class="search-item-icon">🏪</div>
        <div class="search-item-info">
          <div class="search-item-name">${store.name}</div>
          <div class="search-item-detail">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
        </div>
        <div class="search-item-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;

      itemDiv.addEventListener('click', async () => {
        await selectStore(store);
      });

      resultsContainer.appendChild(itemDiv);
    });

    resultsContainer.style.display = 'block';
  }

  /**${selectedStoreId}
   * 매장 선택
   */
  async function selectStore(store) {
    selectedStoreId = store.id;

    // UI 업데이트
    document.getElementById('guestStoreSearchInput').value = store.name;
    document.getElementById('guestStoreSearchResults').style.display = 'none';
    document.getElementById('guestSelectedStore').style.display = 'flex';
    document.getElementById('guestSelectedStoreName').textContent = store.name;

    // 테이블 목록 로드
    try {
          const response = await fetch(`/api/tables/stores/${selectedStoreId}?_t=${Date.now()}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
      const data = await response.json();

      if (data.success && data.tables) {
        updateTableOptions(data.tables);
      }
    } catch (error) {
      console.error('❌ 테이블 목록 로드 실패:', error);
      alert('테이블 목록을 불러올 수 없습니다.');
    }
  }

  /**
   * 테이블 옵션 업데이트
   */
  function updateTableOptions(tables) {
    const tableSelect = document.getElementById('guestTableSelect');
    if (!tableSelect) return;

    let optionsHTML = '<option value="">테이블을 선택하세요</option>';
    
    tables.forEach(table => {
      optionsHTML += `<option value="${table.id}">${table.tableName}</option>`;
    });

    tableSelect.innerHTML = optionsHTML;
    tableSelect.disabled = false;
  }

  /**
   * 주문 시작 버튼 상태 업데이트
   */
  function updateStartButton(enabled) {
    const startBtn = document.getElementById('guestStartOrderBtn');
    if (!startBtn) return;

    startBtn.disabled = !enabled;
    if (enabled) {
      startBtn.classList.add('enabled');
    } else {
      startBtn.classList.remove('enabled');
    }
  }
}

/**
 * 스타일
 */
function getGuestTLLStyles() {
  return `
    <style>
      .guest-tll-layout {
        min-height: 100vh;
        background: linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
      }

      .guest-tll-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: saturate(180%) blur(20px);
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .native-back-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        color: #1F2937;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        transition: all 0.2s;
      }

      .native-back-btn:active {
        background: rgba(0, 0, 0, 0.05);
        transform: scale(0.95);
      }

      .native-header-title h1 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: #1F2937;
      }

      .header-spacer {
        width: 40px;
      }

      .guest-tll-content {
        flex: 1;
        padding: 20px 20px 100px 20px;
        max-width: 600px;
        width: 100%;
        margin: 0 auto;
      }

      .guest-info-card {
        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
        border-radius: 20px;
        padding: 24px;
        text-align: center;
        margin-bottom: 28px;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      }

      .guest-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 12px;
      }

      .guest-notice {
        color: rgba(255, 255, 255, 0.95);
        font-size: 15px;
        margin: 0;
        line-height: 1.5;
      }

      .native-section {
        margin-bottom: 28px;
      }

      .section-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .label-icon {
        font-size: 20px;
      }

      .label-text {
        font-size: 15px;
        font-weight: 600;
        color: #374151;
      }

      .native-search-wrapper {
        position: relative;
      }

      .search-icon-wrapper {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        pointer-events: none;
        z-index: 1;
      }

      .native-search-input {
        width: 100%;
        padding: 16px 16px 16px 48px;
        font-size: 16px;
        font-weight: 500;
        color: #1F2937;
        background: white;
        border: 2px solid #E5E7EB;
        border-radius: 16px;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .native-search-input:focus {
        outline: none;
        border-color: #667EEA;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .native-search-results {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
        max-height: 320px;
        overflow-y: auto;
        z-index: 50;
        display: none;
      }

      .search-empty {
        padding: 40px 20px;
        text-align: center;
        color: #9CA3AF;
      }

      .search-empty p {
        margin: 12px 0 0 0;
        font-size: 14px;
        font-weight: 500;
      }

      .native-search-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid #F3F4F6;
      }

      .native-search-item:last-child {
        border-bottom: none;
      }

      .native-search-item:active {
        background: #F9FAFB;
      }

      .search-item-icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      .search-item-info {
        flex: 1;
        min-width: 0;
      }

      .search-item-name {
        font-size: 15px;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 2px;
      }

      .search-item-detail {
        font-size: 13px;
        color: #6B7280;
      }

      .selected-store-card {
        display: none;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        padding: 16px;
        border-radius: 16px;
        margin-top: 12px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .selected-badge {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .selected-info {
        flex: 1;
      }

      .selected-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 2px;
        text-transform: uppercase;
      }

      .selected-name {
        font-size: 16px;
        font-weight: 700;
        color: white;
      }

      .native-select-wrapper {
        position: relative;
      }

      .native-select {
        width: 100%;
        padding: 16px 48px 16px 16px;
        font-size: 16px;
        font-weight: 500;
        color: #1F2937;
        background: white;
        border: 2px solid #E5E7EB;
        border-radius: 16px;
        appearance: none;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .native-select:focus {
        outline: none;
        border-color: #667EEA;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .native-select:disabled {
        background: #F9FAFB;
        color: #9CA3AF;
        cursor: not-allowed;
      }

      .select-arrow-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #6B7280;
      }

      .guest-tll-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: saturate(180%) blur(20px);
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        padding: 16px 20px;
        padding-bottom: max(16px, env(safe-area-inset-bottom));
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
      }

      .native-primary-btn {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        display: block;
        padding: 18px 24px;
        background: #D1D5DB;
        color: #9CA3AF;
        font-size: 17px;
        font-weight: 700;
        border: none;
        border-radius: 16px;
        cursor: not-allowed;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .native-primary-btn.enabled {
        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
        color: white;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      }

      .native-primary-btn.enabled:active {
        transform: scale(0.98);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      .btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
}

// 전역 함수로 등록
window.renderGuestTLL = renderGuestTLL;
console.log('✅ renderGuestTLL 전역 함수 등록 완료');
