// 타일 기반 클러스터링 마커 관리자 (통합 최적화 버전)
window.MapMarkerManager = {
  // ---- 상태 ----
  _initialized: false,
  map: null,

  // 캔버스
  canvas: null,
  ctx: null,
  dpr: 1,

  // 렌더 스로틀
  _rafId: 0,
  _pendingRender: false,

  // 타일/로딩/히트테스트
  tileCache: new Map(),      // key -> { tile, features, meta, timestamp }
  loadingTiles: new Set(),   // 진행중 타일 키
  abortController: new AbortController(),
  drawIndex: [],             // [{x,y,r,feature}, ...]

  // 타이머
  debounceTimer: null,
  _cacheSweepTimer: null,

  // 옵션
  opts: {
    debounceMs: 180,
    maxVisibleMarkers: 400,
    tileLruLimit: 100,
    requestConcurrency: 6,
    tileZoomMin: 1,
    tileZoomMax: 16,
    tileBuffer: 1
  },

  // ---- 초기화 ----
  initialize(map, options = {}) {
    if (this._initialized) {
      console.log('ℹ️ MapMarkerManager already initialized');
      return;
    }
    this._initialized = true;
    this.map = map;
    this.opts = { ...this.opts, ...options };

    console.log('🗺️ 타일 기반 마커 관리자 초기화');
    console.log(`⚙️ debounce=${this.opts.debounceMs}ms, maxMarkers=${this.opts.maxVisibleMarkers}, LRU=${this.opts.tileLruLimit}`);

    this.setupCanvas();
    this.setupMapEvents();
    this.debouncedLoadVisibleTiles();

    this._cacheSweepTimer = setInterval(() => this.cleanupCache(), 5 * 60 * 1000);

    console.log('✅ 초기화 완료');
  },

  // ---- 캔버스 ----
  setupCanvas() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('❌ #map 컨테이너를 찾지 못함');
      return;
    }

    // 기존 제거
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);

    // 새 캔버스
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none'; // ✅ 지도 이동/줌 방해 금지
    this.canvas.style.zIndex = '100';

    mapContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
  },

  resizeCanvas() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || !this.ctx) return;

    const rect = mapContainer.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width  = Math.max(1, Math.floor(rect.width  * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
    this.canvas.style.width  = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 스케일 누적 방지
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.requestRender();
    console.log(`🎨 캔버스 리사이즈: ${rect.width}x${rect.height} (dpr=${this.dpr})`);
  },

  // ---- 이벤트 ----
  setupMapEvents() {
    // 이동/줌 종료 후만 처리
    kakao.maps.event.addListener(this.map, 'idle', () => {
      this.debouncedLoadVisibleTiles();
    });

    // 지도 클릭 → 히트테스트
    kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      const prj = this.map.getProjection();
      const pt = prj.pointFromCoords(latlng);
      const cpt = prj.pointFromCoords(this.map.getCenter());
      const rect = document.getElementById('map').getBoundingClientRect();
      const x = (pt.x - cpt.x) + rect.width / 2;
      const y = (pt.y - cpt.y) + rect.height / 2;

      const f = this.findFeatureAtPoint(x, y);
      if (!f) return;
      if (f.properties?.cluster) this.zoomToCluster(f);
      else this.showStoreDetail(f);
    });

    window.addEventListener('resize', () => this.resizeCanvas());

    console.log('🎯 이벤트 등록 완료 (idle/resize/click)');
  },

  debouncedLoadVisibleTiles() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.loadVisibleTiles(), this.opts.debounceMs);
  },

  // ---- 타일 계산 ----
  getTileZoom() {
    // Kakao: level 1(최대확대)~14(최대축소)
    // Tile:  z 16(최대확대)~0(최대축소) 방향이라 대략 18-level
    const level = this.map.getLevel();
    return Math.max(this.opts.tileZoomMin, Math.min(this.opts.tileZoomMax, 18 - level));
  },

  lngLatToTile(lng, lat, z) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, z));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    return { x, y };
  },

  getVisibleTiles() {
    const bounds = this.map.getBounds();
    if (!bounds) return [];
    const z = this.getTileZoom();

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const swt = this.lngLatToTile(sw.getLng(), sw.getLat(), z);
    const net = this.lngLatToTile(ne.getLng(), ne.getLat(), z);

    const n = Math.pow(2, z);
    const buf = this.opts.tileBuffer;
    const minX = Math.max(0, Math.min(swt.x, net.x) - buf);
    const maxX = Math.min(n - 1, Math.max(swt.x, net.x) + buf);
    const minY = Math.max(0, Math.min(swt.y, net.y) - buf);
    const maxY = Math.min(n - 1, Math.max(swt.y, net.y) + buf);

    const tiles = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) tiles.push({ z, x, y });
    }

    if (tiles.length > 64) {
      console.warn('⚠️ 가시 타일 과다:', tiles.length, '→ 64로 제한');
      return tiles.slice(0, 64);
    }
    return tiles;
  },

  // ---- 타일 로딩 ----
  async loadVisibleTiles() {
    const tiles = this.getVisibleTiles();
    if (!tiles.length) return;

    // 기존 요청 중단
    this.abortController.abort();
    this.abortController = new AbortController();

    console.log(`🔄 타일 로딩 시작: ${tiles.length}개 (z=${tiles[0].z})`);

    // 필요한 것만 선별 + 비가시 캐시 제거
    const need = [];
    const visibleKeySet = new Set();
    for (const t of tiles) {
      const key = `${t.z}/${t.x}/${t.y}`;
      visibleKeySet.add(key);
      if (!this.tileCache.has(key) && !this.loadingTiles.has(key)) {
        need.push({ key, tile: t });
      }
    }
    for (const key of this.tileCache.keys()) {
      if (!visibleKeySet.has(key)) this.tileCache.delete(key);
    }

    // 동시 요청 제한
    const N = Math.max(1, this.opts.requestConcurrency);
    let idx = 0;
    const workers = Array.from({ length: N }, async () => {
      while (idx < need.length) {
        const { key, tile } = need[idx++];
        await this._loadTile(key, tile);
      }
    });
    await Promise.allSettled(workers);

    // LRU 상한
    this._enforceTileLRU(this.opts.tileLruLimit);

    // 렌더(스로틀)
    this.requestRender();
  },

  async _loadTile(tileKey, tile) {
    if (this.loadingTiles.has(tileKey)) return;
    this.loadingTiles.add(tileKey);

    try {
      // console.log(`📡 타일 요청: ${tileKey}`);
      const res = await fetch(`/api/tiles/${tile.z}/${tile.x}/${tile.y}`, {
        signal: this.abortController.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.success && data?.data?.features) {
        this.tileCache.set(tileKey, {
          tile,
          features: data.data.features,
          meta: data.meta || {},
          timestamp: Date.now()
        });
        // console.log(`✅ 캐시됨: ${tileKey} (${data.meta?.totalFeatures ?? data.data.features.length})`);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(`❌ 타일 실패: ${tileKey}`, e.message);
    } finally {
      this.loadingTiles.delete(tileKey);
    }
  },

  _enforceTileLRU(limit = 100) {
    const keys = Array.from(this.tileCache.keys());
    if (keys.length <= limit) return;
    const arr = keys
      .map(k => ({ k, t: this.tileCache.get(k)?.timestamp || 0 }))
      .sort((a, b) => a.t - b.t);
    const over = arr.length - limit;
    for (let i = 0; i < over; i++) this.tileCache.delete(arr[i].k);
  },

  // ---- 렌더링 ----
  requestRender() {
    if (this._pendingRender) return;
    this._pendingRender = true;
    this._rafId && cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      this._pendingRender = false;
      this.renderAllTiles();
    });
  },

  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    this.ctx.clearRect(0, 0, w, h);
  },

  renderAllTiles() {
    this.clearCanvas();
    this.drawIndex = [];

    const tiles = this.getVisibleTiles();
    if (!tiles.length) return;

    // 현재 줌 레벨과 피처 수집
    const currentZoom = this.getTileZoom();
    const allFeatures = [];
    
    for (const t of tiles) {
      const k = `${t.z}/${t.x}/${t.y}`;
      const td = this.tileCache.get(k);
      if (td?.features) {
        allFeatures.push(...td.features.filter(f => 
          f?.geometry?.coordinates && f.properties
        ));
      }
    }

    if (!allFeatures.length) return;

    // 렌더링 우선순위: 1) 클러스터 2) 개별 매장
    const clusters = [];
    const stores = [];
    
    for (const feature of allFeatures) {
      if (feature.properties.cluster) {
        clusters.push(feature);
      } else {
        stores.push(feature);
      }
    }

    // 성능 제한 적용
    const totalFeatures = clusters.length + stores.length;
    const shouldLimitStores = totalFeatures > this.opts.maxVisibleMarkers;
    const maxStores = shouldLimitStores ? 
      Math.max(50, this.opts.maxVisibleMarkers - clusters.length) : 
      stores.length;

    let rendered = { clusters: 0, stores: 0 };

    // 1. 클러스터 렌더링 (항상 우선)
    for (const cluster of clusters) {
      if (this._renderFeature(cluster, currentZoom)) {
        rendered.clusters++;
      }
    }

    // 2. 개별 매장 렌더링 (제한 적용)
    const storesToRender = shouldLimitStores ? 
      this._selectBestStores(stores, maxStores, currentZoom) : 
      stores;

    for (const store of storesToRender) {
      if (this._renderFeature(store, currentZoom)) {
        rendered.stores++;
      }
    }

    const summary = shouldLimitStores ? 
      ` (성능 최적화: 매장 ${rendered.stores}/${stores.length}개만 표시)` : '';
    
    console.log(`🖼️ 렌더 완료 z${currentZoom}: 클러스터 ${rendered.clusters}개, 매장 ${rendered.stores}개${summary}`);
  },

  _renderFeature(feature, zoom) {
    const [lng, lat] = feature.geometry.coordinates;
    const p = this.lngLatToPixel(lng, lat);
    if (!p) return false;

    const r = feature.properties.cluster
      ? this._drawCluster(p.x, p.y, feature.properties.point_count || 1, zoom)
      : this._drawStore(p.x, p.y, feature, zoom);

    this.drawIndex.push({ x: p.x, y: p.y, r, feature });
    return true;
  },

  _selectBestStores(stores, maxCount, zoom) {
    if (stores.length <= maxCount) return stores;

    // 우선순위: 1) 운영중 2) 평점 높은 순 3) 리뷰 많은 순
    return stores
      .map(store => ({
        store,
        priority: this._calculateStorePriority(store, zoom)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxCount)
      .map(item => item.store);
  },

  _calculateStorePriority(store, zoom) {
    const props = store.properties;
    let priority = 0;
    
    // 운영상태 (가중치 높음)
    if (props.isOpen !== false) priority += 100;
    
    // 평점 (0-50점)
    const rating = parseFloat(props.ratingAverage) || 0;
    priority += rating * 10;
    
    // 리뷰 수 (로그 스케일, 0-30점)
    const reviews = parseInt(props.reviewCount) || 0;
    priority += Math.min(30, Math.log(reviews + 1) * 5);
    
    // 줌 레벨에 따른 보정 (고줌일수록 더 많은 매장 표시)
    priority += zoom * 2;
    
    return priority;
  },

  lngLatToPixel(lng, lat) {
    try {
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) return null;
      const position = new kakao.maps.LatLng(lat, lng);
      const projection = this.map.getProjection();
      if (!projection) return null;

      const pt = projection.pointFromCoords(position);
      const cpt = projection.pointFromCoords(this.map.getCenter());

      const mapContainer = document.getElementById('map');
      if (!mapContainer) return null;
      const rect = mapContainer.getBoundingClientRect();

      const x = (pt.x - cpt.x) + rect.width / 2;
      const y = (pt.y - cpt.y) + rect.height / 2;

      const margin = 100;
      if (x >= -margin && x <= rect.width + margin && y >= -margin && y <= rect.height + margin) {
        return { x, y };
      }
      return null;
    } catch (e) {
      // 좌표 변환 실패시 무시
      return null;
    }
  },

  _drawCluster(x, y, count, zoom = 10) {
    // 줌 레벨과 클러스터 크기에 따른 동적 반지름
    const baseRadius = Math.min(35, Math.max(12, Math.log(count) * 4));
    const zoomMultiplier = Math.max(0.7, Math.min(1.3, zoom / 10));
    const r = Math.round(baseRadius * zoomMultiplier);

    // 클러스터 크기별 색상 구분
    let fillColor, strokeColor;
    if (count >= 100) {
      fillColor = '#d32f2f';      // 대형 클러스터 (빨강)
      strokeColor = '#ffffff';
    } else if (count >= 50) {
      fillColor = '#f57c00';      // 중형 클러스터 (주황)
      strokeColor = '#ffffff';
    } else if (count >= 10) {
      fillColor = '#1976d2';      // 소형 클러스터 (파랑)
      strokeColor = '#ffffff';
    } else {
      fillColor = '#388e3c';      // 미니 클러스터 (초록)
      strokeColor = '#ffffff';
    }

    // 외곽 그림자 효과
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 3;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // 메인 원
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // 그림자 제거
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // 테두리
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = Math.max(1, Math.round(r / 8));
    this.ctx.stroke();

    // 텍스트
    this.ctx.fillStyle = '#ffffff';
    const fontSize = Math.max(10, Math.min(16, r / 2));
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 큰 숫자는 축약 표시
    const displayText = count >= 1000 ? 
      `${Math.round(count / 100) / 10}k` : 
      String(count);
    
    this.ctx.fillText(displayText, x, y);
    return r + 2; // 히트 테스트용 여유 공간
  },

  _drawStore(x, y, feature, zoom = 10) {
    const props = feature.properties;
    const isOpen = props.isOpen !== false;
    const hasHighRating = (parseFloat(props.ratingAverage) || 0) >= 4.0;
    const hasReviews = (parseInt(props.reviewCount) || 0) > 10;

    // 줌 레벨에 따른 크기 조절
    const baseRadius = zoom >= 14 ? 7 : zoom >= 12 ? 6 : 5;
    const r = hasHighRating && hasReviews ? baseRadius + 1 : baseRadius;

    // 매장 상태별 색상 및 스타일
    let fillColor, strokeColor, strokeWidth;
    
    if (!isOpen) {
      fillColor = '#757575';      // 폐점/휴무 (회색)
      strokeColor = '#ffffff';
      strokeWidth = 1;
    } else if (hasHighRating && hasReviews) {
      fillColor = '#4caf50';      // 인기 매장 (진초록)
      strokeColor = '#fff';
      strokeWidth = 2;
    } else if (hasReviews) {
      fillColor = '#8bc34a';      // 일반 매장 (연초록)
      strokeColor = '#ffffff';
      strokeWidth = 1;
    } else {
      fillColor = '#ffc107';      // 신규/정보부족 (노랑)
      strokeColor = '#ffffff';
      strokeWidth = 1;
    }

    // 인기 매장 하이라이트 효과
    if (isOpen && hasHighRating && hasReviews) {
      this.ctx.shadowColor = 'rgba(76, 175, 80, 0.4)';
      this.ctx.shadowBlur = 4;
    }

    // 메인 원
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // 그림자 제거
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    // 테두리
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.stroke();

    // 고평점 매장 별표 표시 (고줌에서만)
    if (isOpen && hasHighRating && zoom >= 13) {
      this._drawStar(x, y - r - 3, 3);
    }

    return r + 1;
  },

  _drawStar(x, y, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    this.ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
  },

  // ---- 히트테스트/상호작용 ----
  findFeatureAtPoint(x, y) {
    // 클릭 허용 오차 범위 (터치 등 고려)
    const tolerance = 3;
    let bestMatch = null;
    let minDistance = Infinity;

    // 상단부터(마지막 그린 것부터) 검사하되, 가장 가까운 것 선택
    for (let i = this.drawIndex.length - 1; i >= 0; i--) {
      const d = this.drawIndex[i];
      const dx = x - d.x;
      const dy = y - d.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = d.r + tolerance;
      
      if (distance <= hitRadius && distance < minDistance) {
        minDistance = distance;
        bestMatch = d.feature;
        
        // 클러스터는 우선 선택 (같은 위치에 여러 요소가 있을 때)
        if (d.feature.properties?.cluster) {
          break;
        }
      }
    }
    
    return bestMatch;
  },

  zoomToCluster(clusterFeature) {
    const [lng, lat] = clusterFeature.geometry.coordinates;
    const pos = new kakao.maps.LatLng(lat, lng);
    const currentLevel = this.map.getLevel();
    
    // 클러스터 크기에 따른 적응형 줌
    const pointCount = clusterFeature.properties.point_count || 1;
    let targetLevel;
    
    if (pointCount >= 100) {
      targetLevel = Math.max(1, currentLevel - 3);
    } else if (pointCount >= 50) {
      targetLevel = Math.max(1, currentLevel - 2);
    } else if (pointCount >= 10) {
      targetLevel = Math.max(1, currentLevel - 2);
    } else {
      targetLevel = Math.max(1, currentLevel - 1);
    }

    console.log(`📍 클러스터 확대: ${pointCount}개 매장 → 줌 ${currentLevel}→${targetLevel}`);
    
    // 부드러운 애니메이션으로 이동
    this.map.setCenter(pos);
    this.map.setLevel(targetLevel);
  },

  showStoreDetail(storeFeature) {
    const props = storeFeature.properties || {};
    const coord = storeFeature.geometry.coordinates;
    
    const store = {
      id: props.id,
      name: props.name || '매장명 없음',
      category: props.category || '기타',
      isOpen: props.isOpen !== false,
      ratingAverage: parseFloat(props.ratingAverage) || 0,
      reviewCount: parseInt(props.reviewCount) || 0,
      coord: {
        lat: coord[1],
        lng: coord[0]
      },
      // 추가 주소 정보
      address: {
        sido: props.sido || '',
        sigungu: props.sigungu || '', 
        eupmyeondong: props.eupmyeondong || ''
      }
    };

    console.log(`🏪 매장 선택: ${store.name} (${store.isOpen ? '영업중' : '휴무'}) ⭐${store.ratingAverage}/5.0 (${store.reviewCount}리뷰)`);
    
    // 매장 상세 패널 열기
    if (typeof window.renderStore === 'function') {
      window.renderStore(store);
    } else {
      console.warn('⚠️ renderStore 함수를 찾을 수 없음');
    }

    // 지도 중심을 매장 위치로 부드럽게 이동
    const pos = new kakao.maps.LatLng(coord[1], coord[0]);
    this.map.panTo(pos);
  },

  // ---- 캐시 관리 ----
  cleanupCache() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5분
    let removed = 0;
    for (const [k, v] of this.tileCache.entries()) {
      if (now - (v.timestamp || 0) > maxAge) {
        this.tileCache.delete(k);
        removed++;
      }
    }
    if (removed) {
      // console.log(`🗑️ 만료 타일 ${removed}개 제거`);
    }
  },

  // ---- 파기 ----
  cleanup() {
    console.log('🧹 마커 관리자 정리');
    clearTimeout(this.debounceTimer);
    this._rafId && cancelAnimationFrame(this._rafId);
    this._pendingRender = false;

    this.abortController.abort();
    this.loadingTiles.clear();

    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
    this.ctx = null;

    this.tileCache.clear();
    this.drawIndex = [];

    clearInterval(this._cacheSweepTimer);
    this._initialized = false;
  }
};

// 필요하면 주기 캐시 정리 외부에서 켜도 됨 (initialize에 이미 포함됨)
// setInterval(() => window.MapMarkerManager?.cleanupCache(), 5 * 60 * 1000);
