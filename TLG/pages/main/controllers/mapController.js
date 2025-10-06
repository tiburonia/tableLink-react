// 모듈 임포트 (조건부)
let mapService, mapView, mapLevelConverter;

try {
  // ES6 모듈 임포트 시도
  const serviceModule = await import('../services/mapService.js');
  const viewModule = await import('../views/mapView.js');
  const converterModule = await import('../utils/mapLevelConverter.js');
  mapService = serviceModule.mapService;
  mapView = viewModule.mapView;
  mapLevelConverter = converterModule.mapLevelConverter;
} catch (error) {
  console.warn('⚠️ ES6 모듈 임포트 실패, 전역 객체 사용:', error);
  // 전역 객체에서 가져오기 (폴백)
  mapService = window.mapService;
  mapView = window.mapView;
  mapLevelConverter = window.mapLevelConverter;
}

// 전역 등록 (try/catch 외부에서 항상 실행)
if (mapLevelConverter) {
  window.mapLevelConverter = mapLevelConverter;
} else {
  // fallback 변환 함수
  window.mapLevelConverter = {
    naverZoomToKakaoLevel: (naverZoom) => Math.max(1, Math.min(14, 28 - naverZoom)),
    kakaoLevelToNaverZoom: (kakaoLevel) => Math.max(6, Math.min(21, 28 - kakaoLevel))
  };
  console.warn('⚠️ mapLevelConverter 폴백 사용');
}

/**
 * 지도 컨트롤러 - 이벤트 처리 및 흐름 제어
 * UI 이벤트와 Service 연결 담당
 */
