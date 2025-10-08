
/**
 * TLL View - UI 렌더링 (네이티브 앱 스타일)
 */

export const tllView = {
  /**
   * TLL 메인 화면 렌더링
   */
  renderTLLScreen() {
    const main = document.getElementById('main');
    if (!main) return;

    main.innerHTML = `
      <div class="tll-native-layout">
        <!-- 헤더 -->
        <header class="tll-native-header">
          <button id="tllBackBtn" data-action="back-to-map" class="native-back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="native-header-title">
            <h1>QR 주문</h1>
          </div>
          <div class="header-spacer"></div>
        </header>

        <!-- 메인 컨텐츠 -->
        <div class="tll-native-content">
          <!-- 상단 인포 카드 -->
          <div class="info-card">
            <div class="info-icon">📱</div>
            <div class="info-text">
              <h2>테이블에서 간편하게</h2>
              <p>매장과 테이블을 선택하고 바로 주문하세요</p>
            </div>
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
                id="storeSearchInput" 
                type="text" 
                placeholder="매장 이름 검색..." 
                class="native-search-input"
                data-testid="input-store-search"
              />
              <div id="storeSearchResults" class="native-search-results"></div>
            </div>

            <!-- 선택된 매장 표시 -->
            <div id="selectedStore" class="selected-store-card" style="display:none;">
              <div class="selected-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="selected-info">
                <div class="selected-label">선택된 매장</div>
                <div id="selectedStoreName" class="selected-name"></div>
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
              <select id="tableSelect" class="native-select" disabled data-testid="select-table">
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
        <div class="tll-native-footer">
          <button id="startOrderBtn" class="native-primary-btn" disabled data-testid="button-start-order">
            <span class="btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>주문 시작하기</span>
            </span>
          </button>
        </div>
      </div>

      ${this.getTLLStyles()}
    `;
  },

  /**
   * 검색 결과 표시 (XSS 방지)
   */
  displaySearchResults(stores) {
    const resultsContainer = document.getElementById('storeSearchResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (stores.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'search-empty';
      emptyDiv.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#E5E7EB" stroke-width="2"/>
          <path d="M12 8V12M12 16H12.01" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>검색 결과가 없습니다</p>
      `;
      resultsContainer.appendChild(emptyDiv);
      resultsContainer.style.display = 'block';
      return;
    }

    stores.forEach(store => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'native-search-item';
      itemDiv.setAttribute('data-action', 'select-store');
      itemDiv.setAttribute('data-store-id', String(store.id));
      itemDiv.setAttribute('data-store-name', store.name);

      const iconDiv = document.createElement('div');
      iconDiv.className = 'search-item-icon';
      iconDiv.textContent = '🏪';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'search-item-info';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'search-item-name';
      nameDiv.textContent = store.name;

      const detailDiv = document.createElement('div');
      detailDiv.className = 'search-item-detail';
      detailDiv.textContent = `${store.category || '기타'} • ${store.address || '주소 정보 없음'}`;

      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(detailDiv);

      const arrowDiv = document.createElement('div');
      arrowDiv.className = 'search-item-arrow';
      arrowDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      itemDiv.appendChild(iconDiv);
      itemDiv.appendChild(infoDiv);
      itemDiv.appendChild(arrowDiv);
      resultsContainer.appendChild(itemDiv);
    });

    resultsContainer.style.display = 'block';
  },

  /**
   * 선택된 매장 UI 업데이트
   */
  updateSelectedStore(storeName) {
    const selectedStoreDiv = document.getElementById('selectedStore');
    const selectedStoreName = document.getElementById('selectedStoreName');
    const storeSearchInput = document.getElementById('storeSearchInput');
    const storeSearchResults = document.getElementById('storeSearchResults');

    if (storeSearchInput) storeSearchInput.value = storeName;
    if (storeSearchResults) storeSearchResults.style.display = 'none';
    if (selectedStoreDiv) selectedStoreDiv.style.display = 'flex';
    if (selectedStoreName) selectedStoreName.textContent = storeName;
  },

  /**
   * 테이블 옵션 업데이트
   */
  updateTableOptions(optionsHTML) {
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
      tableSelect.innerHTML = optionsHTML;
      tableSelect.disabled = false;
    }
  },

  /**
   * 주문 시작 버튼 상태 업데이트
   */
  updateStartButton(enabled) {
    const startOrderBtn = document.getElementById('startOrderBtn');
    if (!startOrderBtn) return;

    startOrderBtn.disabled = !enabled;
    startOrderBtn.classList.toggle('enabled', enabled);
  },

  /**
   * 로딩 상태 표시
   */
  showLoading() {
    const startOrderBtn = document.getElementById('startOrderBtn');
    if (startOrderBtn) {
      startOrderBtn.disabled = true;
      startOrderBtn.innerHTML = `
        <span class="btn-content">
          <div class="loading-spinner"></div>
          <span>로딩 중...</span>
        </span>
      `;
    }
  },

  /**
   * 로딩 상태 해제
   */
  hideLoading() {
    const startOrderBtn = document.getElementById('startOrderBtn');
    if (startOrderBtn) {
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
  },

  /**
   * 네이티브 앱 스타일
   */
  getTLLStyles() {
    return `
      <style>
        /* 레이아웃 */
        .tll-native-layout {
          min-height: 100vh;
          background: linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
        }

        /* 헤더 */
        .tll-native-header {
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
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
          letter-spacing: -0.3px;
        }

        .header-spacer {
          width: 40px;
        }

        /* 메인 컨텐츠 */
        .tll-native-content {
          flex: 1;
          padding: 20px 20px 100px 20px;
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
        }

        /* 인포 카드 */
        .info-card {
          background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .info-icon {
          font-size: 48px;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .info-text h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .info-text p {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        /* 섹션 */
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
          letter-spacing: -0.3px;
        }

        /* 검색 인풋 */
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
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .native-search-input:focus {
          outline: none;
          border-color: #667EEA;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .native-search-input::placeholder {
          color: #9CA3AF;
        }

        /* 검색 결과 */
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

        .search-empty svg {
          margin-bottom: 12px;
        }

        .search-empty p {
          margin: 0;
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
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item-detail {
          font-size: 13px;
          color: #6B7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item-arrow {
          flex-shrink: 0;
        }

        /* 선택된 매장 카드 */
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
          letter-spacing: 0.5px;
        }

        .selected-name {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        /* 셀렉트 박스 */
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
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

        /* 하단 고정 푸터 */
        .tll-native-footer {
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

        /* 주요 버튼 */
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          letter-spacing: -0.3px;
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

        /* 로딩 스피너 */
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

        /* 스크롤바 */
        .native-search-results::-webkit-scrollbar {
          width: 6px;
        }

        .native-search-results::-webkit-scrollbar-track {
          background: transparent;
        }

        .native-search-results::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }

        .native-search-results::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .tll-native-content {
            padding: 16px 16px 100px 16px;
          }

          .info-card {
            padding: 20px;
          }

          .info-text h2 {
            font-size: 18px;
          }

          .info-text p {
            font-size: 13px;
          }

          .native-primary-btn {
            font-size: 16px;
            padding: 16px 24px;
          }
        }

        /* 다크모드 대응 (선택사항) */
        @media (prefers-color-scheme: dark) {
          .tll-native-layout {
            background: linear-gradient(180deg, #1F2937 0%, #111827 100%);
          }

          .tll-native-header {
            background: rgba(31, 41, 55, 0.95);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .native-header-title h1,
          .native-back-btn {
            color: #F9FAFB;
          }

          .label-text {
            color: #E5E7EB;
          }

          .native-search-input,
          .native-select {
            background: #374151;
            border-color: #4B5563;
            color: #F9FAFB;
          }

          .native-search-input::placeholder {
            color: #6B7280;
          }

          .native-search-results {
            background: #374151;
          }

          .native-search-item {
            border-bottom-color: #4B5563;
          }

          .search-item-name {
            color: #F9FAFB;
          }

          .search-item-detail {
            color: #9CA3AF;
          }

          .tll-native-footer {
            background: rgba(31, 41, 55, 0.95);
            border-top-color: rgba(255, 255, 255, 0.1);
          }
        }
      </style>
    `;
  }
};
