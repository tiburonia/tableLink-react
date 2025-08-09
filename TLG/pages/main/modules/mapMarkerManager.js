
// 지도 마커 관리자
window.MapMarkerManager = {
  // 전역 상태 관리
  currentDisplayMode: 'individual', // 'individual' | 'cluster'
  currentMarkers: [],
  regionCache: {
    dong: null,
    sigungu: null, 
    sido: null
  },

  // 레벨별 모드 판정
  getModeByLevel(level) {
    return level <= 5 ? 'individual' : 'cluster';
  },

  // 레벨별 지역 티어 판정
  getRegionTierByLevel(level) {
    if (level >= 10) return 'sido';        // 도/특별시/광역시
    if (level >= 8) return 'sigungu';      // 시/군/구
    if (level >= 6) return 'dong';         // 읍/면/동
    return null;
  },

  // 지도 레벨 변경 핸들러 (메인 전환 로직)
  async handleMapLevelChange(map, stores) {
    const currentLevel = map.getLevel();
    const newMode = this.getModeByLevel(currentLevel);
    
    console.log(`🔄 지도 레벨 ${currentLevel} - 모드: ${newMode}`);

    // 기존 마커 완전 제거
    this.clearAllMarkers();

    if (newMode === 'individual') {
      // 개별 매장 마커 표시
      this.currentDisplayMode = 'individual';
      const markers = await this.createIndividualMarkers(stores, map);
      this.currentMarkers = markers;
      console.log(`✅ 개별 마커 표시: ${markers.length}개`);
    } else {
      // 지역 집계 마커 표시
      this.currentDisplayMode = 'cluster';
      const tier = this.getRegionTierByLevel(currentLevel);
      const clusterMarkers = await this.createClusterMarkers(stores, map, tier);
      this.currentMarkers = clusterMarkers;
      console.log(`✅ ${tier} 집계 마커 표시: ${clusterMarkers.length}개`);
    }
  },

  // 기존 마커 완전 삭제
  clearAllMarkers() {
    if (this.currentMarkers && this.currentMarkers.length > 0) {
      this.currentMarkers.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      this.currentMarkers = [];
    }

    // 전역 변수도 정리
    if (window.currentMarkers) {
      window.currentMarkers.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.currentMarkers = [];
    }

    if (window.markerMap) {
      window.markerMap.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.markerMap.clear();
    }
  },

  // 개별 매장 마커 생성
  async createIndividualMarkers(stores, map) {
    console.log(`🏪 개별 매장 마커 생성: ${stores.length}개`);

    // 1. 모든 매장의 별점 정보 일괄 조회
    const storeIds = stores.map(store => store.id);
    const allRatings = await window.loadAllStoreRatings(storeIds);

    // 2. 각 매장 마커 생성
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
  async createClusterMarkers(stores, map, tier) {
    console.log(`🗺️ ${tier} 집계 마커 생성 - ${stores.length}개 매장 처리`);

    // 캐시된 그룹핑 결과 확인
    if (this.regionCache[tier]) {
      console.log(`📁 ${tier} 캐시 사용`);
      return this.createMarkersFromGroups(this.regionCache[tier], map);
    }

    // 새로운 그룹핑 수행
    const regionGroups = this.groupStoresByTier(stores, tier);
    this.regionCache[tier] = regionGroups;

    console.log(`📍 ${tier} 그룹핑 결과:`, Object.keys(regionGroups).map(region => 
      `${region}: ${regionGroups[region].stores.length}개`
    ));

    return this.createMarkersFromGroups(regionGroups, map);
  },

  // 그룹핑 결과로부터 마커 생성
  createMarkersFromGroups(regionGroups, map) {
    const clusterMarkers = [];
    
    for (const [regionName, regionData] of Object.entries(regionGroups)) {
      if (regionData.stores.length > 0) {
        const clusterMarker = this.createClusterMarker(
          regionName, 
          regionData.stores.length, 
          regionData.centerCoord, 
          map
        );

        clusterMarker.includedStores = regionData.stores;
        clusterMarker.regionName = regionName;
        clusterMarkers.push(clusterMarker);
      }
    }

    return clusterMarkers;
  },

  // 한국 주소 파싱 (개선된 버전)
  parseKoreanAddress(address) {
    if (!address || typeof address !== 'string') {
      return { sido: '미상', sigungu: '미상', dong: '미상' };
    }

    try {
      // 우편번호와 괄호 내용 제거
      const cleanAddress = address
        .replace(/^\[\d{5}\]\s*/, '')  // 우편번호 제거
        .replace(/\([^)]*\)/g, '')    // 괄호 내용 제거
        .trim();

      const addressParts = cleanAddress.split(' ').filter(part => part.length > 0);

      if (addressParts.length === 0) {
        return { sido: '미상', sigungu: '미상', dong: '미상' };
      }

      // 시/도 정규화
      let sido = this.normalizeSido(addressParts[0] || '');
      let sigungu = this.normalizeSigungu(addressParts[1] || '');
      let dong = this.normalizeDong(addressParts[2] || '');

      // 동 정보가 없으면 더 뒤에서 찾기
      if (dong === '미상' && addressParts.length > 3) {
        for (let i = 2; i < addressParts.length; i++) {
          const candidate = this.normalizeDong(addressParts[i]);
          if (candidate !== '미상') {
            dong = candidate;
            break;
          }
        }
      }

      return { sido, sigungu, dong };

    } catch (error) {
      console.warn('주소 파싱 오류:', address, error);
      return { sido: '파싱오류', sigungu: '파싱오류', dong: '파싱오류' };
    }
  },

  // 시/도 정규화 (중복 제거)
  normalizeSido(sido) {
    if (!sido) return '미상';

    // 정규화 매핑
    const sidoMap = {
      '서울특별시': '서울',
      '서울시': '서울',
      '서울': '서울',
      '부산광역시': '부산',
      '부산시': '부산', 
      '부산': '부산',
      '대구광역시': '대구',
      '대구시': '대구',
      '대구': '대구',
      '인천광역시': '인천',
      '인천시': '인천',
      '인천': '인천',
      '광주광역시': '광주',
      '광주시': '광주',
      '광주': '광주',
      '대전광역시': '대전',
      '대전시': '대전',
      '대전': '대전',
      '울산광역시': '울산',
      '울산시': '울산',
      '울산': '울산',
      '세종특별자치시': '세종',
      '세종시': '세종',
      '세종': '세종',
      '경기도': '경기',
      '경기': '경기',
      '강원도': '강원',
      '강원특별자치도': '강원',
      '강원': '강원',
      '충청북도': '충북',
      '충북': '충북',
      '충청남도': '충남',
      '충남': '충남',
      '전라북도': '전북',
      '전북': '전북',
      '전라남도': '전남',
      '전남': '전남',
      '경상북도': '경북',
      '경북': '경북',
      '경상남도': '경남',
      '경남': '경남',
      '제주특별자치도': '제주',
      '제주도': '제주',
      '제주': '제주'
    };

    return sidoMap[sido] || sido || '미상';
  },

  // 시/군/구 정규화
  normalizeSigungu(sigungu) {
    if (!sigungu) return '미상';

    // 기본 정규화 (시, 군, 구 제거)
    const normalized = sigungu
      .replace(/(시|군|구)$/, '')
      .trim();

    return normalized || '미상';
  },

  // 읍/면/동 정규화
  normalizeDong(dong) {
    if (!dong) return '미상';

    // 읍/면/동으로 끝나는지 확인
    if (/[읍면동]$/.test(dong)) {
      return dong;
    }

    return '미상';
  },

  // 티어별 매장 그룹핑
  groupStoresByTier(stores, tier) {
    const regionGroups = {};

    stores.forEach(store => {
      if (!store.coord || !store.address) return;

      const parsed = this.parseKoreanAddress(store.address);
      let regionKey;

      // 티어에 따른 지역 키 생성
      switch (tier) {
        case 'sido':
          regionKey = parsed.sido;
          break;
        case 'sigungu':
          regionKey = `${parsed.sido} ${parsed.sigungu}`;
          break;
        case 'dong':
          regionKey = `${parsed.sido} ${parsed.sigungu} ${parsed.dong}`;
          break;
        default:
          regionKey = '미상 지역';
      }

      if (!regionGroups[regionKey]) {
        regionGroups[regionKey] = {
          stores: [],
          totalLat: 0,
          totalLng: 0,
          centerCoord: null
        };
      }

      regionGroups[regionKey].stores.push(store);
      regionGroups[regionKey].totalLat += store.coord.lat;
      regionGroups[regionKey].totalLng += store.coord.lng;
    });

    // 각 지역의 중심 좌표 계산
    Object.keys(regionGroups).forEach(regionKey => {
      const group = regionGroups[regionKey];
      const storeCount = group.stores.length;

      group.centerCoord = {
        lat: group.totalLat / storeCount,
        lng: group.totalLng / storeCount
      };
    });

    return regionGroups;
  },

  // 지도 레벨에 따른 동적 마커 표시 (기존 호환성)
  async createMarkersInBatch(stores, map) {
    const currentLevel = map.getLevel();
    await this.handleMapLevelChange(map, stores);
    return this.currentMarkers;
  },

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

  // 주소에서 지역명 추출 (하위 호환성)
  extractRegionFromAddress(address, level) {
    const parsed = this.parseKoreanAddress(address);
    const tier = this.getRegionTierByLevel(level);

    switch (tier) {
      case 'sido':
        return parsed.sido;
      case 'sigungu':
        return `${parsed.sido} ${parsed.sigungu}`;
      case 'dong':
        return `${parsed.sido} ${parsed.sigungu} ${parsed.dong}`;
      default:
        return '개별 매장';
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