export const mapController = {
  // 상태 관리
  state: {
    map: null,
    userLocation: null,
    mapCenter: null,
    searchTimeout: null,
    userMarker: null,
    searchClickListenerAdded: false,
    searchClickHandler: null,
    selectedRegion: {
      province: null,
      city: null,
      district: null
    }
  },

  /**
   * 지도 초기화
   */
  async initializeMap() {
    console.log('🗺️ 지도 컨트롤러 초기화 시작');

    try {
      // UI 렌더링
      mapView.renderMapUI();

      // 네이버맵 생성
      const mapContainer = document.getElementById('map');
      const options = {
        center: new naver.maps.LatLng(37.5665, 126.9780),
        zoom: 15, // 네이버맵은 zoom 사용 (level 대신)
        maxZoom: 18,
        minZoom: 6
      };

      this.state.map = new naver.maps.Map(mapContainer, options);
      window.currentMap = this.state.map;

      // 지도 이벤트 설정
      this.setupMapEvents();

      // UI 이벤트 설정
      this.setupUIEvents();

      // 초기 데이터 로드
      await this.loadInitialData();

      // 패널 연동
      this.connectMapPanelUI();

      this.state.isInitialized = true;
      console.log('✅ 지도 컨트롤러 초기화 완료');

    } catch (error) {
      console.error('❌ 지도 초기화 실패:', error);
      mapView.showError('지도 로딩에 실패했습니다. 페이지를 새로고침해주세요.');
    }
  },

  /**
   * 지도 이벤트 설정
   */
  setupMapEvents() {
    const map = this.state.map;

    // 줌 레벨 변경 이벤트
    naver.maps.Event.addListener(map, 'zoom_changed', async () => {
      const currentZoom = this.state.map.getZoom();
      console.log(`🔄 지도 변경 감지 - 줌 레벨: ${currentZoom}`);
      await this.handleMapChange();
    });

    // 드래그 완료 이벤트
    naver.maps.Event.addListener(map, 'dragend', () => {
      this.handleMapChange();
    });

    // 지도 이동 완료 이벤트
    naver.maps.Event.addListener(map, 'idle', () => {
      this.updateLocationInfo();
    });

    console.log('✅ 지도 이벤트 설정 완료');
  },

  /**
   * UI 이벤트 설정
   */
  setupUIEvents() {
    // 검색 이벤트
    this.setupSearchEvents();

    // 위치 설정 이벤트
    this.setupLocationEvents();

    // 장바구니 이벤트
    this.setupCartEvents();

    // 네비게이션 이벤트
    this.setupNavigationEvents();

    console.log('✅ UI 이벤트 설정 완료');
  },

  /**
   * 검색 이벤트 설정
   */
  setupSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');

    // 검색바 클릭 시 검색 페이지로 이동
    searchInput.addEventListener('click', () => {
      if (typeof renderSearch === 'function') {
        renderSearch('');
      }
    });

    // 검색 버튼
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (typeof renderSearch === 'function') {
        renderSearch(query);
      }
    });

    // 엔터 키 검색
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (typeof renderSearch === 'function') {
          renderSearch(query);
        }
      }
    });

    // 초기화 버튼
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      mapView.hideSearchResults();
      clearBtn.style.display = 'none';
      searchInput.focus();
    });

    // 외부 클릭시 검색 결과 숨기기
    // 클릭 이벤트 리스너가 중복 등록되는 것을 방지
    if (!this.state.searchClickListenerAdded) {
      this.state.searchClickHandler = (e) => {
        const searchResultsElement = document.getElementById('searchResults');
        if (
          !searchInput.contains(e.target) &&
          (!searchResultsElement || !searchResultsElement.contains(e.target)) && // searchResultsElement가 null인 경우를 처리
          !searchBtn.contains(e.target)
        ) {
          mapView.hideSearchResults();
        }
      };
      document.addEventListener('click', this.state.searchClickHandler);
      this.state.searchClickListenerAdded = true;
    }

    clearBtn.style.display = 'none';
  },

  /**
   * 위치 설정 이벤트 설정
   */
  setupLocationEvents() {
    const locationSelectBtn = document.getElementById('locationSelectBtn');
    const closeModal = document.getElementById('closeModal');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
    const confirmLocationBtn = document.getElementById('confirmLocationBtn');

    // 위치 선택 버튼
    locationSelectBtn.addEventListener('click', () => {
      this.openLocationModal();
    });

    // 모달 닫기
    closeModal.addEventListener('click', () => {
      this.closeLocationModal();
    });

    // GPS 위치 가져오기
    getCurrentLocationBtn.addEventListener('click', () => {
      this.getCurrentGPSLocation();
    });

    // 위치 확인
    confirmLocationBtn.addEventListener('click', () => {
      this.confirmLocationSetting();
    });

    // 지역 선택 이벤트
    this.setupRegionSelectionEvents();
  },

  /**
   * 지역 선택 이벤트 설정
   */
  setupRegionSelectionEvents() {
    const provinceSelect = document.getElementById('provinceSelect');
    const citySelect = document.getElementById('citySelect');
    const districtSelect = document.getElementById('districtSelect');
    const confirmLocationBtn = document.getElementById('confirmLocationBtn');

    provinceSelect.addEventListener('change', async (e) => {
      const province = e.target.value;
      if (province) {
        await this.loadCities(province);
      } else {
        mapView.resetCityAndDistrictSelects();
        confirmLocationBtn.disabled = true;
      }
    });

    citySelect.addEventListener('change', async (e) => {
      const city = e.target.value;
      const province = provinceSelect.value;
      if (province && city) {
        await this.loadDistricts(province, city);
      } else {
        mapView.resetDistrictSelect();
        confirmLocationBtn.disabled = true;
      }
    });

    districtSelect.addEventListener('change', (e) => {
      const district = e.target.value;
      confirmLocationBtn.disabled = !district;
    });
  },

  /**
   * 장바구니 이벤트 설정
   */
  setupCartEvents() {
    const cartBtn = document.getElementById('cartBtn');

    cartBtn.addEventListener('click', () => {
      if (window.savedCart && window.savedCart.order && Object.keys(window.savedCart.order).length > 0) {
        if (typeof renderCart === 'function') {
          renderCart(window.savedCart);
        } else {
          alert('장바구니 기능을 불러올 수 없습니다.');
        }
      } else {
        alert('장바구니가 비어있습니다.');
      }
    });

    // 장바구니 상태 업데이트
    setInterval(() => this.updateCartBadge(), 1000);
    this.updateCartBadge();
  },

  /**
   * 네비게이션 이벤트 설정
   */
  setupNavigationEvents() {
    const renderMapBtn = document.getElementById('renderMapBtn');

    renderMapBtn.addEventListener('click', () => {
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        location.reload();
      }
    });
  },

  /**
   * 지도 변경 처리
   */
  async handleMapChange() {
    const level = this.state.map.getZoom();
    console.log(`🔄 지도 변경 감지 - 줌 레벨: ${level}`);

    try {
      // 마커 매니저를 통한 마커 업데이트 - map 객체만 전달
      if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
        window.MapMarkerManager.handleMapLevelChange(this.state.map);
      }

      // 패널 업데이트
      if (window.MapPanelUI && typeof window.MapPanelUI.rebuildStorePanel === 'function') {
        await window.MapPanelUI.rebuildStorePanel(this.state.map);
      }
    } catch (error) {
      console.error('❌ 지도 변경 처리 실패:', error);
    }
  },

  /**
   * 검색 입력 처리
   */
  handleSearchInput(keyword) {
    clearTimeout(this.state.searchTimeout);
    const clearBtn = document.getElementById('clearBtn');

    if (keyword) {
      clearBtn.style.display = 'flex';
      this.state.searchTimeout = setTimeout(() => {
        this.performSearch(keyword);
      }, 300);
    } else {
      clearBtn.style.display = 'none';
      mapView.hideSearchResults();
    }
  },

  /**
   * 검색 수행
   */
  async performSearch(keyword) {
    if (!keyword.trim()) {
      mapView.hideSearchResults();
      return;
    }

    console.log(`🔍 검색 수행: "${keyword}"`);

    try {
      const { stores, places } = await mapService.performUnifiedSearch(keyword, this.state.map);
      mapView.displaySearchResults(stores, places, keyword, this.state.map);
    } catch (error) {
      console.error('❌ 검색 실패:', error);
      mapView.showSearchError(error.message);
    }
  },

  /**
   * 위치 모달 열기 (비활성화됨)
   */
  async openLocationModal() {
    console.log('📍 위치 선택 기능이 비활성화되었습니다');
    alert('위치 선택 기능이 비활성화되었습니다');
  },

  /**
   * 위치 모달 닫기
   */
  closeLocationModal() {
    const locationModal = document.getElementById('locationModal');
    locationModal.classList.add('hidden');
    mapView.resetRegionSelects();
  },

  /**
   * GPS 현재 위치 가져오기 (비활성화됨)
   */
  getCurrentGPSLocation() {
    console.log('📍 GPS 위치 기능이 비활성화되었습니다');
    alert('GPS 위치 기능이 비활성화되었습니다');
  },

  /**
   * 위치 설정 확인 (비활성화됨)
   */
  async confirmLocationSetting() {
    console.log('📍 위치 설정 확인 기능이 비활성화되었습니다');
    alert('위치 설정 기능이 비활성화되었습니다');
  },

  /**
   * 지도 위치 설정
   */
  setMapLocation(lat, lng, locationName) {
    const position = new naver.maps.LatLng(lat, lng);
    this.state.map.setCenter(position);
    this.state.map.setZoom(15);

    // 위치 텍스트 업데이트
    mapView.updateLocationText(locationName);

    console.log(`📍 지도 위치 이동: ${locationName} (${lat}, ${lng})`);
  },

  /**
   * 지역 데이터 로드 (비활성화됨)
   */
  async loadProvinces() {
    console.log('📍 시도 데이터 로드 기능이 비활성화되었습니다');
  },

  async loadCities(province) {
    console.log('📍 시군구 데이터 로드 기능이 비활성화되었습니다');
  },

  async loadDistricts(province, city) {
    console.log('📍 읍면동 데이터 로드 기능이 비활성화되었습니다');
  },

  /**
   * 현재 위치 정보 업데이트 (비활성화됨)
   */
  async updateLocationInfo() {
    console.log('📍 위치 정보 업데이트 기능이 비활성화되었습니다');
    mapView.updateLocationText('지도');
  },

  /**
   * 초기 데이터 로드
   */
  async loadInitialData() {
    // 마커 매니저 초기화
    if (window.MapMarkerManager && typeof window.MapMarkerManager.reset === 'function') {
      window.MapMarkerManager.reset();
    }

    // 초기 마커 로딩
    setTimeout(() => {
      this.handleMapChange();
    }, 500);

    // 초기 위치 정보 로드
    this.updateLocationInfo();
  },

  /**
   * 패널 연동
   */
  connectMapPanelUI() {
    setTimeout(() => {
      if (window.MapPanelUI) {
        if (typeof window.MapPanelUI.initializeFiltering === 'function') {
          window.MapPanelUI.initializeFiltering();
        }
        if (typeof window.MapPanelUI.setupPanelDrag === 'function') {
          window.MapPanelUI.setupPanelDrag();
        }
        if (typeof window.MapPanelUI.connectToMap === 'function') {
          window.MapPanelUI.connectToMap(this.state.map);
        }
      }
    }, 200);
  },

  /**
   * 장바구니 배지 업데이트
   */
  updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) return;

    if (window.savedCart && window.savedCart.order) {
      const totalItems = Object.values(window.savedCart.order).reduce((a, b) => a + b, 0);
      if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
      } else {
        cartBadge.classList.add('hidden');
      }
    } else {
      cartBadge.classList.add('hidden');
    }
  },

  /**
   * 상태 초기화
   */
  reset() {
    console.log('🔄 지도 컨트롤러 상태 초기화');

    // 외부 클릭 리스너 제거
    if (this.state.searchClickListenerAdded && this.state.searchClickHandler) {
      document.removeEventListener('click', this.state.searchClickHandler);
      this.state.searchClickListenerAdded = false;
      this.state.searchClickHandler = null;
    }

    this.state.map = null;
    this.state.currentMarkers = [];
    this.state.isInitialized = false;

    if (this.state.searchTimeout) {
      clearTimeout(this.state.searchTimeout);
      this.state.searchTimeout = null;
    }
  },

  /**
   * 필터 이벤트 설정 업데이트
   */
  setupFilterEvents() {
    const filterToggleBtn = document.getElementById('mapFilterToggleBtn');
    const filterContainer = document.getElementById('mapFilterContainer');

    if (filterToggleBtn && filterContainer) {
      filterToggleBtn.addEventListener('click', () => {
        filterContainer.classList.toggle('collapsed');
        filterToggleBtn.classList.toggle('collapsed');
      });
    }

    // 필터 탭 클릭 이벤트
    document.querySelectorAll('.map-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.map-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // TODO: 필터링 로직 추가
      });
    });
  },

  /**
   * 매장 카드 렌더링 함수
   */
  renderStoreCards(stores) {
    const container = document.getElementById('mapStorePanelContainer');
    if (!container) {
      console.error('❌ 매장 패널 컨테이너를 찾을 수 없습니다');
      return;
    }

    container.innerHTML = ''; // 기존 내용 초기화

    if (stores && stores.length > 0) {
      stores.forEach(store => {
        const storeElement = document.createElement('div');
        storeElement.className = 'store-card'; // CSS 클래스 적용
        storeElement.innerHTML = `
          <h3>${store.name}</h3>
          <p>${store.address}</p>
          <p>전화: ${store.phone || '정보 없음'}</p>
          <p>영업시간: ${store.operatingHours || '정보 없음'}</p>
          <button class="store-details-btn" data-store-id="${store.id}">상세보기</button>
        `;
        container.appendChild(storeElement);

        // 상세보기 버튼 이벤트 리스너 추가
        storeElement.querySelector('.store-details-btn').addEventListener('click', (e) => {
          const storeId = e.target.dataset.storeId;
          // TODO: 상세 정보 렌더링 로직 구현
          console.log(`매장 상세보기 클릭: ${storeId}`);
          if (window.MapPanelUI && typeof window.MapPanelUI.renderStoreDetails === 'function') {
            window.MapPanelUI.renderStoreDetails(storeId);
          }
        });
      });
    } else {
      container.innerHTML = '<p>주변에 매장이 없습니다.</p>';
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색 관련 이벤트
    this.setupSearchEvents();

    // 위치 설정 관련 이벤트
    this.setupLocationEvents();

    // 뷰포트 변경 이벤트 (디바운스 처리)
    this.setupViewportChangeEvents();

    // 바텀시트 관련 이벤트
    this.setupBottomSheetEvents();

    console.log('✅ 지도 이벤트 리스너 설정 완료');
  },

  /**
   * 바텀시트 이벤트 설정
   */
  setupBottomSheetEvents() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const bottomSheet = document.getElementById('bottomSheet');
    const sheetDim = document.getElementById('sheetDim');
    const sheetCloseBtn = document.querySelector('.sheet-close-btn');
    const sheetTitle = document.getElementById('sheetTitle');
    const sheetContent = document.getElementById('sheetContent');

    // 필터 버튼 클릭 이벤트
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.dataset.filter;

        // 전체 필터는 바텀시트 없이 처리
        if (filterType === 'all') {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.applyFilter('all', null);
          return;
        }

        // 바텀시트 컨텐츠 업데이트
        this.updateBottomSheetContent(filterType, sheetTitle, sheetContent);

        // 바텀시트 열기
        bottomSheet.classList.add('active');
        sheetDim.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    // 딤 클릭으로 닫기
    sheetDim.addEventListener('click', () => {
      this.closeBottomSheet(bottomSheet, sheetDim);
    });

    // 닫기 버튼
    if (sheetCloseBtn) {
      sheetCloseBtn.addEventListener('click', () => {
        this.closeBottomSheet(bottomSheet, sheetDim);
      });
    }

    console.log('✅ 바텀시트 이벤트 설정 완료');
  },

  /**
   * 바텀시트 닫기
   */
  closeBottomSheet(bottomSheet, sheetDim) {
    bottomSheet.classList.remove('active');
    sheetDim.classList.remove('active');
    document.body.style.overflow = '';
  },

  /**
   * 바텀시트 컨텐츠 업데이트
   */
  updateBottomSheetContent(filterType, titleEl, contentEl) {
    const contents = {
      category: {
        title: '카테고리 선택',
        html: `
          <div class="category-grid">
            <div class="category-item" data-value="한식">
              <div class="category-icon">🍚</div>
              <div class="category-name">한식</div>
            </div>
            <div class="category-item" data-value="중식">
              <div class="category-icon">🥟</div>
              <div class="category-name">중식</div>
            </div>
            <div class="category-item" data-value="일식">
              <div class="category-icon">🍱</div>
              <div class="category-name">일식</div>
            </div>
            <div class="category-item" data-value="양식">
              <div class="category-icon">🍝</div>
              <div class="category-name">양식</div>
            </div>
            <div class="category-item" data-value="카페">
              <div class="category-icon">☕</div>
              <div class="category-name">카페</div>
            </div>
            <div class="category-item" data-value="치킨">
              <div class="category-icon">🍗</div>
              <div class="category-name">치킨</div>
            </div>
            <div class="category-item" data-value="분식">
              <div class="category-icon">🍜</div>
              <div class="category-name">분식</div>
            </div>
            <div class="category-item" data-value="디저트">
              <div class="category-icon">🍰</div>
              <div class="category-name">디저트</div>
            </div>
            <div class="category-item" data-value="기타">
              <div class="category-icon">🍽️</div>
              <div class="category-name">기타</div>
            </div>
          </div>
        `
      },
      price: {
        title: '가격대 선택',
        html: `
          <div class="price-options">
            <div class="price-option" data-value="low">
              <div>
                <div class="price-label">💰 저렴한</div>
                <div class="price-range">10,000원 이하</div>
              </div>
            </div>
            <div class="price-option" data-value="medium">
              <div>
                <div class="price-label">💰💰 보통</div>
                <div class="price-range">10,000 ~ 20,000원</div>
              </div>
            </div>
            <div class="price-option" data-value="high">
              <div>
                <div class="price-label">💰💰💰 비싼</div>
                <div class="price-range">20,000원 이상</div>
              </div>
            </div>
          </div>
        `
      },
      distance: {
        title: '거리 설정',
        html: `
          <div class="price-options">
            <div class="price-option" data-value="500">
              <div class="price-label">📍 500m 이내</div>
            </div>
            <div class="price-option" data-value="1000">
              <div class="price-label">📍 1km 이내</div>
            </div>
            <div class="price-option" data-value="3000">
              <div class="price-label">📍 3km 이내</div>
            </div>
            <div class="price-option" data-value="5000">
              <div class="price-label">📍 5km 이내</div>
            </div>
          </div>
        `
      },
      rating: {
        title: '평점 필터',
        html: `
          <div class="price-options">
            <div class="price-option" data-value="4.5">
              <div class="price-label">⭐ 4.5점 이상</div>
            </div>
            <div class="price-option" data-value="4.0">
              <div class="price-label">⭐ 4.0점 이상</div>
            </div>
            <div class="price-option" data-value="3.5">
              <div class="price-label">⭐ 3.5점 이상</div>
            </div>
            <div class="price-option" data-value="3.0">
              <div class="price-label">⭐ 3.0점 이상</div>
            </div>
          </div>
        `
      },
      delivery: {
        title: '배달 옵션',
        html: `
          <div class="price-options">
            <div class="price-option" data-value="available">
              <div class="price-label">🛵 배달 가능</div>
            </div>
            <div class="price-option" data-value="pickup">
              <div class="price-label">🏃 포장 가능</div>
            </div>
            <div class="price-option" data-value="dine-in">
              <div class="price-label">🍽️ 매장 식사</div>
            </div>
          </div>
        `
      }
    };

    const content = contents[filterType] || contents.category;
    titleEl.textContent = content.title;
    contentEl.innerHTML = content.html;

    // 선택 이벤트 추가
    setTimeout(() => {
      const items = contentEl.querySelectorAll('.category-item, .price-option');
      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');

          const value = item.dataset.value;
          console.log(`🔍 필터 선택: ${filterType} = ${value}`);

          // 필터 적용
          this.applyFilter(filterType, value);

          // 필터 버튼 활성화
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filterType) {
              btn.classList.add('active');
            }
          });

          // 바텀시트 닫기
          setTimeout(() => {
            this.closeBottomSheet(
              document.getElementById('bottomSheet'),
              document.getElementById('sheetDim')
            );
          }, 300);
        });
      });
    }, 50);
  },

  /**
   * 필터 적용
   */
  applyFilter(filterType, value) {
    console.log(`🔍 필터 적용: ${filterType} = ${value}`);
    // TODO: 실제 필터링 로직 구현
    // mapService나 mapPanelUI를 통해 매장 목록 필터링
  },
};

// 전역 객체로 등록 (MapMarkerManager 의존성 해결)
window.mapController = mapController;
console.log('✅ mapController 전역 객체 등록 완료');