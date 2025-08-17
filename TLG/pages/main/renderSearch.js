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
      </div>
    </main>

    <nav id="bottomBar">
      <button onclick="renderSubMain()" title="홈">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button onclick="TLL().catch(console.error)" title="QR주문">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="searchBtn" class="active" title="검색">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button onclick="renderMap().catch(console.error)" title="지도">
        <span style="font-size: 22px;">📍</span>
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

      /* 초기 검색 화면 스타일 */
      .initial-search-content {
        padding: 20px 0;
      }

      .search-suggestions {
        margin-bottom: 32px;
      }

      .suggestions-title,
      .tips-title,
      .popular-title {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 16px;
        padding: 0 4px;
      }

      .suggestion-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

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
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .suggestion-tag:hover {
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }

      .search-tips {
        margin-bottom: 32px;
      }

      .tips-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tip-item {
        background: #f8fafc;
        border-left: 4px solid #297efc;
        padding: 12px 16px;
        border-radius: 0 8px 8px 0;
        font-size: 14px;
        color: #475569;
        font-weight: 500;
      }

      .popular-searches {
        margin-bottom: 20px;
      }

      .popular-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .popular-item {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }

      .popular-item:hover {
        background: #f3f4f6;
        border-color: #297efc;
        color: #297efc;
        transform: scale(1.02);
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

  // 추천 검색어 클릭 이벤트 설정
  setupSuggestionEvents();

  // 초기 검색어가 있으면 바로 검색
  if (initialQuery.trim()) {
    setTimeout(() => performSearch(initialQuery), 100);
  }
}

