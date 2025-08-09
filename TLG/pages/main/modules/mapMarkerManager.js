
// 지도 마커 관리자
window.MapMarkerManager = {
  // 전역 마커 저장소
  individualMarkers: new Map(), // 개별 매장 마커
  clusterMarkers: new Map(),    // 집계 마커
  currentLevel: 0,
  currentStores: [],

  // 레벨에 따른 동적 마커 업데이트 (메인 엔트리 포인트)
  async handleMapLevelChange(level, stores, map) {
    console.log(`🔄 레벨 ${level} 변경에 따른 마커 업데이트 시작`);
    
    this.currentLevel = level;
    this.currentStores = stores;

    // 기존 마커 모두 숨기기
    this.hideAllMarkers();

    const mode = this.determineModeByLevel(level);
    console.log(`📊 레벨 ${level} -> 모드: ${mode}`);

    if (mode === 'store') {
      // 개별 매장 마커 표시
      console.log(`🏪 개별 매장 마커 모드 (레벨 ${level})`);
      await this.showIndividualMarkers(stores, map);
    } else {
      // 집계 마커 표시
      const tier = this.getRegionTierByLevel(level);
      console.log(`🏘️ 집계 마커 모드 (레벨 ${level}, tier: ${tier})`);
      await this.showClusterMarkers(stores, map, tier);
    }

    console.log(`✅ 레벨 ${level} 마커 업데이트 완료`);
  },

  // 1. 모드 결정 (개별 vs 집계)
  determineModeByLevel(level) {
    return level <= 5 ? 'store' : 'region';
  },

  // 2. 레벨별 지역 단위 결정
  getRegionTierByLevel(level) {
    if (level >= 11) return 'sido';        // 11+ -> 시/도 집계
    if (level >= 8) return 'sigungu';      // 8-10 -> 시/군/구 집계
    return 'dong';                         // 6-7 -> 읍/면/동 집계
  },

  // 개별 매장 마커 표시
  async showIndividualMarkers(stores, map) {
    console.log(`🏪 개별 매장 마커 생성: ${stores.length}개`);

    for (const store of stores) {
      if (!store.coord) continue;

      const markerId = `store_${store.id}`;
      
      // 이미 생성된 마커가 있으면 재사용
      if (this.individualMarkers.has(markerId)) {
        const marker = this.individualMarkers.get(markerId);
        marker.setMap(map);
        continue;
      }

      // 새 마커 생성
      const marker = await this.createCustomMarker(store, map);
      if (marker) {
        this.individualMarkers.set(markerId, marker);
      }
    }

    console.log(`✅ 개별 마커 생성 완료: ${this.individualMarkers.size}개`);
  },

  // 집계 마커 표시
  async showClusterMarkers(stores, map, tier) {
    console.log(`🏘️ ${tier} 집계 마커 생성: ${stores.length}개 매장`);

    // 지역별로 매장 그룹화
    const clusters = this.groupStoresByRegion(stores, tier);
    console.log(`📊 ${tier} 그룹화 결과: ${clusters.size}개 지역`);
    
    // 각 지역별 매장 수 출력
    for (const [regionKey, regionStores] of clusters.entries()) {
      console.log(`  - ${regionKey}: ${regionStores.length}개 매장`);
    }
    
    for (const [regionKey, regionStores] of clusters.entries()) {
      const clusterId = `${tier}_${regionKey}`;
      
      // 이미 생성된 집계 마커가 있으면 재사용
      if (this.clusterMarkers.has(clusterId)) {
        const marker = this.clusterMarkers.get(clusterId);
        marker.setMap(map);
        console.log(`♻️ 기존 집계 마커 재사용: ${regionKey}`);
        continue;
      }

      // 새 집계 마커 생성
      console.log(`🆕 새 집계 마커 생성: ${regionKey} (${regionStores.length}개 매장)`);
      const marker = await this.createClusterMarker(regionKey, regionStores, map, tier);
      if (marker) {
        this.clusterMarkers.set(clusterId, marker);
        console.log(`✅ 집계 마커 생성 성공: ${regionKey}`);
      } else {
        console.log(`❌ 집계 마커 생성 실패: ${regionKey}`);
      }
    }

    console.log(`✅ ${tier} 집계 마커 생성 완료: ${clusters.size}개`);
  },

  // 지역별 매장 그룹화
  groupStoresByRegion(stores, tier) {
    const clusters = new Map();

    stores.forEach(store => {
      if (!store.address) return;

      const regionName = this.extractRegionName(store.address, tier);
      if (!regionName) return;

      if (!clusters.has(regionName)) {
        clusters.set(regionName, []);
      }
      clusters.get(regionName).push(store);
    });

    return clusters;
  },

  // 주소에서 지역명 추출
  extractRegionName(address, tier) {
    if (!address) return null;

    // 대괄호와 괄호 제거 후 주소 파싱
    const cleanAddress = address.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    const parts = cleanAddress.split(' ').filter(part => part.length > 0);
    
    console.log(`🗺️ 주소 파싱: "${address}" -> [${parts.join(', ')}] (tier: ${tier})`);
    
    if (tier === 'sido') {
      // 시/도 (첫 번째 부분)
      return parts[0] || null;
    } else if (tier === 'sigungu') {
      // 시/군/구 (두 번째 부분까지)
      return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : null;
    } else if (tier === 'dong') {
      // 읍/면/동 (세 번째 부분까지)
      return parts.length >= 3 ? `${parts[0]} ${parts[1]} ${parts[2]}` : null;
    }

    return null;
  },

  // 집계 마커 생성
  async createClusterMarker(regionName, stores, map, tier) {
    if (!stores || stores.length === 0) return null;

    // 중심 좌표 계산 (매장들의 평균 위치)
    const centerCoord = this.calculateCenterCoordinate(stores);
    if (!centerCoord) return null;

    const storeCount = stores.length;
    const openCount = stores.filter(s => s.isOpen !== false).length;

    // 집계 마커 HTML 생성
    const customOverlayContent = this.getClusterMarkerHTML(regionName, storeCount, openCount, tier);

    // 커스텀 오버레이 생성
    const customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng),
      content: customOverlayContent,
      yAnchor: 0.95,
      xAnchor: 0.5
    });

    // 클릭 이벤트 추가 (해당 지역으로 확대)
    customOverlay.regionName = regionName;
    customOverlay.stores = stores;
    customOverlay.tier = tier;

    return customOverlay;
  },

  // 중심 좌표 계산
  calculateCenterCoordinate(stores) {
    const validStores = stores.filter(s => s.coord && s.coord.lat && s.coord.lng);
    if (validStores.length === 0) return null;

    const sumLat = validStores.reduce((sum, s) => sum + s.coord.lat, 0);
    const sumLng = validStores.reduce((sum, s) => sum + s.coord.lng, 0);

    return {
      lat: sumLat / validStores.length,
      lng: sumLng / validStores.length
    };
  },

  // 집계 마커 HTML 생성
  getClusterMarkerHTML(regionName, totalCount, openCount, tier) {
    const tierLabel = {
      'sido': '시/도',
      'sigungu': '시/군/구', 
      'dong': '동/읍/면'
    }[tier] || '지역';

    return `
      <div class="cluster-marker" onclick="window.MapMarkerManager.handleClusterClick('${regionName}', '${tier}')"
        <div class="cluster-container">
          <div class="cluster-label">${regionName}</div>
          <div class="cluster-circle">
            <div class="cluster-count">${totalCount}</div>
            <div class="cluster-type">${tierLabel}</div>
          </div>
          <div class="cluster-info">운영중 ${openCount}개</div>
        </div>
      </div>

      <style>
        .cluster-marker {
          position: relative;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .cluster-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cluster-label {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cluster-circle {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 20px rgba(41, 126, 252, 0.3);
        }

        .cluster-count {
          color: white;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .cluster-type {
          color: rgba(255, 255, 255, 0.8);
          font-size: 9px;
          font-weight: 500;
          line-height: 1;
        }

        .cluster-info {
          background: rgba(41, 126, 252, 0.1);
          color: #297efc;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
          margin-top: 3px;
        }

        .cluster-marker:hover {
          transform: translateY(-2px) scale(1.05);
        }

        .cluster-marker:hover .cluster-circle {
          box-shadow: 0 6px 25px rgba(41, 126, 252, 0.4);
        }
      </style>
    `;
  },

  // 집계 마커 클릭 처리
  handleClusterClick(regionName, tier) {
    console.log(`📍 ${tier} 집계 마커 클릭: ${regionName}`);
    // TODO: 해당 지역으로 지도 확대 또는 매장 목록 필터링
  },

  // 모든 마커 숨기기
  hideAllMarkers() {
    // 개별 마커 숨기기
    this.individualMarkers.forEach(marker => {
      marker.setMap(null);
    });

    // 집계 마커 숨기기
    this.clusterMarkers.forEach(marker => {
      marker.setMap(null);
    });
  },

  // 모든 마커 완전 삭제
  clearAllMarkers() {
    console.log('🧹 모든 마커 완전 삭제 시작');
    
    this.hideAllMarkers();
    this.individualMarkers.clear();
    this.clusterMarkers.clear();
    
    console.log('✅ 모든 마커 완전 삭제 완료');
  },

  // 기존 개별 마커 생성 함수 (유지)
  async createCustomMarker(store, map, preloadedRating = null) {
    if (!store.coord) return;

    // 매장 운영 상태 확인
    const isOpen = store.isOpen !== false;
    const statusText = isOpen ? '운영중' : '운영준비중';
    const statusColor = isOpen ? '#4caf50' : '#ff9800';

    // 별점 정보 사용 (미리 로드된 경우 사용, 아니면 개별 조회)
    let rating = '0.0';
    if (preloadedRating) {
      rating = parseFloat(preloadedRating.ratingAverage).toFixed(1);
    } else {
      const ratingData = await window.loadStoreRatingAsync(store.id);
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
      }
    }

    // 커스텀 마커 HTML 생성
    const customOverlayContent = this.getMarkerHTML(store, rating, statusColor, statusText);

    // 커스텀 오버레이 생성
    const customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: new kakao.maps.LatLng(store.coord.lat, store.coord.lng),
      content: customOverlayContent,
      yAnchor: 0.95,
      xAnchor: 0.5
    });

    // 마커에 매장 메타데이터 추가
    customOverlay.storeId = store.id;
    customOverlay.storeName = store.name;
    customOverlay.isOpen = store.isOpen;
    customOverlay.createdAt = new Date().toISOString();

    return customOverlay;
  },

  // 일괄 마커 생성 함수 (통합 호출 방식)
  async createMarkersInBatch(stores, map) {
    if (!Array.isArray(stores) || stores.length === 0) {
      console.warn('⚠️ 생성할 매장 목록이 비어있음');
      return [];
    }

    console.log(`🔄 일괄 마커 생성: ${stores.length}개 매장`);

    // 1. 모든 매장의 별점 정보 일괄 조회
    const storeIds = stores.map(store => store.id);
    const allRatings = await window.loadAllStoreRatings(storeIds);

    // 2. 각 매장 마커 생성 (별점 정보는 이미 준비됨)
    const markers = [];
    for (const store of stores) {
      const preloadedRating = allRatings[store.id];
      const marker = await this.createCustomMarker(store, map, preloadedRating);
      if (marker) {
        markers.push(marker);
      }
    }

    console.log(`✅ 마커 생성 완료: ${markers.length}개`);
    return markers;
  },

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
      </style>
    `;
  }
};
