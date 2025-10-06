
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
            <span>←</span>
          </button>
          <div class="search-input-container">
            <input id="searchInput" type="text" placeholder="매장명 또는 카테고리 검색..." value="${initialQuery}">
            <button id="searchBtn" class="search-btn">🔍</button>
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
        <div class="search-suggestions">
          <h3 class="suggestions-title">추천 검색어</h3>
          <div class="suggestion-tags">
            <button class="suggestion-tag" data-query="카페">☕ 카페</button>
            <button class="suggestion-tag" data-query="치킨">🍗 치킨</button>
            <button class="suggestion-tag" data-query="피자">🍕 피자</button>
            <button class="suggestion-tag" data-query="분식">🍜 분식</button>
            <button class="suggestion-tag" data-query="한식">🍚 한식</button>
            <button class="suggestion-tag" data-query="중식">🥢 중식</button>
          </div>
        </div>
        
        <div class="search-tips">
          <h3 class="tips-title">🔍 검색 팁</h3>
          <div class="tips-list">
            <div class="tip-item">📍 매장명으로 검색</div>
            <div class="tip-item">🏷️ 음식 카테고리로 검색</div>
            <div class="tip-item">🗺️ 지역명으로 검색</div>
          </div>
        </div>
        
        <div class="popular-searches">
          <h3 class="popular-title">🔥 인기 검색어</h3>
          <div class="popular-list">
            <button class="popular-item" data-query="맥도날드">맥도날드</button>
            <button class="popular-item" data-query="스타벅스">스타벅스</button>
            <button class="popular-item" data-query="버거킹">버거킹</button>
            <button class="popular-item" data-query="롯데리아">롯데리아</button>
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
        <div class="loading-message">
          <div class="loading-spinner"></div>
          "${keyword}" 검색 중...
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
        <span>"${keyword}" 검색 결과 ${stores.length}개</span>
        <button class="clear-search-btn">새 검색</button>
      </div>
      ${stores.map(store => this.renderStoreCard(store)).join('')}
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
        <div class="result-header">
          <div>
            <div class="result-name">🏪 ${store.name}</div>
            <div class="result-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${store.ratingAverage}</span>
              <span class="rating-count">(${store.reviewCount})</span>
            </div>
          </div>
        </div>
        <div class="result-info">
          <span class="result-category">${store.category}</span>
          <span class="result-status ${store.isOpen ? 'open' : 'closed'}">
            ${store.isOpen ? '운영중' : '운영중지'}
          </span>
        </div>
        <div class="result-address">${store.address}</div>
      </div>
    `;
  },

  /**
   * 결과 없음 표시
   */
  renderNoResults(keyword) {
    return `
      <div class="no-results">
        <div class="no-results-icon">😔</div>
        <div class="no-results-title">"${keyword}"에 대한 검색 결과가 없습니다</div>
        <div class="no-results-subtitle">다른 키워드로 검색해보세요</div>
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
        <div class="no-results">
          <div class="no-results-icon">❌</div>
          <div class="no-results-title">${message}</div>
          <div class="no-results-subtitle">잠시 후 다시 시도해주세요</div>
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
        <button onclick="renderSubMain()" class="nav-item" style="pointer-events: none">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">📱</span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item">
          <span class="nav-icon">📍</span>
          <span class="nav-label">내주변</span>
        </button>
        <button onclick="renderMyPage()" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-label">내정보</span>
        </button>
      </nav>
    `;
  },

  /**
   * CSS 스타일
   */
  getSearchStyles() {
    return `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Noto Sans KR', sans-serif;
          background: #f8f8f8;
          overflow-x: hidden;
        }

        #searchContent {
          position: fixed;
          top: 0;
          bottom: 84px;
          left: 0;
          width: 100%;
          max-width: 430px;
          background: #fff;
          z-index: 1;
          display: flex;
          flex-direction: column;
        }

        #searchHeader {
          position: sticky;
          top: 0;
          background: #fff;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }

        .search-back-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          color: #374151;
          transition: all 0.2s ease;
        }

        .search-back-btn:hover {
          background: #e5e7eb;
          transform: scale(1.05);
        }

        .search-input-container {
          flex: 1;
          display: flex;
          align-items: center;
          background: #f8f9fa;
          border-radius: 24px;
          padding: 8px 16px;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .search-input-container:focus-within {
          border-color: #297efc;
          background: #fff;
          box-shadow: 0 4px 12px rgba(41, 126, 252, 0.15);
        }

        #searchInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px;
          color: #1f2937;
          padding: 8px 0;
          font-weight: 500;
        }

        #searchInput::placeholder {
          color: #9ca3af;
        }

        .search-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #6b7280;
        }

        .search-btn:hover {
          background: #e5e7eb;
          color: #297efc;
        }

        .search-results-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .loading-message {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e0e0e0;
          border-top: 3px solid #297efc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          color: #6b7280;
          font-size: 14px;
        }

        .clear-search-btn {
          background: none;
          border: none;
          color: #297efc;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .search-result-card {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .search-result-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          border-color: #297efc;
        }

        .result-name {
          font-weight: 700;
          font-size: 18px;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .result-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .rating-star {
          color: #fbbf24;
        }

        .result-info {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 8px 0;
        }

        .result-category {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .result-status {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .result-status.open {
          background: #dcfce7;
          color: #166534;
        }

        .result-status.closed {
          background: #fef2f2;
          color: #dc2626;
        }

        .result-address {
          color: #6b7280;
          font-size: 14px;
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-results-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-results-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }

        .retry-btn {
          margin-top: 16px;
          padding: 8px 16px;
          background: #297efc;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        /* 초기 화면 스타일 */
        .suggestion-tag {
          background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #0369a1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-tag:hover {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          transform: translateY(-2px);
        }

        .tip-item {
          background: #f8fafc;
          border-left: 4px solid #297efc;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          font-size: 14px;
          color: #475569;
          margin-bottom: 8px;
        }

        .popular-item {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .popular-item:hover {
          border-color: #297efc;
          color: #297efc;
        }

        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background-color: #fff;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 12px 0;
          border-top: 1px solid #eee;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
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
        }

        .nav-icon {
          font-size: 22px;
        }

        .nav-label {
          font-size: 11px;
          color: #999;
          font-weight: 500;
        }

        .nav-item.active .nav-label {
          color: #007aff;
          font-weight: 600;
        }
      </style>
    `;
  }
};

// 전역 등록
if (typeof window !== 'undefined') {
  window.searchView = searchView;
}
