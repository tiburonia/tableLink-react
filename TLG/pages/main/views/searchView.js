
/**
 * 검색 UI 렌더링 뷰
 * DOM 조작과 화면 렌더링만 담당
 */
export const searchView = {
  /**
   * 검색 페이지 UI 렌더링
   */
  renderSearchUI(initialQuery = '') {
    return `
      <main id="searchContent">
        <header id="searchHeader">
          <button id="backBtn" class="search-back-btn" aria-label="뒤로가기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="search-input-container">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input id="searchInput" type="text" placeholder="매장명 또는 카테고리 검색" value="${initialQuery}">
            <button id="searchBtn" class="search-btn">검색</button>
          </div>
        </header>

        <div id="searchResults" class="search-results-container">
          ${this.renderInitialContent()}
        </div>
      </main>

      ${this.renderBottomNav()}
      ${this.getSearchStyles()}
    `;
  },

  /**
   * 초기 검색 화면 컨텐츠
   */
  renderInitialContent() {
    return `
      <div class="initial-search-content">
        <div class="search-section">
          <h3 class="section-title">추천 검색어</h3>
          <div class="suggestion-grid">
            <button class="suggestion-tag" data-query="카페">
              <span class="tag-emoji">☕</span>
              <span class="tag-text">카페</span>
            </button>
            <button class="suggestion-tag" data-query="치킨">
              <span class="tag-emoji">🍗</span>
              <span class="tag-text">치킨</span>
            </button>
            <button class="suggestion-tag" data-query="피자">
              <span class="tag-emoji">🍕</span>
              <span class="tag-text">피자</span>
            </button>
            <button class="suggestion-tag" data-query="분식">
              <span class="tag-emoji">🍜</span>
              <span class="tag-text">분식</span>
            </button>
            <button class="suggestion-tag" data-query="한식">
              <span class="tag-emoji">🍚</span>
              <span class="tag-text">한식</span>
            </button>
            <button class="suggestion-tag" data-query="중식">
              <span class="tag-emoji">🥢</span>
              <span class="tag-text">중식</span>
            </button>
          </div>
        </div>
        
        <div class="search-section">
          <h3 class="section-title">🔥 인기 검색어</h3>
          <div class="popular-list">
            <button class="popular-item" data-query="맥도날드">
              <span class="popular-rank">1</span>
              <span class="popular-text">맥도날드</span>
              <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="popular-item" data-query="스타벅스">
              <span class="popular-rank">2</span>
              <span class="popular-text">스타벅스</span>
              <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="popular-item" data-query="버거킹">
              <span class="popular-rank">3</span>
              <span class="popular-text">버거킹</span>
              <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="popular-item" data-query="롯데리아">
              <span class="popular-rank">4</span>
              <span class="popular-text">롯데리아</span>
              <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 로딩 상태 표시
   */
  showLoading(keyword) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">"${keyword}" 검색 중...</p>
        </div>
      `;
    }
  },

  /**
   * 검색 결과 표시
   */
  displaySearchResults(stores, keyword) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    if (stores.length === 0) {
      searchResults.innerHTML = this.renderNoResults(keyword);
      return;
    }

    const resultsHTML = `
      <div class="results-header">
        <span class="results-count">"${keyword}" 검색 결과 <strong>${stores.length}개</strong></span>
        <button class="clear-search-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          초기화
        </button>
      </div>
      <div class="results-list">
        ${stores.map(store => this.renderStoreCard(store)).join('')}
      </div>
    `;

    searchResults.innerHTML = resultsHTML;
  },

  /**
   * 매장 카드 렌더링
   */
  renderStoreCard(store) {
    const safeStoreData = JSON.stringify(store)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return `
      <div class="search-result-card" data-store='${safeStoreData}' data-store-id="${store.id}">
        <div class="store-card-header">
          <div class="store-info">
            <h3 class="store-name">${store.name}</h3>
            <div class="store-rating">
              <svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span class="rating-value">${store.ratingAverage}</span>
              <span class="rating-count">(${store.reviewCount})</span>
            </div>
          </div>
          <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? '영업중' : '영업종료'}
          </span>
        </div>
        <div class="store-meta">
          <span class="store-category">${store.category}</span>
          <span class="meta-divider">·</span>
          <span class="store-address">${store.address}</span>
        </div>
      </div>
    `;
  },

  /**
   * 결과 없음 표시
   */
  renderNoResults(keyword) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">검색 결과가 없어요</h3>
        <p class="empty-description">"${keyword}"에 대한 매장을 찾을 수 없습니다.<br>다른 키워드로 검색해보세요.</p>
      </div>
    `;
  },

  /**
   * 에러 표시
   */
  showError(message, keyword) {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">오류가 발생했어요</h3>
          <p class="empty-description">${message}<br>잠시 후 다시 시도해주세요.</p>
          <button class="retry-btn" data-keyword="${keyword}">다시 시도</button>
        </div>
      `;
    }
  },

  /**
   * 바텀 네비게이션
   */
  renderBottomNav() {
    return `
      <nav class="bottom-nav-bar">
        <button onclick="renderSubMain()" class="nav-item">
          <span class="nav-icon"><img width="26" height="26" src="https://img.icons8.com/external-solid-adri-ansyah/26/external-home-essentials-ui-solid-adri-ansyah.png" alt="external-home-essentials-ui-solid-adri-ansyah"/></span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/30/external-qr-metaverse-tanah-basah-glyph-tanah-basah.png" alt="external-qr-metaverse-tanah-basah-glyph-tanah-basah"/></span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item" id="renderMapBtn">
          <span class="nav-icon"><img width="26" height="26" src="https://img.icons8.com/ios-filled/26/marker.png" alt="marker"/></span>
          <span class="nav-label">내주변</span>
        <button class="nav-item">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/pastel-glyph/30/shop--v2.png" alt="shop--v2"/></span>
           <span class="nav-label">내맛집</span>
        </button>
        <button class="nav-item" onclick="renderMyPage()">
          <span class="nav-icon"><img width="30" height="30" src="https://img.icons8.com/ios-filled/30/more.png" alt="more"/></span>
          <span class="nav-label">더보기</span>
        </button>
      </nav>
      </div>
    `;
  },

  /**
   * CSS 스타일
   */
  getSearchStyles() {
    return `
      <style>
        /* 전체 레이아웃 */
        #searchContent {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          padding-bottom: 78px;
        }

        /* 헤더 - 노치 영역 고려 */
        #searchHeader {
          position: sticky;
          top: 0;
          background: #fff;
          padding: 60px 16px 12px 16px; /* 노치 + 상태바 영역 고려 */
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* 뒤로가기 버튼 */
        .search-back-btn {
          width: 40px;
          height: 40px;
          background: #f5f5f5;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1f2937;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-back-btn:active {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        /* 검색 입력 컨테이너 */
        .search-input-container {
          flex: 1;
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 12px;
          padding: 0 16px;
          gap: 8px;
          height: 44px;
        }

        .search-icon {
          color: #9ca3af;
          flex-shrink: 0;
        }

        #searchInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px;
          color: #1f2937;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Pretendard', sans-serif;
        }

        #searchInput::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .search-btn {
          background: none;
          border: none;
          color: #007aff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          flex-shrink: 0;
        }

        .search-btn:active {
          opacity: 0.6;
        }

        /* 검색 결과 컨테이너 */
        .search-results-container {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* 초기 화면 */
        .initial-search-content {
          padding: 20px 16px;
        }

        .search-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 16px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Pretendard', sans-serif;
        }

        /* 추천 검색어 그리드 */
        .suggestion-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .suggestion-tag {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-tag:active {
          transform: scale(0.95);
          background: #f9fafb;
        }

        .tag-emoji {
          font-size: 32px;
        }

        .tag-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        /* 인기 검색어 리스트 */
        .popular-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .popular-item {
          background: #fff;
          border: none;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .popular-item:active {
          transform: scale(0.98);
          background: #f9fafb;
        }

        .popular-rank {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .popular-text {
          flex: 1;
          text-align: left;
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
        }

        .arrow-icon {
          color: #d1d5db;
          flex-shrink: 0;
        }

        /* 검색 결과 헤더 */
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #f3f4f6;
        }

        .results-count {
          font-size: 14px;
          color: #6b7280;
        }

        .results-count strong {
          color: #1f2937;
          font-weight: 700;
        }

        .clear-search-btn {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
        }

        .clear-search-btn:active {
          opacity: 0.6;
        }

        /* 검색 결과 리스트 */
        .results-list {
          padding: 8px 16px 20px 16px;
        }

        /* 매장 카드 */
        .search-result-card {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-result-card:active {
          transform: scale(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .store-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .store-info {
          flex: 1;
        }

        .store-name {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 6px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Pretendard', sans-serif;
        }

        .store-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .star-icon {
          flex-shrink: 0;
        }

        .rating-value {
          font-weight: 600;
          color: #1f2937;
        }

        .rating-count {
          color: #9ca3af;
        }

        .store-status {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .store-status.open {
          background: #dcfce7;
          color: #166534;
        }

        .store-status.closed {
          background: #fee2e2;
          color: #991b1b;
        }

        .store-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .store-category {
          color: #007aff;
          font-weight: 500;
        }

        .meta-divider {
          color: #d1d5db;
        }

        /* 로딩 상태 */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #007aff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .retry-btn {
          background: #007aff;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:active {
          transform: scale(0.95);
          opacity: 0.9;
        }

        /* 바텀 네비게이션 */
        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: #fff;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 12px 0;
          border-top: 1px solid #f3f4f6;
          box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 6px 12px;
          flex: 1;
          transition: all 0.2s ease;
        }

        .nav-item:active {
          transform: scale(0.95);
        }

        .nav-icon {
          font-size: 22px;
        }

        .nav-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .nav-item.active .nav-label {
          color: #007aff;
          font-weight: 600;
        }

        /* 스크롤바 숨김 */
        .search-results-container::-webkit-scrollbar {
          display: none;
        }

        .search-results-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      </style>
    `;
  }
};

// 전역 등록
if (typeof window !== 'undefined') {
  window.searchView = searchView;
}
