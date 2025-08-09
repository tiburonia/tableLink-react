// 지도 마커 관리자
window.MapMarkerManager = {
  // 현재 표시 모드 (individual: 개별 매장, cluster: 지역 집계)
  currentDisplayMode: 'individual',

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
    customOverlay.markerType = 'individual';

    return customOverlay;
  },

  // 지역별 집계 마커 생성
  createClusterMarker(region, storeCount, centerCoord, map) {
    const clusterContent = this.getClusterMarkerHTML(region, storeCount);

    const clusterOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng),
      content: clusterContent,
      yAnchor: 0.5,
      xAnchor: 0.5
    });

    // 클러스터 마커 메타데이터
    clusterOverlay.markerType = 'cluster';
    clusterOverlay.regionName = region;
    clusterOverlay.storeCount = storeCount;
    clusterOverlay.createdAt = new Date().toISOString();

    return clusterOverlay;
  },

  // 지도 레벨에 따른 동적 마커 표시
  async createMarkersInBatch(stores, map) {
    if (!Array.isArray(stores) || stores.length === 0) {
      console.warn('⚠️ 생성할 매장 목록이 비어있음');
      return [];
    }

    const currentLevel = map.getLevel();
    console.log(`🔄 지도 레벨 ${currentLevel}에 따른 마커 생성: ${stores.length}개 매장`);

    // 레벨 1-5: 개별 매장 마커 표시
    if (currentLevel <= 5) {
      this.currentDisplayMode = 'individual';
      return await this.createIndividualMarkers(stores, map);
    } 
    // 레벨 6+: 지역별 집계 마커 표시
    else {
      this.currentDisplayMode = 'cluster';
      return await this.createClusterMarkers(stores, map, currentLevel);
    }
  },

  // 개별 매장 마커 생성 (기존 로직)
  async createIndividualMarkers(stores, map) {
    console.log(`🏪 개별 매장 마커 생성: ${stores.length}개`);

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

    console.log(`✅ 개별 마커 생성 완료: ${markers.length}개`);
    return markers;
  },

  // 지역별 집계 마커 생성
  async createClusterMarkers(stores, map, level) {
    console.log(`🗺️ 지역별 집계 마커 생성 (레벨 ${level}) - ${stores.length}개 매장 처리`);

    // 주소 기반 지역 그룹핑
    const regionGroups = this.groupStoresByRegion(stores, level);
    console.log(`📍 지역 그룹핑 결과:`, Object.keys(regionGroups).map(region => 
      `${region}: ${regionGroups[region].stores.length}개`
    ));

    const clusterMarkers = [];
    for (const [regionName, regionData] of Object.entries(regionGroups)) {
      if (regionData.stores.length > 0) {
        console.log(`🏗️ 클러스터 마커 생성: ${regionName} (${regionData.stores.length}개 매장)`);

        const clusterMarker = this.createClusterMarker(
          regionName, 
          regionData.stores.length, 
          regionData.centerCoord, 
          map
        );

        // 클러스터에 포함된 매장 정보 저장
        clusterMarker.includedStores = regionData.stores;
        clusterMarker.regionName = regionName;
        clusterMarkers.push(clusterMarker);
      }
    }

    console.log(`✅ 지역별 집계 마커 생성 완료: ${clusterMarkers.length}개 지역`);
    return clusterMarkers;
  },

  // 주소 기반 지역 그룹핑
  groupStoresByRegion(stores, level) {
    const regionGroups = {};

    stores.forEach(store => {
      if (!store.coord || !store.address) return;

      // 주소에서 지역 추출 (레벨에 따라 다른 단위)
      const regionName = this.extractRegionFromAddress(store.address, level);

      if (!regionGroups[regionName]) {
        regionGroups[regionName] = {
          stores: [],
          totalLat: 0,
          totalLng: 0,
          centerCoord: null
        };
      }

      regionGroups[regionName].stores.push(store);
      regionGroups[regionName].totalLat += store.coord.lat;
      regionGroups[regionName].totalLng += store.coord.lng;
    });

    // 각 지역의 중심 좌표 계산
    Object.keys(regionGroups).forEach(regionName => {
      const group = regionGroups[regionName];
      const storeCount = group.stores.length;

      group.centerCoord = {
        lat: group.totalLat / storeCount,
        lng: group.totalLng / storeCount
      };
    });

    return regionGroups;
  },

  // 주소에서 지역명 추출 (레벨별)
  extractRegionFromAddress(address, level) {
    if (!address || typeof address !== 'string') return '미상 지역';

    try {
      // 우편번호와 괄호 내용 제거 후 주소 파싱
      const cleanAddress = address
        .replace(/^\[\d{5}\]\s*/, '')  // 우편번호 제거
        .replace(/\([^)]*\)/g, '')    // 괄호 내용 제거
        .trim();

      const addressParts = cleanAddress.split(' ').filter(part => part.length > 0);

      if (addressParts.length === 0) return '미상 지역';

      // 레벨에 따른 지역 단위 결정
      if (level >= 10) {
        // 레벨 10+: 도/특별시/광역시 단위
        return addressParts[0] || '미상 도/시';
      } else if (level >= 8) {
        // 레벨 8-9: 시/군/구 단위
        const region1 = addressParts[0] || '';
        const region2 = addressParts[1] || '';
        return region2 ? `${region1} ${region2}` : (region1 || '미상 시/군/구');
      } else if (level >= 6) {
        // 레벨 6-7: 읍/면/동 단위
        const region1 = addressParts[0] || '';
        const region2 = addressParts[1] || '';
        const region3 = addressParts[2] || '';

        if (region3) return `${region1} ${region2} ${region3}`;
        if (region2) return `${region1} ${region2}`;
        return region1 || '미상 읍/면/동';
      } else {
        // 레벨 1-5: 개별 매장 표시 (이 함수가 호출되지 않아야 함)
        console.warn(`⚠️ 레벨 ${level}에서 지역 추출이 호출됨 - 개별 마커를 표시해야 함`);
        return '개별 매장';
      }
    } catch (error) {
      console.warn('주소 파싱 오류:', address, error);
      return '파싱 오류';
    }
  },

  // 클러스터 마커 HTML 생성
  getClusterMarkerHTML(regionName, storeCount) {
    const sizeClass = storeCount > 50 ? 'large' : storeCount > 20 ? 'medium' : 'small';
    const bgColor = storeCount > 50 ? '#e53e3e' : storeCount > 20 ? '#fd7e14' : '#4f46e5';

    return `
      <div class="cluster-marker ${sizeClass}" onclick="handleClusterClick('${regionName}', ${storeCount})">
        <div class="cluster-circle" style="background: ${bgColor};">
          <div class="cluster-count">${storeCount}</div>
        </div>
        <div class="cluster-label">${regionName}</div>
      </div>

      <style>
        .cluster-marker {
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .cluster-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          border: 3px solid white;
          transition: all 0.3s ease;
        }

        .cluster-marker.medium .cluster-circle {
          width: 50px;
          height: 50px;
        }

        .cluster-marker.large .cluster-circle {
          width: 60px;
          height: 60px;
        }

        .cluster-count {
          color: white;
          font-weight: 700;
          font-size: 12px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .cluster-marker.medium .cluster-count {
          font-size: 14px;
        }

        .cluster-marker.large .cluster-count {
          font-size: 16px;
        }

        .cluster-label {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.1);
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cluster-marker:hover {
          transform: translateY(-2px) scale(1.05);
        }

        .cluster-marker:hover .cluster-circle {
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          transform: scale(1.1);
        }

        .cluster-marker:hover .cluster-label {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .cluster-marker:active {
          transform: translateY(0) scale(1.02);
        }
      </style>
    `;
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