// 추천 검색어 이벤트 설정
function setupSuggestionEvents() {
  // 추천 검색어 태그 클릭 이벤트
  document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const query = tag.getAttribute('data-query');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = query;
        performSearch(query);
      }
    });
  });

  // 인기 검색어 클릭 이벤트
  document.querySelectorAll('.popular-item').forEach(item => {
    item.addEventListener('click', () => {
      const query = item.getAttribute('data-query');
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = query;
        performSearch(query);
      }
    });
  });
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
      console.log(`🔍 검색 요청: "${keyword}"`);

      const response = await fetch('/api/stores/search?query=' + encodeURIComponent(keyword));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ 검색 응답:`, data);

      if (!data.success) {
        throw new Error(data.error || '검색 요청이 실패했습니다');
      }

      const stores = data.stores || [];
      console.log(`📋 검색된 매장 수: ${stores.length}개`);

      displaySearchResults(stores, keyword);
    } catch (error) {
      console.error('❌ 검색 실패:', error);

      let errorMessage = '검색 중 오류가 발생했습니다';
      if (error.message.includes('HTTP 404')) {
        errorMessage = '검색 서비스를 찾을 수 없습니다';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage = '서버에 문제가 발생했습니다';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요';
      }

      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">❌</div>
          <div class="no-results-title">${errorMessage}</div>
          <div class="no-results-subtitle">잠시 후 다시 시도해주세요</div>
          <button onclick="performSearch('${keyword.replace(/'/g, "\\'")}')"
                  style="margin-top: 16px; padding: 8px 16px; background: #297efc; color: white; border: none; border-radius: 8px; cursor: pointer;">
            다시 시도
          </button>
        </div>
      `;
    }
  }

  // 검색 결과 표시
  function displaySearchResults(results, keyword) {
    console.log(`📊 검색 결과 표시 시작: ${results.length}개`);

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">😔</div>
          <div class="no-results-title">"${keyword}"에 대한 검색 결과가 없습니다</div>
          <div class="no-results-subtitle">다른 키워드로 검색해보세요</div>
          <div style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
            팁: 매장명, 카테고리, 지역명으로 검색해보세요
          </div>
        </div>
      `;
      return;
    }

    // 검색 결과 HTML 생성
    const resultsHTML = results.map((store, index) => {
      try {
        const rating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
        const reviewCount = store.reviewCount || 0;
        const address = store.address || '주소 정보 없음';
        const category = store.category || '기타';
        const storeStatus = store.isOpen !== false; // null이나 undefined는 true로 처리

        // JSON 문자열을 안전하게 처리
        const safeStoreData = JSON.stringify(store).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        console.log(`   📍 매장 ${index + 1}: ${store.name} - ${storeStatus ? '운영중' : '운영중지'}`);

        return `
          <div class="search-result-card" data-store='${safeStoreData}' data-store-id="${store.id || index}">
            <div class="result-header">
              <div>
                <div class="result-name">${store.name || '이름 없음'}</div>
                <div class="result-rating">
                  <span class="rating-star">★</span>
                  <span class="rating-value">${rating}</span>
                  <span class="rating-count">(${reviewCount})</span>
                </div>
              </div>
            </div>
            <div class="result-info">
              <span class="result-category">${category}</span>
              <span class="result-status ${storeStatus ? 'open' : 'closed'}">
                ${storeStatus ? '운영중' : '운영중지'}
              </span>
            </div>
            <div class="result-address">${address}</div>
          </div>
        `;
      } catch (error) {
        console.error(`❌ 매장 카드 생성 실패 (${index}):`, error, store);
        return `
          <div class="search-result-card error">
            <div class="result-name">매장 정보 오류</div>
            <div style="color: #dc2626; font-size: 12px;">데이터를 불러올 수 없습니다</div>
          </div>
        `;
      }
    }).join('');

    searchResults.innerHTML = `
      <div style="margin-bottom: 16px; color: #6b7280; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
        <span>"${keyword}" 검색 결과 ${results.length}개</span>
        <button onclick="searchInput.value=''; searchInput.focus();"
                style="background: none; border: none; color: #297efc; font-size: 12px; cursor: pointer;">
          새 검색
        </button>
      </div>
      ${resultsHTML}
    `;

    // 검색 결과 클릭 이벤트
    searchResults.querySelectorAll('.search-result-card').forEach((card, index) => {
      if (card.classList.contains('error')) return; // 오류 카드는 클릭 불가

      card.addEventListener('click', () => {
        try {
          const storeData = card.getAttribute('data-store');
          const store = JSON.parse(storeData.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));

          console.log(`🔗 매장 선택됨:`, store.name);

          // 지도로 이동하면서 해당 매장 위치로 뷰포트 이동
          moveToStoreOnMap(store);
        } catch (error) {
          console.error(`❌ 매장 선택 처리 실패 (${index}):`, error);
          alert('매장 정보를 불러올 수 없습니다.');
        }
      });
    });

    console.log(`✅ 검색 결과 표시 완료: ${results.length}개 카드 생성`);
  }

  // 매장 위치로 지도 이동
  async function moveToStoreOnMap(store) {
    console.log('🗺️ 지도로 이동:', store.name);

    try {
      // 좌표 유효성 확인
      if (!store.coord || !store.coord.lat || !store.coord.lng) {
        console.warn('⚠️ 매장 좌표 정보가 없음:', store);
        alert(`${store.name}의 위치 정보가 없어 지도에서 찾을 수 없습니다.`);
        return;
      }

      // 지도 화면으로 이동
      await renderMap();

      // 지도가 로드된 후 해당 매장 위치로 이동
      let retryCount = 0;
      const maxRetries = 10;

      const moveToStore = () => {
        if (window.currentMap && typeof window.currentMap.setCenter === 'function') {
          try {
            const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
            window.currentMap.setCenter(position);
            window.currentMap.setLevel(2); // 상세 레벨로 확대

            console.log(`📍 ${store.name} 위치로 지도 이동 완료 (${store.coord.lat}, ${store.coord.lng})`);

            // 지도 마커도 새로고침하여 해당 매장이 보이도록 함
            if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
              setTimeout(() => {
                window.MapMarkerManager.handleMapLevelChange(2, window.currentMap);
              }, 300);
            }

          } catch (mapError) {
            console.error('❌ 지도 이동 중 오류:', mapError);
            alert('지도 이동 중 오류가 발생했습니다.');
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.log(`⏳ 지도 로딩 대기 중... (${retryCount}/${maxRetries})`);
          setTimeout(moveToStore, 200);
        } else {
          console.error('❌ 지도 인스턴스 로딩 실패');
          alert('지도를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
        }
      };

      setTimeout(moveToStore, 200);

    } catch (error) {
      console.error('❌ 지도 이동 처리 실패:', error);
      alert('지도 이동 중 오류가 발생했습니다.');
    }
  }

  // 입력 이벤트 (실시간 검색 제거, 엔터키만)
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(searchInput.value.trim());
    }
  });

  // 검색 버튼 클릭
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch(searchInput.value.trim());
  });

  // 입력창 초기화 및 실시간 상태 업데이트
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();

    // 검색어가 비어있으면 초기 화면으로 복원
    if (!value) {
      searchResults.innerHTML = `
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
      
      // 추천 검색어 이벤트 재설정
      setupSuggestionEvents();
    }
  });

  // 전역 함수로 노출 (다른 곳에서 호출 가능)
  window.performSearch = performSearch;
  window.displaySearchResults = displaySearchResults;
  window.moveToStoreOnMap = moveToStoreOnMap;

  // 입력창 포커스
  setTimeout(() => {
    searchInput.focus();
  }, 100);

  console.log('✅ 검색 기능 초기화 완료');
}

// 전역 함수로 설정
window.renderSearch = renderSearch;