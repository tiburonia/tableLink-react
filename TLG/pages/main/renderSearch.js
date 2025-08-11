
// 검색 화면 렌더링
async function renderSearch(initialQuery = '') {
  const main = document.getElementById('main');

  main.innerHTML = `
    <main id="searchContent">
      <header id="searchHeader">
        <button id="backBtn" class="search-back-btn" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
          <span>←</span>
        </button>
        <div class="search-input-container">
          <input id="searchInput" type="text" placeholder="매장명 또는 카테고리 검색..." value="${initialQuery}">
          <button id="searchBtn" class="search-btn">🔍</button>
        </div>
      </header>
      
      <div id="searchResults" class="search-results-container">
        <div class="loading-message" style="text-align: center; padding: 40px 20px; color: #666;">
          <div class="loading-spinner"></div>
          검색 결과를 불러오는 중...
        </div>
      </div>
    </main>

    <nav id="bottomBar">
      <button id="TLL" title="QR 주문" onclick="TLL().catch(console.error)">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="renderMapBtn" title="지도" onclick="renderMap().catch(console.error)">
        <span style="font-size: 22px;">🗺️</span>
      </button>
      <button id="notificationBtn" title="알림">
        <span style="font-size: 22px;">🔔</span>
      </button>
      <button onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>

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

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
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

      .rating-value {
        font-weight: 600;
        color: #1f2937;
      }

      .rating-count {
        color: #6b7280;
      }

      .result-info {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
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
        line-height: 1.4;
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

      .no-results-subtitle {
        font-size: 14px;
        line-height: 1.5;
      }

      /* 바텀바 */
      #bottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 78px;
        background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
        border-top: 1px solid rgba(255,255,255,0.3);
        box-shadow: 0 -8px 32px rgba(41, 126, 252, 0.08), 0 -4px 16px rgba(0, 0, 0, 0.04);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1001;
        padding: 8px 16px 12px 16px;
        border-radius: 24px 24px 0 0;
        backdrop-filter: blur(20px);
        gap: 8px;
      }

      #bottomBar button {
        flex: 1;
        height: 52px;
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        color: #6B7280;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #bottomBar button:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
        color: #297efc;
        box-shadow: 0 8px 25px rgba(41, 126, 252, 0.15);
      }
    </style>
  `;

  // 검색 기능 초기화
  setupSearchFunctionality();

  // 초기 검색어가 있으면 바로 검색
  if (initialQuery.trim()) {
    setTimeout(() => performSearch(initialQuery), 100);
  }
}

// 검색 기능 설정
function setupSearchFunctionality() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');

  let searchTimeout;

  // 검색 함수
  async function performSearch(keyword) {
    if (!keyword.trim()) {
      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-title">검색어를 입력해주세요</div>
          <div class="no-results-subtitle">매장명이나 카테고리로 검색해보세요</div>
        </div>
      `;
      return;
    }

    // 로딩 상태 표시
    searchResults.innerHTML = `
      <div class="loading-message" style="text-align: center; padding: 40px 20px; color: #666;">
        <div class="loading-spinner"></div>
        "${keyword}" 검색 중...
      </div>
    `;

    try {
      const response = await fetch('/api/stores/search?query=' + encodeURIComponent(keyword));
      const data = await response.json();
      const stores = data.stores || [];

      displaySearchResults(stores, keyword);
    } catch (error) {
      console.error('검색 실패:', error);
      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">❌</div>
          <div class="no-results-title">검색 중 오류가 발생했습니다</div>
          <div class="no-results-subtitle">잠시 후 다시 시도해주세요</div>
        </div>
      `;
    }
  }

  // 검색 결과 표시
  function displaySearchResults(results, keyword) {
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">😔</div>
          <div class="no-results-title">"${keyword}"에 대한 검색 결과가 없습니다</div>
          <div class="no-results-subtitle">다른 키워드로 검색해보세요</div>
        </div>
      `;
      return;
    }

    // 검색 결과 HTML 생성
    const resultsHTML = results.map(store => {
      const rating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
      const reviewCount = store.reviewCount || 0;
      const address = store.address || '주소 정보 없음';

      return `
        <div class="search-result-card" data-store='${JSON.stringify(store).replace(/'/g, "&#39;")}'>
          <div class="result-header">
            <div>
              <div class="result-name">${store.name}</div>
              <div class="result-rating">
                <span class="rating-star">★</span>
                <span class="rating-value">${rating}</span>
                <span class="rating-count">(${reviewCount})</span>
              </div>
            </div>
          </div>
          <div class="result-info">
            <span class="result-category">${store.category}</span>
            <span class="result-status ${store.isOpen ? 'open' : 'closed'}">
              ${store.isOpen ? '운영중' : '운영중지'}
            </span>
          </div>
          <div class="result-address">${address}</div>
        </div>
      `;
    }).join('');

    searchResults.innerHTML = `
      <div style="margin-bottom: 16px; color: #6b7280; font-size: 14px;">
        "${keyword}" 검색 결과 ${results.length}개
      </div>
      ${resultsHTML}
    `;

    // 검색 결과 클릭 이벤트
    searchResults.querySelectorAll('.search-result-card').forEach(card => {
      card.addEventListener('click', () => {
        const storeData = card.getAttribute('data-store');
        const store = JSON.parse(storeData);
        
        // 지도로 이동하면서 해당 매장 위치로 뷰포트 이동
        moveToStoreOnMap(store);
      });
    });
  }

  // 매장 위치로 지도 이동
  async function moveToStoreOnMap(store) {
    console.log('🗺️ 지도로 이동:', store.name);
    
    // 지도 화면으로 이동
    await renderMap();
    
    // 지도가 로드된 후 해당 매장 위치로 이동
    setTimeout(() => {
      if (window.currentMap && store.coord && store.coord.lat && store.coord.lng) {
        const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
        window.currentMap.setCenter(position);
        window.currentMap.setLevel(2); // 상세 레벨로 확대
        
        console.log(`📍 ${store.name} 위치로 지도 이동 완료`);
        
        // 잠시 후 매장 상세로 이동할지 선택 (옵션)
        // setTimeout(() => {
        //   if (typeof renderStore === 'function') {
        //     renderStore(store);
        //   }
        // }, 1000);
      } else {
        console.warn('⚠️ 지도 인스턴스 또는 매장 좌표를 찾을 수 없음');
      }
    }, 200);
  }

  // 입력 이벤트 (실시간 검색 제거, 엔터키만)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value.trim());
    }
  });

  // 검색 버튼 클릭
  searchBtn.addEventListener('click', () => {
    performSearch(searchInput.value.trim());
  });

  // 입력창 포커스
  setTimeout(() => {
    searchInput.focus();
  }, 100);
}

// 전역 함수로 설정
window.renderSearch = renderSearch;
