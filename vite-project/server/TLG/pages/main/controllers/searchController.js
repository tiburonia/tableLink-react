
import { searchService } from '../services/searchService.js';
import { searchView } from '../views/searchView.js';

/**
 * 검색 컨트롤러 - 이벤트 처리 및 흐름 제어
 * UI 이벤트와 Service 연결 담당
 */
export const searchController = {
  state: {
    searchTimeout: null,
    currentKeyword: ''
  },

  /**
   * 검색 초기화
   */
  async initialize(initialQuery = '') {
    console.log('🔍 검색 컨트롤러 초기화');

    const main = document.getElementById('main');
    main.innerHTML = searchView.renderSearchUI(initialQuery);

    this.setupEventListeners();

    // 초기 검색어가 있으면 검색, 없으면 입력창에 포커스
    if (initialQuery.trim()) {
      setTimeout(() => this.performSearch(initialQuery), 100);
    } else {
      // 검색 입력창에 즉시 포커스
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }

    console.log('✅ 검색 컨트롤러 초기화 완료');
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const backBtn = document.getElementById('backBtn');

    // 뒤로가기
    backBtn?.addEventListener('click', () => {
      if (typeof renderMap === 'function') {
        renderMap();
      }
    });

    // 엔터 키 검색
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(searchInput.value.trim());
      }
    });

    // 검색 버튼
    searchBtn?.addEventListener('click', () => {
      this.performSearch(searchInput.value.trim());
    });

    // 입력 변경 시
    searchInput?.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (!value) {
        this.showInitialContent();
      }
    });

    // 추천 검색어 이벤트 (동적 이벤트 위임)
    document.addEventListener('click', (e) => {
      const suggestionTag = e.target.closest('.suggestion-tag');
      const popularItem = e.target.closest('.popular-item');
      const clearBtn = e.target.closest('.clear-search-btn');
      const retryBtn = e.target.closest('.retry-btn');
      const storeCard = e.target.closest('.search-result-card');

      if (suggestionTag) {
        const query = suggestionTag.getAttribute('data-query');
        searchInput.value = query;
        this.performSearch(query);
      }

      if (popularItem) {
        const query = popularItem.getAttribute('data-query');
        searchInput.value = query;
        this.performSearch(query);
      }

      if (clearBtn) {
        searchInput.value = '';
        this.showInitialContent();
        searchInput.focus();
      }

      if (retryBtn) {
        const keyword = retryBtn.getAttribute('data-keyword');
        this.performSearch(keyword);
      }

      if (storeCard) {
        this.handleStoreCardClick(storeCard);
      }
    });

    console.log('✅ 검색 이벤트 리스너 설정 완료');
  },

  /**
   * 검색 수행
   */
  async performSearch(keyword) {
    if (!keyword.trim()) {
      this.showInitialContent();
      return;
    }

    console.log(`🔍 검색 수행: "${keyword}"`);
    this.state.currentKeyword = keyword;

    try {
      searchView.showLoading(keyword);

      const { stores } = await searchService.performUnifiedSearch(keyword);
      const normalizedStores = stores.map(store => searchService.normalizeStoreData(store));

      searchView.displaySearchResults(normalizedStores, keyword);

      console.log(`✅ 검색 완료: ${normalizedStores.length}개 결과`);
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

      searchView.showError(errorMessage, keyword);
    }
  },

  /**
   * 초기 화면 표시
   */
  showInitialContent() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.innerHTML = searchView.renderInitialContent();
    }
  },

  /**
   * 매장 카드 클릭 처리
   */
  async handleStoreCardClick(card) {
    try {
      const storeData = card.getAttribute('data-store');
      const store = JSON.parse(storeData.replace(/&quot;/g, '"').replace(/&#39;/g, "'"));

      console.log(`🏪 매장 선택: ${store.name}`);

      // 좌표가 있으면 지도로 이동
      if (store.coord && store.coord.lat && store.coord.lng) {
        await this.moveToStoreOnMap(store);
      } else {
        alert(`${store.name}의 위치 정보가 없습니다.`);
      }
    } catch (error) {
      console.error('❌ 매장 카드 클릭 처리 실패:', error);
      alert('매장 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 지도에서 매장 위치로 이동
   */
  async moveToStoreOnMap(store) {
    console.log('🗺️ 지도로 이동:', store.name);

    try {
      // 지도 화면으로 이동
      if (typeof renderMap === 'function') {
        await renderMap();
      }

      // 지도가 로드된 후 위치 이동
      let retryCount = 0;
      const maxRetries = 10;

      const moveToStore = () => {
        if (window.currentMap && typeof window.currentMap.setCenter === 'function') {
          try {
            const position = new naver.maps.LatLng(store.coord.lat, store.coord.lng);
            window.currentMap.setCenter(position);
            window.currentMap.setZoom(17);

            console.log(`📍 ${store.name} 위치로 이동 완료`);
          } catch (error) {
            console.error('❌ 지도 이동 실패:', error);
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(moveToStore, 200);
        } else {
          console.error('❌ 지도 로딩 실패');
        }
      };

      setTimeout(moveToStore, 200);
    } catch (error) {
      console.error('❌ 지도 이동 처리 실패:', error);
    }
  }
};

// 전역 등록
if (typeof window !== 'undefined') {
  window.searchController = searchController;
}
