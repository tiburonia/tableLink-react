/**
 * TLL View - UI 렌더링
 */

export const tllView = {
  /**
   * TLL 메인 화면 렌더링
   */
  renderTLLScreen() {
    const main = document.getElementById('main');
    if (!main) return;

    main.innerHTML = `
      <div class="tll-layout">
        <div class="tll-header">
          <button id="tllBackBtn" data-action="back-to-map" class="back-button">
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
                data-testid="input-store-search"
              />
              <div class="search-icon">🔍</div>
              <div id="storeSearchResults" class="search-results"></div>
            </div>

            <div id="selectedStore" class="selected-store" style="display:none;">
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
              <select id="tableSelect" class="table-select" disabled data-testid="select-table">
                <option value="">매장을 먼저 선택하세요</option>
              </select>
              <div class="select-arrow">▼</div>
            </div>
          </div>

          <div class="action-section">
            <button id="startOrderBtn" class="start-order-btn" disabled data-testid="button-start-order">
              <span class="btn-icon">🚀</span>
              <span class="btn-text">주문 시작하기</span>
              <div class="btn-shine"></div>
            </button>
          </div>
        </div>
      </div>

      ${this.getTLLStyles()}
    `;
  },

  /**
   * 검색 결과 표시
   */
  displaySearchResults(stores) {
    const resultsContainer = document.getElementById('storeSearchResults');
    if (!resultsContainer) return;

    if (stores.length === 0) {
      resultsContainer.innerHTML = '<div style="padding:10px;color:#666;text-align:center;">검색 결과가 없습니다</div>';
      resultsContainer.style.display = 'block';
      return;
    }

    const resultsHTML = stores.map(store => `
      <div class="store-search-item" data-action="select-store" data-store-id="${store.id}" data-store-name="${store.name.replace(/'/g, "\\'")}">
        <div style="font-weight:bold;">${store.name}</div>
        <div style="font-size:12px;color:#666;">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
      </div>
    `).join('');

    resultsContainer.innerHTML = resultsHTML;
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
    if (selectedStoreDiv) selectedStoreDiv.style.display = 'block';
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
    
    if (enabled) {
      startOrderBtn.style.background = '#297efc';
      startOrderBtn.style.color = '#fff';
      startOrderBtn.style.cursor = 'pointer';
    } else {
      startOrderBtn.style.background = '#ccc';
      startOrderBtn.style.color = '#666';
      startOrderBtn.style.cursor = 'not-allowed';
    }
  },

  /**
   * 로딩 상태 표시
   */
  showLoading() {
    const startOrderBtn = document.getElementById('startOrderBtn');
    if (startOrderBtn) {
      startOrderBtn.disabled = true;
      startOrderBtn.innerHTML = `
        <div class="loading-spinner"></div>
        <span class="btn-text">주문 화면 로딩 중...</span>
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
        <span class="btn-icon">🚀</span>
        <span class="btn-text">주문 시작하기</span>
        <div class="btn-shine"></div>
      `;
    }
  },

  /**
   * TLL 스타일
   */
  getTLLStyles() {
    return `
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
  }
};
