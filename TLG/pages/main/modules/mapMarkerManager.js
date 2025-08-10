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

    // 총 피처 수
    let total = 0;
    for (const t of tiles) {
      const k = `${t.z}/${t.x}/${t.y}`;
      const td = this.tileCache.get(k);
      if (td?.features) total += td.features.length;
    }
    const tooMany = total > this.opts.maxVisibleMarkers;

    let drawn = 0;
    for (const t of tiles) {
      const k = `${t.z}/${t.x}/${t.y}`;
      const td = this.tileCache.get(k);
      if (!td?.features) continue;

      for (const f of td.features) {
        if (!f?.geometry?.coordinates || !f.properties) continue;
        const [lng, lat] = f.geometry.coordinates;
        const p = this.lngLatToPixel(lng, lat);
        if (!p) continue;

        // 과다 시 개별 포인트 스킵(클러스터만)
        if (tooMany && !f.properties.cluster) continue;

        const r = f.properties.cluster
          ? this._drawCluster(p.x, p.y, f.properties.point_count || 1)
          : this._drawStore(p.x, p.y, f);

        this.drawIndex.push({ x: p.x, y: p.y, r, feature: f });
        drawn++;
      }
    }
    console.log(`🖼️ 렌더 완료: ${drawn}${tooMany ? ' (개별포인트 일부 생략)' : ''}`);
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

  _drawCluster(x, y, count) {
    const r = Math.min(30, Math.max(15, Math.log(count) * 5));
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = '#297efc';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(String(count), x, y);
    return r;
  },

  _drawStore(x, y, feature) {
    const isOpen = feature.properties.isOpen !== false;
    const r = 6;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = isOpen ? '#4caf50' : '#ff9800';
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    return r;
  },

  // ---- 히트테스트/상호작용 ----
  findFeatureAtPoint(x, y) {
    // 상단부터(마지막 그린 것부터) 검사
    for (let i = this.drawIndex.length - 1; i >= 0; i--) {
      const d = this.drawIndex[i];
      const dx = x - d.x;
      const dy = y - d.y;
      if ((dx * dx + dy * dy) <= d.r * d.r) return d.feature;
    }
    return null;
  },

  zoomToCluster(clusterFeature) {
    const [lng, lat] = clusterFeature.geometry.coordinates;
    const pos = new kakao.maps.LatLng(lat, lng);
    this.map.setCenter(pos);
    this.map.setLevel(Math.max(1, this.map.getLevel() - 2));
  },

  showStoreDetail(storeFeature) {
    const props = storeFeature.properties || {};
    const store = {
      id: props.id,
      name: props.name,
      category: props.category,
      isOpen: props.isOpen,
      ratingAverage: props.ratingAverage,
      reviewCount: props.reviewCount,
      coord: {
        lat: storeFeature.geometry.coordinates[1],
        lng: storeFeature.geometry.coordinates[0]
      }
    };
    console.log(`🏪 매장 상세: ${store.name ?? store.id ?? 'unknown'}`);
    if (typeof window.renderStore === 'function') window.renderStore(store);
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
