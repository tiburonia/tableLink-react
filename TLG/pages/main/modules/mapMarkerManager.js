
// 동적 마커 관리 시스템 - 레벨별 개별/집계 마커 분리
window.MapMarkerManager = {
  // 전역 상태
  storeMarkers: [], // 개별 매장 마커들
  regionOverlays: [], // 지역 집계 오버레이들
  regionCache: {}, // 지역별 그룹 캐시
  currentMode: null, // 'store' | 'region'
  currentTier: null, // 'dong' | 'sigungu' | 'sido'

  // 1. 레벨별 모드 결정
  getModeByLevel(level) {
    return level <= 5 ? 'store' : 'region';
  },

  // 2. 레벨별 지역 단위 결정
  getRegionTierByLevel(level) {
    if (level >= 10) return 'sido';
    if (level >= 8) return 'sigungu';
    return 'dong'; // level 6-7
  },

  // 3. 한국 주소 파싱
  parseKoreanAddress(addr) {
    if (!addr || typeof addr !== 'string') {
      return { sido: '미상', sigungu: '미상', dong: '미상' };
    }

    let sido = '미상';
    let sigungu = '미상';
    let dong = '미상';

    // 우편번호 및 괄호 정리
    let cleanAddr = addr
      .replace(/^\[[0-9-]+\]\s*/, '') // 우편번호 제거
      .replace(/\s+/g, ' ')
      .trim();

    try {
      // 시/도 추출
      const sidoMatch = cleanAddr.match(/(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)/);
      if (sidoMatch) {
        sido = sidoMatch[1];
        // 시/도명 단순화
        sido = sido.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
      }

      // 시/군/구 추출 (시/도 뒤에서)
      const sigunguMatch = cleanAddr.match(/(?:시|도)\s+([^구]*?구|[^시]*?시|[^군]*?군)/);
      if (sigunguMatch) {
        sigungu = sigunguMatch[1];
      }

      // 동 추출 - 괄호 안 우선
      const parenthesesMatch = cleanAddr.match(/\(([^)]*?동)\)/);
      if (parenthesesMatch) {
        dong = parenthesesMatch[1];
      } else {
        // 본문에서 읍/면/동 추출
        const dongMatch = cleanAddr.match(/([가-힣]+(?:읍|면|동))/);
        if (dongMatch) {
          dong = dongMatch[1];
        }
      }
    } catch (error) {
      console.warn('주소 파싱 실패:', addr, error);
    }

    return { sido, sigungu, dong };
  },

  // 4. 매장들을 지역 단위별로 그룹화
  groupStoresByTier(stores, tier) {
    const groups = {};

    stores.forEach(store => {
      if (!store.address || !store.coord) return;

      const parsed = this.parseKoreanAddress(store.address);
      let key;

      switch (tier) {
        case 'sido':
          key = parsed.sido;
          break;
        case 'sigungu':
          key = `${parsed.sido}_${parsed.sigungu}`;
          break;
        case 'dong':
          key = `${parsed.sido}_${parsed.sigungu}_${parsed.dong}`;
          break;
        default:
          return;
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          items: [],
          latSum: 0,
          lngSum: 0,
          count: 0
        };
      }

      groups[key].items.push(store);
      groups[key].latSum += store.coord.lat;
      groups[key].lngSum += store.coord.lng;
      groups[key].count++;
    });

    // 센트로이드 계산
    const result = Object.values(groups).map(group => ({
      key: group.key,
      lat: group.latSum / group.count,
      lng: group.lngSum / group.count,
      count: group.count,
      items: group.items
    }));

    return result.filter(group => group.count > 0);
  },

  // 5. 개별 매장 마커 생성 (최초 1회만)
  async buildStoreMarkers(stores, map) {
    console.log('🏪 개별 매장 마커 생성 시작:', stores.length, '개');
    
    // 기존 마커 정리
    this.clearStoreMarkers();

    for (const store of stores) {
      if (!store.coord) continue;

      const marker = await this.createStoreMarker(store, map);
      if (marker) {
        marker.setMap(null); // 생성 후 즉시 숨김
        this.storeMarkers.push(marker);
      }
    }

    console.log('✅ 개별 매장 마커 생성 완료:', this.storeMarkers.length, '개 (숨김 상태)');
  },

  // 개별 매장 마커 생성 헬퍼
  async createStoreMarker(store, map) {
    const isOpen = store.isOpen !== false;
    const statusColor = isOpen ? '#4caf50' : '#ff9800';
    const statusText = isOpen ? '운영중' : '운영준비중';

    // 별점 정보 조회
    let rating = '0.0';
    try {
      const ratingData = await window.loadStoreRatingAsync(store.id);
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
      }
    } catch (error) {
      console.warn('별점 조회 실패:', store.id, error);
    }

    const content = `
      <div class="store-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="marker-content" style="background: ${statusColor};">
          <div class="store-name">${store.name}</div>
          <div class="store-info">
            <span class="status">${statusText}</span>
            <span class="rating">★${rating}</span>
          </div>
        </div>
        <div class="marker-arrow"></div>
      </div>
      <style>
        .store-marker {
          position: relative;
          cursor: pointer;
          z-index: 100;
        }
        .marker-content {
          background: #4caf50;
          color: white;
          padding: 8px 12px;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          font-size: 12px;
          font-weight: 600;
          min-width: 100px;
        }
        .store-name {
          margin-bottom: 2px;
          font-size: 13px;
        }
        .store-info {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          opacity: 0.9;
        }
        .marker-arrow {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid ${statusColor};
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -6px;
        }
        .store-marker:hover .marker-content {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
      </style>
    `;

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
      content: content,
      yAnchor: 1,
      xAnchor: 0.5
    });

    overlay.storeId = store.id;
    return overlay;
  },

  // 6. 개별 마커 표시/숨김
  showStoreMarkers(map) {
    this.storeMarkers.forEach(marker => marker.setMap(map));
    console.log('👀 개별 매장 마커 표시:', this.storeMarkers.length, '개');
  },

  hideStoreMarkers() {
    this.storeMarkers.forEach(marker => marker.setMap(null));
    console.log('🙈 개별 매장 마커 숨김:', this.storeMarkers.length, '개');
  },

  clearStoreMarkers() {
    this.storeMarkers.forEach(marker => marker.setMap(null));
    this.storeMarkers = [];
  },

  // 7. 지역 집계 오버레이 생성
  buildRegionOverlaysFromGroups(groups, map) {
    this.clearRegionOverlays();

    groups.forEach(group => {
      const displayName = this.formatGroupName(group.key);
      
      const content = `
        <div class="region-marker" onclick="window.MapMarkerManager.handleRegionClick('${group.key}', ${group.lat}, ${group.lng})">
          <div class="region-badge">
            <div class="region-name">${displayName}</div>
            <div class="region-count">${group.count}개</div>
          </div>
        </div>
        <style>
          .region-marker {
            cursor: pointer;
            z-index: 200;
          }
          .region-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 16px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
            font-weight: 600;
            min-width: 80px;
          }
          .region-name {
            font-size: 14px;
            margin-bottom: 4px;
          }
          .region-count {
            font-size: 12px;
            opacity: 0.9;
          }
          .region-marker:hover .region-badge {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          }
        </style>
      `;

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(group.lat, group.lng),
        content: content,
        yAnchor: 0.5,
        xAnchor: 0.5
      });

      overlay.groupKey = group.key;
      overlay.setMap(null); // 생성 후 숨김
      this.regionOverlays.push(overlay);
    });

    console.log('🏘️ 지역 집계 오버레이 생성 완료:', groups.length, '개');
  },

  // 그룹명 포맷팅
  formatGroupName(key) {
    const parts = key.split('_');
    if (parts.length === 1) return parts[0]; // 시/도만
    if (parts.length === 2) return parts[1]; // 시/군/구만
    return parts[2]; // 읍/면/동만
  },

  // 8. 지역 집계 오버레이 표시/숨김
  showRegionOverlays(map) {
    this.regionOverlays.forEach(overlay => overlay.setMap(map));
    console.log('👀 지역 집계 오버레이 표시:', this.regionOverlays.length, '개');
  },

  hideRegionOverlays() {
    this.regionOverlays.forEach(overlay => overlay.setMap(null));
    console.log('🙈 지역 집계 오버레이 숨김:', this.regionOverlays.length, '개');
  },

  clearRegionOverlays() {
    this.regionOverlays.forEach(overlay => overlay.setMap(null));
    this.regionOverlays = [];
  },

  // 9. 지역 마커 클릭 핸들러
  handleRegionClick(groupKey, lat, lng) {
    console.log('🎯 지역 마커 클릭:', groupKey);
    // 클릭된 지역으로 줌인
    if (window.currentMap) {
      const position = new kakao.maps.LatLng(lat, lng);
      window.currentMap.setCenter(position);
      const currentLevel = window.currentMap.getLevel();
      window.currentMap.setLevel(Math.max(1, currentLevel - 2));
    }
  },

  // 10. 핵심 전환 로직 - 단일 진입점
  handleMapLevelChange(map, stores) {
    const level = map.getLevel();
    const newMode = this.getModeByLevel(level);
    const newTier = this.getRegionTierByLevel(level);

    console.log(`🔄 지도 레벨 ${level} - 모드: ${newMode}, 단위: ${newTier}`);

    // 모드 전환 체크
    if (this.currentMode !== newMode) {
      if (newMode === 'store') {
        // 지역 → 개별 전환
        this.hideRegionOverlays();
        this.showStoreMarkers(map);
      } else {
        // 개별 → 지역 전환
        this.hideStoreMarkers();
      }
      this.currentMode = newMode;
    }

    // 지역 모드에서 단위 변경 체크
    if (newMode === 'region' && this.currentTier !== newTier) {
      this.hideRegionOverlays();
      
      // 캐시 확인
      const cacheKey = newTier;
      if (!this.regionCache[cacheKey]) {
        console.log('📊 지역 그룹 생성:', newTier);
        this.regionCache[cacheKey] = this.groupStoresByTier(stores, newTier);
      }

      const groups = this.regionCache[cacheKey];
      console.log(`🏘️ ${newTier} 단위 그룹: ${groups.length}개`);
      
      this.buildRegionOverlaysFromGroups(groups, map);
      this.showRegionOverlays(map);
      
      this.currentTier = newTier;
    }
  },

  // 11. 초기화 진입점
  async initMapWithMarkers(map, stores) {
    console.log('🚀 동적 마커 시스템 초기화 시작');
    
    // 전역 맵 참조 저장
    window.currentMap = map;
    
    // 상태 초기화
    this.currentMode = null;
    this.currentTier = null;
    this.regionCache = {};
    
    // 개별 매장 마커 생성 (숨김 상태)
    await this.buildStoreMarkers(stores, map);
    
    // 초기 상태 설정
    this.handleMapLevelChange(map, stores);
    
    // 지도 이벤트 등록
    kakao.maps.event.addListener(map, 'zoom_changed', 
      this.debounce(() => this.handleMapLevelChange(map, stores), 150)
    );
    
    console.log('✅ 동적 마커 시스템 초기화 완료');
  },

  // 디바운스 헬퍼
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 기존 인터페이스 호환성 유지
  async createMarkersInBatch(stores, map) {
    console.log('🔄 일괄 마커 생성 호출 (새 시스템으로 리다이렉트)');
    await this.initMapWithMarkers(map, stores);
    return this.storeMarkers;
  }
};
