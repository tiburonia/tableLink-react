
// 지도 마커 관리자 - 동적 마커 시스템
window.MapMarkerManager = {
  // 전역 상태 관리
  storeMarkers: new Map(), // Map<storeId, kakao.maps.Marker>
  regionOverlays: [], // kakao.maps.CustomOverlay[]
  currentMode: 'store', // 'store' | 'region'
  regionCache: {
    dong: new Map(),
    sigungu: new Map(),
    sido: new Map()
  },
  lastViewportBounds: null,
  debounceTimer: null,

  // 레벨별 모드 결정
  getModeByLevel(level) {
    if (level >= 1 && level <= 5) return 'store';
    if (level >= 6) return 'region';
    return 'store';
  },

  // 레벨별 집계 티어 결정
  getRegionTierByLevel(level) {
    if (level >= 6 && level <= 7) return 'dong';
    if (level >= 8 && level <= 10) return 'sigungu';
    if (level >= 11) return 'sido';
    return 'dong';
  },

  // 한국 주소 파싱 (법정동 '가' 유지)
  parseKoreanAddressKeepGa(address) {
    if (!address || typeof address !== 'string') {
      return { sido: '미상', sigungu: '미상', legalDongGa: '미상' };
    }

    let sido = '미상';
    let sigungu = '미상';
    let legalDongGa = '미상';

    try {
      // 시/도 추출 (특별시, 광역시, 도, 특별자치시/도)
      const sidoMatch = address.match(/(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)/);
      if (sidoMatch) {
        sido = sidoMatch[1];
      }

      // 시/군/구 추출
      const sigunguMatch = address.match(/([\w]+(?:시|군|구))/);
      if (sigunguMatch) {
        sigungu = sigunguMatch[1];
      }

      // 동/읍/면 추출 (괄호 속 우선, 법정동 '가' 유지)
      let dongMatch = address.match(/\(([\w가-힣]+(?:동|가))[,)]/);
      if (!dongMatch) {
        dongMatch = address.match(/([\w가-힣]+(?:읍|면|동|가))/);
      }
      if (dongMatch) {
        legalDongGa = dongMatch[1];
      }

    } catch (error) {
      console.warn('주소 파싱 오류:', address, error);
    }

    return { sido, sigungu, legalDongGa };
  },

  // 뷰포트 내 매장 필터링
  getStoresInViewport(stores, map) {
    if (!stores || stores.length === 0) return [];

    const bounds = map.getBounds();
    if (!bounds) return stores;

    // 경계 확장 (패딩)
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latPadding = (ne.getLat() - sw.getLat()) * 0.1;
    const lngPadding = (ne.getLng() - sw.getLng()) * 0.1;

    const extendedSW = new kakao.maps.LatLng(sw.getLat() - latPadding, sw.getLng() - lngPadding);
    const extendedNE = new kakao.maps.LatLng(ne.getLat() + latPadding, ne.getLng() + lngPadding);

    return stores.filter(store => {
      if (!store.coord || !store.coord.lat || !store.coord.lng) return false;
      
      const lat = store.coord.lat;
      const lng = store.coord.lng;
      
      return lat >= extendedSW.getLat() && lat <= extendedNE.getLat() &&
             lng >= extendedSW.getLng() && lng <= extendedNE.getLng();
    });
  },

  // 티어별 그룹핑
  groupByTier(stores, tier) {
    const groups = new Map();

    stores.forEach(store => {
      const parsed = this.parseKoreanAddressKeepGa(store.address);
      let key;

      switch (tier) {
        case 'dong':
          key = `${parsed.sido} ${parsed.sigungu} ${parsed.legalDongGa}`;
          break;
        case 'sigungu':
          key = `${parsed.sido} ${parsed.sigungu}`;
          break;
        case 'sido':
          key = parsed.sido;
          break;
        default:
          key = '미상';
      }

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          stores: [],
          latSum: 0,
          lngSum: 0,
          count: 0
        });
      }

      const group = groups.get(key);
      group.stores.push(store);
      group.latSum += store.coord.lat;
      group.lngSum += store.coord.lng;
      group.count++;
    });

    // 센트로이드 계산
    const result = [];
    groups.forEach(group => {
      result.push({
        key: group.key,
        lat: group.latSum / group.count,
        lng: group.lngSum / group.count,
        count: group.count,
        stores: group.stores
      });
    });

    return result;
  },

  // 개별 매장 마커 생성 (최초 1회만)
  async buildStoreMarkers(stores, map) {
    console.log('🏪 개별 매장 마커 생성:', stores.length, '개');
    
    for (const store of stores) {
      if (!store.coord || this.storeMarkers.has(store.id)) continue;

      const marker = await this.createCustomMarker(store, map);
      if (marker) {
        marker.setMap(null); // 기본은 숨김
        this.storeMarkers.set(store.id, marker);
      }
    }

    console.log('✅ 개별 마커 생성 완료:', this.storeMarkers.size, '개');
  },

  // 개별 마커 표시
  showStoreMarkers(map) {
    this.storeMarkers.forEach(marker => {
      marker.setMap(map);
    });
  },

  // 개별 마커 숨김
  hideStoreMarkers() {
    this.storeMarkers.forEach(marker => {
      marker.setMap(null);
    });
  },

  // 집계 오버레이 생성
  buildRegionOverlaysFromGroups(groups, map) {
    this.clearRegionOverlays();

    groups.forEach(group => {
      if (group.count === 0) return;

      const content = this.createRegionOverlayContent(group);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(group.lat, group.lng),
        content: content,
        yAnchor: 0.5,
        xAnchor: 0.5
      });

      // 클릭 시 확대
      const overlayElement = overlay.getContent();
      overlayElement.addEventListener('click', () => {
        map.setCenter(new kakao.maps.LatLng(group.lat, group.lng));
        const currentLevel = map.getLevel();
        if (currentLevel > 1) {
          map.setLevel(currentLevel - 1);
        }
      });

      this.regionOverlays.push(overlay);
    });
  },

  // 집계 오버레이 HTML 생성
  createRegionOverlayContent(group) {
    return `
      <div class="region-overlay" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        cursor: pointer;
        border: 2px solid white;
        text-align: center;
        min-width: 60px;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size: 10px; margin-bottom: 2px;">${group.key}</div>
        <div style="font-size: 14px; font-weight: 700;">${group.count}개</div>
      </div>
    `;
  },

  // 집계 오버레이 표시
  showRegionOverlays(map) {
    this.regionOverlays.forEach(overlay => {
      overlay.setMap(map);
    });
  },

  // 집계 오버레이 숨김
  hideRegionOverlays() {
    this.regionOverlays.forEach(overlay => {
      overlay.setMap(null);
    });
  },

  // 집계 오버레이 삭제
  clearRegionOverlays() {
    this.hideRegionOverlays();
    this.regionOverlays = [];
  },

  // 단일 전환 스위치 (핵심 함수)
  handleMapLevelChange(map, stores) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const level = map.getLevel();
      const newMode = this.getModeByLevel(level);
      
      console.log('🔄 레벨', level, '변경에 따른 마커 업데이트 시작');

      // 뷰포트 내 매장만 필터링
      const storesInView = this.getStoresInViewport(stores, map);
      
      if (newMode === 'store') {
        // 개별 모드
        this.hideRegionOverlays();
        this.clearRegionOverlays();
        
        // 뷰포트 내 매장만 표시
        this.hideStoreMarkers();
        storesInView.forEach(store => {
          const marker = this.storeMarkers.get(store.id);
          if (marker) {
            marker.setMap(map);
          }
        });
        
        this.currentMode = 'store';
        console.log('🏪 개별 매장 마커 모드:', storesInView.length, '개 표시');
        
      } else {
        // 집계 모드
        this.hideStoreMarkers();
        
        const tier = this.getRegionTierByLevel(level);
        const cacheKey = `${tier}_${level}_${storesInView.length}`;
        
        let groups;
        if (this.regionCache[tier].has(cacheKey)) {
          groups = this.regionCache[tier].get(cacheKey);
          console.log('📁 캐시에서 집계 데이터 사용:', tier, groups.length, '개 그룹');
        } else {
          groups = this.groupByTier(storesInView, tier);
          this.regionCache[tier].set(cacheKey, groups);
          console.log('🆕 새로운 집계 데이터 생성:', tier, groups.length, '개 그룹');
        }
        
        this.buildRegionOverlaysFromGroups(groups, map);
        this.showRegionOverlays(map);
        
        this.currentMode = 'region';
        console.log('🏘️ 집계 마커 모드:', tier, groups.length, '개 그룹 표시');
      }
      
      console.log('✅ 레벨', level, '마커 업데이트 완료:', this.currentMode, '모드');
    }, 150);
  },

  // 초기화
  async initMapWithMarkers(map, stores) {
    console.log('🔄 지도 레벨', map.getLevel(), '에 따른 마커 생성:', stores.length, '개 매장');
    
    // 개별 마커 미리 생성 (숨김 상태)
    await this.buildStoreMarkers(stores, map);
    
    // 현재 레벨에 따른 표시
    this.handleMapLevelChange(map, stores);
    
    // 이벤트 연결
    kakao.maps.event.addListener(map, 'idle', () => {
      this.handleMapLevelChange(map, stores);
    });
    
    console.log('✅ 동적 마커 시스템 초기화 완료');
  },

  // 기존 커스텀 마커 생성 함수 (호환성 유지)
  async createCustomMarker(store, map, preloadedRating = null) {
    if (!store.coord) return null;

    const isOpen = store.isOpen !== false;
    const statusText = isOpen ? '운영중' : '운영준비중';
    const statusColor = isOpen ? '#4caf50' : '#ff9800';

    let rating = '0.0';
    if (preloadedRating) {
      rating = parseFloat(preloadedRating.ratingAverage).toFixed(1);
    } else if (window.loadStoreRatingAsync) {
      const ratingData = await window.loadStoreRatingAsync(store.id);
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
      }
    }

    const customOverlayContent = this.getMarkerHTML(store, rating, statusColor, statusText);

    const customOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
      content: customOverlayContent,
      yAnchor: 0.95,
      xAnchor: 0.5
    });

    customOverlay.storeId = store.id;
    customOverlay.storeName = store.name;
    customOverlay.isOpen = store.isOpen;
    customOverlay.createdAt = new Date().toISOString();

    return customOverlay;
  },

  // 일괄 마커 생성 (기존 호출 래핑)
  async createMarkersInBatch(stores, map) {
    console.log('🔄 일괄 마커 생성 요청을 동적 시스템으로 라우팅');
    await this.initMapWithMarkers(map, stores);
    return Array.from(this.storeMarkers.values());
  },

  // 마커 HTML 생성 (기존 유지)
  getMarkerHTML(store, rating, statusColor, statusText) {
    const gradientColor = statusColor === '#4caf50' ? 
      'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)' : 
      'linear-gradient(135deg, #ff9800 0%, #ffb74d 50%, #ffcc02 100%)';
    
    return `
      <div class="modern-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="marker-container">
          <div class="store-name-label">${store.name}</div>
          <div class="marker-rectangle" style="background: ${gradientColor};">
            <div class="marker-inner">
              <div class="status-text-display">
                <span class="status-text">${statusText}</span>
              </div>
              <div class="rating-display">
                <span class="star-icon">⭐</span>
                <span class="rating-text">${rating}</span>
              </div>
            </div>
            <div class="marker-pulse" style="background: ${statusColor};"></div>
          </div>
          <div class="marker-point"></div>
        </div>
      </div>

      <style>
        .modern-marker {
          position: relative;
          cursor: pointer;
          z-index: 15;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .store-name-label {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.1);
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .marker-rectangle {
          width: 80px;
          height: 36px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 3px solid white;
          box-shadow: 
            0 4px 20px rgba(0,0,0,0.15),
            0 2px 8px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.3);
          overflow: hidden;
        }

        .marker-inner {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
          padding: 0 8px;
        }

        .status-text-display {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .status-text {
          color: white;
          font-size: 9px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          white-space: nowrap;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }

        .star-icon {
          font-size: 10px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        .rating-text {
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }

        .marker-pulse {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 18px;
          opacity: 0.4;
          animation: pulse 2s infinite;
          z-index: 1;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }

        .marker-point {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid white;
          margin-top: -2px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .modern-marker:hover {
          transform: translateY(-2px) scale(1.05);
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25));
        }

        .modern-marker:hover .store-name-label {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .modern-marker:hover .marker-pulse {
          animation-duration: 1s;
        }

        .modern-marker:active {
          transform: translateY(0) scale(1.02);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }

        .modern-marker:active .marker-rectangle {
          transform: scale(0.95);
        }

        .region-overlay:hover {
          transform: scale(1.1) !important;
        }
      </style>
    `;
  }
};
