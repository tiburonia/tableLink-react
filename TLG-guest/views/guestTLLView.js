
/**
 * 비회원 TLL View
 */
export const guestTLLView = {
  /**
   * 메인 화면 렌더링
   */
  render() {
    return `
      <div class="guest-tll-container">
        <!-- 헤더 -->
        <header class="guest-header">
          <h1>🎫 비회원 QR 주문</h1>
          <p>회원가입 없이 간편하게 주문하세요</p>
        </header>

        <!-- 매장 선택 섹션 -->
        <section class="store-selection">
          <div class="section-header">
            <span class="icon">🏪</span>
            <h2>매장 선택</h2>
          </div>

          <div class="search-box">
            <input 
              type="text" 
              id="storeSearchInput" 
              placeholder="매장 이름을 입력하세요"
              autocomplete="off"
            />
            <div id="searchResults" class="search-results"></div>
          </div>

          <div id="selectedStoreCard" class="selected-card" style="display: none;">
            <div class="check-icon">✓</div>
            <div class="card-info">
              <span class="label">선택된 매장</span>
              <strong id="selectedStoreName"></strong>
            </div>
          </div>
        </section>

        <!-- 테이블 선택 섹션 -->
        <section class="table-selection">
          <div class="section-header">
            <span class="icon">🪑</span>
            <h2>테이블 선택</h2>
          </div>

          <select id="tableSelect" class="table-select" disabled>
            <option value="">매장을 먼저 선택하세요</option>
          </select>
        </section>

        <!-- 전화번호 입력 섹션 -->
        <section class="phone-section">
          <div class="section-header">
            <span class="icon">📱</span>
            <h2>전화번호 입력</h2>
          </div>

          <input 
            type="tel" 
            id="guestPhoneInput" 
            placeholder="01012345678 (- 없이 입력)"
            maxlength="11"
            pattern="[0-9]*"
            inputmode="numeric"
            disabled
          />
          <p class="hint">주문 확인 및 알림을 위해 필요합니다</p>
        </section>

        <!-- 주문 시작 버튼 -->
        <button id="startOrderBtn" class="start-btn" disabled>
          <span>주문 시작하기</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * 검색 결과 렌더링
   */
  renderSearchResults(stores) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (stores.length === 0) {
      container.innerHTML = '<div class="no-results">검색 결과가 없습니다</div>';
      container.style.display = 'block';
      return;
    }

    container.innerHTML = stores.map(store => `
      <div class="search-item" data-store-id="${store.id}" data-store-name="${store.name}">
        <span class="store-icon">🏪</span>
        <div class="store-info">
          <strong>${store.name}</strong>
          <span>${store.category || '기타'} • ${store.address || '주소 정보 없음'}</span>
        </div>
        <span class="arrow">›</span>
      </div>
    `).join('');

    container.style.display = 'block';
  },

  /**
   * 선택된 매장 표시
   */
  showSelectedStore(storeName) {
    const card = document.getElementById('selectedStoreCard');
    const nameEl = document.getElementById('selectedStoreName');
    const searchResults = document.getElementById('searchResults');

    if (nameEl) nameEl.textContent = storeName;
    if (card) card.style.display = 'flex';
    if (searchResults) searchResults.style.display = 'none';
  },

  /**
   * 테이블 옵션 렌더링
   */
  renderTableOptions(tables) {
    const select = document.getElementById('tableSelect');
    if (!select) return;

    select.innerHTML = `
      <option value="">테이블을 선택하세요</option>
      ${tables.map(table => `
        <option value="${table.id}">${table.id}번 테이블</option>
      `).join('')}
    `;
    select.disabled = false;
  },

  /**
   * 전화번호 입력 활성화
   */
  enablePhoneInput() {
    const phoneInput = document.getElementById('guestPhoneInput');
    if (phoneInput) phoneInput.disabled = false;
  },

  /**
   * 주문 시작 버튼 활성화
   */
  enableStartButton() {
    const btn = document.getElementById('startOrderBtn');
    if (btn) {
      btn.disabled = false;
      btn.classList.add('active');
    }
  },

  /**
   * 주문 시작 버튼 비활성화
   */
  disableStartButton() {
    const btn = document.getElementById('startOrderBtn');
    if (btn) {
      btn.disabled = true;
      btn.classList.remove('active');
    }
  },

  /**
   * 로딩 표시
   */
  showLoading() {
    const btn = document.getElementById('startOrderBtn');
    if (btn) {
      btn.innerHTML = '<span>처리 중...</span>';
      btn.disabled = true;
    }
  },

  /**
   * 에러 표시
   */
  showError(message) {
    alert(message);
  }
};
