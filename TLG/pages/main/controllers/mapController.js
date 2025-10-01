
// 모듈 임포트 (조건부)
let mapService, mapView;

try {
  // ES6 모듈 임포트 시도
  const serviceModule = await import('../services/mapService.js');
  const viewModule = await import('../views/mapView.js');
  mapService = serviceModule.mapService;
  mapView = viewModule.mapView;
} catch (error) {
  console.warn('⚠️ ES6 모듈 임포트 실패, 전역 객체 사용:', error);
  // 전역 객체에서 가져오기 (폴백)
  mapService = window.mapService;
  mapView = window.mapView;
}

/**
 * 지도 컨트롤러 - 이벤트 처리 및 흐름 제어
 * UI 이벤트와 Service 연결 담당
 */
export const mapController = {
  // 상태 관리
  state: {
    map: null,
    currentMarkers: [],
    searchTimeout: null,
    locationModal: null,
    isInitialized: false
  },

  /**
   * 지도 초기화
   */
  async initializeMap() {
    console.log('🗺️ 지도 컨트롤러 초기화 시작');

    try {
      // UI 렌더링
      mapView.renderMapUI();

      // 카카오맵 생성
      const mapContainer = document.getElementById('map');
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 3,
        maxLevel: 12
      };

      this.state.map = new kakao.maps.Map(mapContainer, options);
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

    // 레벨 변경 이벤트
    kakao.maps.event.addListener(map, 'zoom_changed', () => {
      this.handleMapChange();
    });

    // 드래그 완료 이벤트
    kakao.maps.event.addListener(map, 'dragend', () => {
      this.handleMapChange();
    });

    // 지도 이동 완료 이벤트
    kakao.maps.event.addListener(map, 'idle', () => {
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

    // 실시간 검색
    searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value.trim());
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
        this.performSearch(searchInput.value.trim());
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
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && 
          !document.getElementById('searchResults').contains(e.target) && 
          !searchBtn.contains(e.target)) {
        mapView.hideSearchResults();
      }
    });

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
    const level = this.state.map.getLevel();
    console.log(`🔄 지도 변경 감지 - 레벨: ${level}`);

    try {
      // 마커 매니저를 통한 마커 업데이트
      if (window.MapMarkerManager && typeof window.MapMarkerManager.handleMapLevelChange === 'function') {
        window.MapMarkerManager.handleMapLevelChange(level, this.state.map);
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
    const position = new kakao.maps.LatLng(lat, lng);
    this.state.map.setCenter(position);
    this.state.map.setLevel(3);

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
    
    this.state.map = null;
    this.state.currentMarkers = [];
    this.state.isInitialized = false;
    
    if (this.state.searchTimeout) {
      clearTimeout(this.state.searchTimeout);
      this.state.searchTimeout = null;
    }
  }
};
