
// 타일 기반 클러스터링 마커 관리자
window.MapMarkerManager = {
  // 초기화 상태 플래그
  _initialized: false,
  
  // 지도 인스턴스
  map: null,

  // 캔버스 레이어
  canvasOverlay: null,
  canvas: null,
  ctx: null,

  // 타일 캐시 (Map<tileKey, tileData>)
  tileCache: new Map(),

  // 현재 로딩 중인 타일들 (Set<tileKey>)
  loadingTiles: new Set(),

  // AbortController for cancelling requests
  abortController: new AbortController(),

  // 디바운스 타이머
  debounceTimer: null,

  // 현재 줌 레벨
  currentZoom: 0,

  // 설정 옵션
  opts: {
    debounceMs: 180,
    maxVisibleMarkers: 400
  },

  // 메인 진입점 - 지도 이벤트 등록 (중복 방지)
  initialize(map, options = {}) {
    if (this._initialized) {
      console.log('ℹ️ MapMarkerManager already initialized - 중복 초기화 방지');
      return;
    }

    this._initialized = true;
    this.map = map;
    this.currentZoom = map.getLevel();
    this.opts = { ...this.opts, ...options };

    console.log('🗺️ 타일 기반 마커 관리자 초기화 시작');
    console.log(`⚙️ 설정: debounce=${this.opts.debounceMs}ms, maxMarkers=${this.opts.maxVisibleMarkers}`);

    // 기존 이벤트 정리
    this.cleanupEvents();

    // 캔버스 오버레이 생성
    this.createCanvasOverlay();

    // 지도 이벤트 등록
    this.setupMapEvents();

    // 초기 타일 로딩
    this.debouncedLoadVisibleTiles();
    
    console.log('✅ 타일 기반 마커 관리자 초기화 완료');
  },

  // 이벤트 리스너 정리
  cleanupEvents() {
    // 기존 이벤트 리스너 정리
    try {
      kakao.maps.event.removeListener(this.map, 'idle');
      console.log('🧹 기존 이벤트 리스너 정리 완료');
    } catch (error) {
      console.log('ℹ️ 이벤트 리스너 정리 중 에러 (정상):', error.message);
    }
  },

  // 캔버스 오버레이 생성
  createCanvasOverlay() {
    console.log('🎨 캔버스 오버레이 생성');

    // 기존 캔버스가 있으면 제거
    if (this.canvasOverlay) {
      this.canvasOverlay.setMap(null);
    }

    // 캔버스 요소 생성
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = 'auto'; // 클릭 이벤트 허용
    this.canvas.style.zIndex = '100';

    this.ctx = this.canvas.getContext('2d');

    // 고해상도 디스플레이 지원
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    // 캔버스 클릭 이벤트
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

    // 카카오맵 CustomOverlay로 캔버스 추가
    this.canvasOverlay = new kakao.maps.CustomOverlay({
      content: this.canvas,
      position: this.map.getCenter(),
      xAnchor: 0,
      yAnchor: 0,
      zIndex: 100
    });

    this.canvasOverlay.setMap(this.map);

    // 캔버스 크기 조정
    this.resizeCanvas();
  },

  // 캔버스 크기 조정
  resizeCanvas() {
    // 카카오맵에서는 지도 컨테이너를 document.getElementById로 직접 접근
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('❌ 지도 컨테이너를 찾을 수 없습니다');
      return;
    }
    
    const rect = mapContainer.getBoundingClientRect();
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    
    console.log(`🎨 캔버스 크기 조정: ${rect.width}x${rect.height}`);
  },

  // 지도 이벤트 설정 (idle만 사용하여 중복 방지)
  setupMapEvents() {
    // 지도 이동/줌 완료 시만 처리 (중복 방지)
    kakao.maps.event.addListener(this.map, 'idle', () => {
      console.log('🗺️ 지도 idle 이벤트 - 타일 시스템 처리');
      this.debouncedLoadVisibleTiles();
    });

    // 윈도우 리사이즈 시 캔버스 크기 조정
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.renderAllTiles();
    });

    console.log('🎯 타일 시스템 이벤트 등록 완료 (idle만 사용)');
  },

  // 디바운스된 타일 로딩 (설정값 사용)
  debouncedLoadVisibleTiles() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.loadVisibleTiles();
    }, this.opts.debounceMs);
  },

  // 현재 뷰포트의 타일 목록 계산
  getVisibleTiles() {
    const bounds = this.map.getBounds();
    const kakaoLevel = this.map.getLevel();
    
    // 카카오맵 레벨을 타일 줌으로 변환
    // 카카오맵: 레벨 1(최대확대) ~ 14(최대축소)
    // 타일맵: 줌 0(최대축소) ~ 18(최대확대)
    const tileZoom = Math.max(1, Math.min(16, 18 - kakaoLevel));
    
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    // 위도/경도를 타일 좌표로 변환
    const swTile = this.lngLatToTile(sw.getLng(), sw.getLat(), tileZoom);
    const neTile = this.lngLatToTile(ne.getLng(), ne.getLat(), tileZoom);
    
    const tiles = [];
    
    // 타일 범위 확장 (인접 타일도 포함)
    const minX = Math.max(0, Math.min(swTile.x, neTile.x) - 1);
    const maxX = Math.min(Math.pow(2, tileZoom) - 1, Math.max(swTile.x, neTile.x) + 1);
    const minY = Math.max(0, Math.min(swTile.y, neTile.y) - 1);
    const maxY = Math.min(Math.pow(2, tileZoom) - 1, Math.max(swTile.y, neTile.y) + 1);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ z: tileZoom, x, y });
      }
    }
    
    console.log(`📍 가시 타일 계산: 카카오레벨=${kakaoLevel}, 타일줌=${tileZoom}, 타일 수=${tiles.length}개`);
    return tiles;
  },

  // 위도/경도를 타일 좌표로 변환
  lngLatToTile(lng, lat, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  },

  // 타일 좌표를 위도/경도로 변환
  tileToLngLat(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const lng = x / n * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    return { lng, lat };
  },

  // 가시 타일들 로딩
  async loadVisibleTiles() {
    const visibleTiles = this.getVisibleTiles();
    
    // 기존 요청들 취소
    this.abortController.abort();
    this.abortController = new AbortController();
    
    console.log(`🔄 가시 타일 로딩 시작: ${visibleTiles.length}개`);
    
    // 캐시되지 않은 타일들만 필터링
    const tilesToLoad = visibleTiles.filter(tile => {
      const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
      return !this.tileCache.has(tileKey) && !this.loadingTiles.has(tileKey);
    });
    
    console.log(`📦 로딩 필요한 타일: ${tilesToLoad.length}개`);
    
    // 병렬로 타일 로딩
    const loadPromises = tilesToLoad.map(tile => this.loadTile(tile));
    
    try {
      await Promise.allSettled(loadPromises);
      
      // 모든 캐시된 타일 렌더링
      this.renderAllTiles();
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ 타일 로딩 실패:', error);
      }
    }
  },

  // 개별 타일 로딩
  async loadTile(tile) {
    const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
    
    if (this.loadingTiles.has(tileKey)) {
      return; // 이미 로딩 중
    }
    
    this.loadingTiles.add(tileKey);
    
    try {
      console.log(`📡 타일 요청: ${tileKey}`);
      
      const response = await fetch(`/api/tiles/${tile.z}/${tile.x}/${tile.y}`, {
        signal: this.abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`타일 로딩 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 타일 데이터 캐시
        this.tileCache.set(tileKey, {
          tile: tile,
          features: data.data.features,
          meta: data.meta,
          timestamp: Date.now()
        });
        
        console.log(`✅ 타일 캐시됨: ${tileKey} (${data.meta.totalFeatures}개 피처)`);
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`❌ 타일 ${tileKey} 로딩 실패:`, error);
      }
    } finally {
      this.loadingTiles.delete(tileKey);
    }
  },

  // 모든 캐시된 타일 렌더링
  renderAllTiles() {
    this.clearCanvas();
    
    const visibleTiles = this.getVisibleTiles();
    let totalFeatures = 0;
    
    visibleTiles.forEach(tile => {
      const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
      const tileData = this.tileCache.get(tileKey);
      
      if (tileData) {
        this.renderTileFeatures(tileData.features);
        totalFeatures += tileData.features.length;
      }
    });
    
    console.log(`🖼️ 캔버스 렌더 완료 count=${totalFeatures}`);
  },

  // 타일 피처들을 캔버스에 렌더링
  renderTileFeatures(features) {
    if (!Array.isArray(features)) {
      console.warn('⚠️ features가 배열이 아닙니다:', typeof features);
      return;
    }

    let renderedCount = 0;
    features.forEach(feature => {
      // 안전한 속성 접근 및 GeoJSON Feature 형식 확인
      if (!feature || 
          feature.type !== 'Feature' || 
          !feature.properties || 
          !feature.geometry ||
          !feature.geometry.coordinates ||
          !Array.isArray(feature.geometry.coordinates) ||
          feature.geometry.coordinates.length < 2) {
        return; // 유효하지 않은 feature는 조용히 건너뜀
      }

      // 화면 범위 내에 있는지 확인
      const [lng, lat] = feature.geometry.coordinates;
      const point = this.lngLatToPixel(lng, lat);
      if (!point) return;

      if (feature.properties.cluster === true) {
        this.renderCluster(feature);
      } else {
        this.renderStore(feature);
      }
      renderedCount++;
    });
    
    if (renderedCount !== features.length) {
      console.log(`📊 렌더링: ${renderedCount}/${features.length}개 피처 (${features.length - renderedCount}개 필터링됨)`);
    }
  },

  // 클러스터 렌더링
  renderCluster(feature) {
    if (!feature.geometry || !feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
      console.warn('⚠️ 클러스터 좌표 정보 없음:', feature);
      return;
    }

    const [lng, lat] = feature.geometry.coordinates;
    const point = this.lngLatToPixel(lng, lat);
    
    if (!point) return;
    
    const count = feature.properties.point_count || 1;
    const radius = Math.min(30, Math.max(15, Math.log(count) * 5));
    
    // 클러스터 원 그리기
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#297efc';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // 클러스터 수 텍스트
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(count.toString(), point.x, point.y);
  },

  // 개별 매장 렌더링
  renderStore(feature) {
    if (!feature.geometry || !feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
      console.warn('⚠️ 매장 좌표 정보 없음:', feature);
      return;
    }

    const [lng, lat] = feature.geometry.coordinates;
    const point = this.lngLatToPixel(lng, lat);
    
    if (!point) return;
    
    const isOpen = feature.properties.isOpen !== false; // 기본값 true
    
    // 매장 마커 그리기
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
    this.ctx.fillStyle = isOpen ? '#4caf50' : '#ff9800';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  },

  // 위도/경도를 화면 픽셀로 변환
  lngLatToPixel(lng, lat) {
    try {
      // 좌표 유효성 검사
      if (typeof lng !== 'number' || typeof lat !== 'number' || 
          isNaN(lng) || isNaN(lat) ||
          lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return null;
      }
      
      const position = new kakao.maps.LatLng(lat, lng);
      
      // 카카오맵 컨테이너 직접 접근
      const mapContainer = document.getElementById('map');
      if (!mapContainer) return null;
      
      const rect = mapContainer.getBoundingClientRect();
      
      // 카카오맵의 좌표 변환 API 사용
      const projection = this.map.getProjection();
      const point = projection.pointFromCoords(position);
      const centerPoint = projection.pointFromCoords(this.map.getCenter());
      
      const x = (point.x - centerPoint.x) + rect.width / 2;
      const y = (point.y - centerPoint.y) + rect.height / 2;
      
      // 화면 범위 확장 (여유분 포함)
      const margin = 100;
      if (x >= -margin && x <= rect.width + margin && y >= -margin && y <= rect.height + margin) {
        return { x, y };
      }
      
      return null;
    } catch (error) {
      console.warn('좌표 변환 실패:', lng, lat, error.message);
      return null;
    }
  },

  // 캔버스 클릭 이벤트 처리
  handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log(`🖱️ 캔버스 클릭: (${x}, ${y})`);
    
    // 클릭된 위치의 피처 찾기
    const clickedFeature = this.findFeatureAtPoint(x, y);
    
    if (clickedFeature) {
      if (clickedFeature.properties.cluster) {
        // 클러스터 클릭 시 확대
        this.zoomToCluster(clickedFeature);
      } else {
        // 개별 매장 클릭 시 상세 정보 표시
        this.showStoreDetail(clickedFeature);
      }
    }
  },

  // 특정 좌표의 피처 찾기
  findFeatureAtPoint(x, y) {
    const visibleTiles = this.getVisibleTiles();
    
    for (const tile of visibleTiles) {
      const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
      const tileData = this.tileCache.get(tileKey);
      
      if (!tileData) continue;
      
      for (const feature of tileData.features) {
        if (!feature || !feature.geometry || !feature.geometry.coordinates || !feature.properties) {
          continue;
        }

        const [lng, lat] = feature.geometry.coordinates;
        const point = this.lngLatToPixel(lng, lat);
        
        if (!point) continue;
        
        const radius = feature.properties.cluster === true ? 
          Math.min(30, Math.max(15, Math.log(feature.properties.point_count || 1) * 5)) : 6;
        
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        
        if (distance <= radius) {
          return feature;
        }
      }
    }
    
    return null;
  },

  // 클러스터 확대
  zoomToCluster(clusterFeature) {
    const [lng, lat] = clusterFeature.geometry.coordinates;
    const position = new kakao.maps.LatLng(lat, lng);
    
    console.log(`🔍 클러스터 확대: (${lat}, ${lng})`);
    
    this.map.setCenter(position);
    this.map.setLevel(Math.max(1, this.map.getLevel() - 2));
  },

  // 매장 상세 정보 표시
  showStoreDetail(storeFeature) {
    const store = {
      id: storeFeature.properties.id,
      name: storeFeature.properties.name,
      category: storeFeature.properties.category,
      isOpen: storeFeature.properties.isOpen,
      ratingAverage: storeFeature.properties.ratingAverage,
      reviewCount: storeFeature.properties.reviewCount,
      coord: {
        lat: storeFeature.geometry.coordinates[1],
        lng: storeFeature.geometry.coordinates[0]
      }
    };
    
    console.log(`🏪 매장 상세 정보: ${store.name}`);
    
    if (typeof renderStore === 'function') {
      renderStore(store);
    }
  },

  // 캔버스 지우기
  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  // 타일 캐시 정리 (메모리 관리)
  cleanupCache() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5분
    
    for (const [tileKey, tileData] of this.tileCache.entries()) {
      if (now - tileData.timestamp > maxAge) {
        this.tileCache.delete(tileKey);
        console.log(`🗑️ 만료된 타일 캐시 삭제: ${tileKey}`);
      }
    }
  },

  // 전체 초기화
  cleanup() {
    console.log('🧹 타일 마커 관리자 정리');
    
    // 타이머 정리
    clearTimeout(this.debounceTimer);
    
    // 요청 취소
    this.abortController.abort();
    
    // 캔버스 제거
    if (this.canvasOverlay) {
      this.canvasOverlay.setMap(null);
    }
    
    // 캐시 정리
    this.tileCache.clear();
    this.loadingTiles.clear();
  }
};

// 주기적 캐시 정리 (5분마다)
setInterval(() => {
  if (window.MapMarkerManager) {
    window.MapMarkerManager.cleanupCache();
  }
}, 5 * 60 * 1000);
