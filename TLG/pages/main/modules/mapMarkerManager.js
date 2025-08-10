
// 새로운 간단한 지도 마커 관리자
window.MapMarkerManager = {
  // 현재 표시된 마커들
  currentMarkers: [],
  
  // 현재 지도 레벨
  currentLevel: 0,
  
  // 처리 중 플래그
  isLoading: false,

  // 메인 진입점 - 레벨 변경시 호출
  async handleMapLevelChange(level, map) {
    console.log(`🔄 지도 레벨 ${level} 변경 - 마커 업데이트 시작`);
    
    if (this.isLoading) {
      console.log('⏸️ 이미 로딩 중 - 무시');
      return;
    }
    
    this.isLoading = true;
    this.currentLevel = level;
    
    try {
      // 기존 마커 모두 제거
      this.clearAllMarkers();
      
      // 새 마커 생성
      if (level <= 5) {
        // 개별 매장 마커 (레벨 1-5)
        await this.showStoreMarkers(map);
      } else {
        // 집계 마커 (레벨 6+)
        await this.showClusterMarkers(map, level);
      }
      
    } catch (error) {
      console.error('❌ 마커 업데이트 실패:', error);
    } finally {
      this.isLoading = false;
    }
    
    console.log(`✅ 지도 레벨 ${level} 마커 업데이트 완료`);
  },

  // 뷰포트 내 매장 데이터 가져오기
  async fetchStores(map) {
    const bounds = map.getBounds();
    const swLat = bounds.getSouthWest().getLat();
    const swLng = bounds.getSouthWest().getLng();
    const neLat = bounds.getNorthEast().getLat();
    const neLng = bounds.getNorthEast().getLng();
    
    const params = new URLSearchParams({
      swLat: swLat,
      swLng: swLng,
      neLat: neLat,
      neLng: neLng,
      level: this.currentLevel
    });

    console.log(`📍 뷰포트 매장 데이터 요청: ${params.toString()}`);
    
    const response = await fetch(`/api/stores/viewport?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '매장 데이터 조회 실패');
    }
    
    console.log(`✅ 매장 데이터 수신: ${data.stores.length}개`);
    return data.stores;
  },

  // 개별 매장 마커 표시
  async showStoreMarkers(map) {
    console.log('🏪 개별 매장 마커 표시 시작');
    
    const stores = await this.fetchStores(map);
    
    for (const store of stores) {
      if (!store.coord?.lat || !store.coord?.lng) continue;
      
      const marker = this.createStoreMarker(store, map);
      this.currentMarkers.push(marker);
    }
    
    console.log(`✅ 개별 마커 ${this.currentMarkers.length}개 생성 완료`);
  },

  // 집계 마커 표시
  async showClusterMarkers(map, level) {
    console.log(`🏘️ 집계 마커 표시 시작 (레벨 ${level})`);
    
    const stores = await this.fetchStores(map);
    console.log(`📍 조회된 매장 수: ${stores.length}개`);
    
    // 지역별 그룹화
    const clusters = this.groupStoresByRegion(stores, level);
    console.log(`🗂️ 그룹화 결과: ${clusters.size}개 지역`);
    
    // 각 지역별 매장 수 로그
    for (const [regionName, regionStores] of clusters.entries()) {
      console.log(`   📍 ${regionName}: ${regionStores.length}개 매장`);
      const marker = this.createClusterMarker(regionName, regionStores, map);
      if (marker) {
        this.currentMarkers.push(marker);
      }
    }
    
    console.log(`✅ 집계 마커 ${this.currentMarkers.length}개 생성 완료`);
  },

  // 개별 매장 마커 생성
  createStoreMarker(store, map) {
    const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
    const isOpen = store.isOpen !== false;
    const rating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
    
    const content = `
      <div class="store-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="marker-info">
          <div class="store-name">${store.name}</div>
          <div class="store-status ${isOpen ? 'open' : 'closed'}">
            ${isOpen ? '운영중' : '운영준비중'} ⭐${rating}
          </div>
        </div>
      </div>
      <style>
        .store-marker {
          background: white;
          border: 2px solid ${isOpen ? '#4caf50' : '#ff9800'};
          border-radius: 12px;
          padding: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 120px;
        }
        .store-marker:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        .store-name {
          font-weight: bold;
          color: #333;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .store-status {
          font-size: 11px;
          font-weight: 500;
        }
        .store-status.open { color: #4caf50; }
        .store-status.closed { color: #ff9800; }
      </style>
    `;
    
    const overlay = new kakao.maps.CustomOverlay({
      position: position,
      content: content,
      yAnchor: 1,
      map: map
    });
    
    return overlay;
  },

  // 집계 마커 생성
  createClusterMarker(regionName, stores, map) {
    if (!stores || stores.length === 0) return null;
    
    // 앵커 좌표 계산 (행정기관 우선, 없으면 센트로이드)
    const anchorCoord = this.calculateAnchorPosition(stores, this.currentLevel);
    if (!anchorCoord) return null;
    
    const position = new kakao.maps.LatLng(anchorCoord.lat, anchorCoord.lng);
    const storeCount = stores.length;
    const openCount = stores.filter(s => s.isOpen !== false).length;
    
    // 표시용 지역명 계산 (첫 번째 매장 기준)
    const displayName = stores.length > 0 ? 
      this.getDisplayRegionName(stores[0], this.currentLevel) || regionName : 
      regionName;
    
    const content = `
      <div class="cluster-marker" onclick="window.MapMarkerManager.zoomToRegion('${regionName}', ${centerCoord.lat}, ${centerCoord.lng})">
        <div class="cluster-info">
          <div class="region-name">${displayName}</div>
          <div class="cluster-count">${storeCount}개 매장 (운영중 ${openCount}개)</div>
        </div>
      </div>
      <style>
        .cluster-marker {
          background: linear-gradient(135deg, #297efc, #4f46e5);
          color: white;
          border-radius: 12px;
          padding: 6px 10px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(41,126,252,0.3);
          min-width: 70px;
          text-align: center;
        }
        .cluster-marker:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(41,126,252,0.4);
        }
        .region-name {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 2px;
        }
        .cluster-count {
          font-size: 10px;
          opacity: 0.9;
        }
      </style>
    `;
    
    const overlay = new kakao.maps.CustomOverlay({
      position: position,
      content: content,
      yAnchor: 1,
      map: map
    });
    
    return overlay;
  },

  // 지역별 매장 그룹화 (sido, sigungu, eupmyeondong 컬럼 사용)
  groupStoresByRegion(stores, level) {
    const clusters = new Map();
    
    stores.forEach(store => {
      const region = this.getRegionByLevel(store, level);
      if (!region) return;
      
      if (!clusters.has(region)) {
        clusters.set(region, []);
      }
      clusters.get(region).push(store);
    });
    
    console.log(`📊 레벨 ${level}에서 ${stores.length}개 매장을 ${clusters.size}개 지역으로 그룹화`);
    
    return clusters;
  },

  // 레벨에 따른 지역명 결정 (DB 컬럼 직접 사용)
  getRegionByLevel(store, level) {
    const { sido, sigungu, eupmyeondong } = store;
    
    if (!sido) return null;
    
    if (level <= 7) {
      // 동/읍/면 단위 (sido + sigungu + eupmyeondong)
      if (eupmyeondong && sigungu) {
        return `${sido} ${sigungu} ${eupmyeondong}`;
      } else if (sigungu) {
        return `${sido} ${sigungu}`;
      } else {
        return sido;
      }
    } else if (level <= 10) {
      // 시/군/구 단위 (sido + sigungu)
      if (sigungu) {
        return `${sido} ${sigungu}`;
      } else {
        return sido;
      }
    } else {
      // 시/도 단위 (sido만)
      return sido;
    }
  },

  // 집계 마커에 표시할 지역명 (레벨별로 해당 컬럼명만)
  getDisplayRegionName(store, level) {
    const { sido, sigungu, eupmyeondong } = store;
    
    if (!sido) return null;
    
    if (level <= 7) {
      // 읍면동 집계 마커 - eupmyeondong만 표시
      if (eupmyeondong) {
        return eupmyeondong;
      } else if (sigungu) {
        return sigungu;
      } else {
        return sido;
      }
    } else if (level <= 10) {
      // 시군구 집계 마커 - sigungu만 표시
      if (sigungu) {
        return sigungu;
      } else {
        return sido;
      }
    } else {
      // 시도 집계 마커 - sido만 표시
      return sido;
    }
  },

  // 집계 마커 앵커 위치 계산 (행정기관 우선, 없으면 센트로이드)
  calculateAnchorPosition(stores, level) {
    const validStores = stores.filter(s => s.coord?.lat && s.coord?.lng);
    if (validStores.length === 0) return null;
    
    // 행정기관으로 추정되는 매장 찾기
    const govStore = this.findGovernmentOffice(validStores, level);
    if (govStore) {
      console.log(`📍 행정기관 앵커: ${govStore.name} (${govStore.coord.lat}, ${govStore.coord.lng})`);
      return govStore.coord;
    }
    
    // 행정기관이 없으면 센트로이드 사용
    const centroid = this.calculateCentroid(validStores);
    console.log(`📍 센트로이드 앵커: (${centroid.lat}, ${centroid.lng})`);
    return centroid;
  },

  // 행정기관 찾기
  findGovernmentOffice(stores, level) {
    // 행정기관 키워드
    const govKeywords = [
      '구청', '시청', '군청', '도청', '시군구청', '읍사무소', '면사무소', '동사무소',
      '행정복지센터', '주민센터', '군청사', '시청사', '구청사', '도청사'
    ];
    
    // 매장명에 행정기관 키워드가 포함된 매장 찾기
    for (const keyword of govKeywords) {
      const govStore = stores.find(store => 
        store.name && store.name.includes(keyword)
      );
      if (govStore) {
        return govStore;
      }
    }
    
    return null;
  },

  // 센트로이드 계산 (기존 중심 좌표 계산)
  calculateCentroid(stores) {
    const avgLat = stores.reduce((sum, s) => sum + s.coord.lat, 0) / stores.length;
    const avgLng = stores.reduce((sum, s) => sum + s.coord.lng, 0) / stores.length;
    
    return { lat: avgLat, lng: avgLng };
  },

  // 중심 좌표 계산 (기존 함수 유지 - 호환성)
  calculateCenter(stores) {
    return this.calculateCentroid(stores);
  },

  // 지역 확대
  zoomToRegion(regionName, lat, lng) {
    console.log(`📍 ${regionName} 지역으로 확대`);
    
    if (window.currentMap) {
      const position = new kakao.maps.LatLng(lat, lng);
      window.currentMap.setCenter(position);
      window.currentMap.setLevel(4);
    }
  },

  // 모든 마커 제거
  clearAllMarkers() {
    console.log(`🧹 기존 마커 ${this.currentMarkers.length}개 제거`);
    
    this.currentMarkers.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    
    this.currentMarkers = [];
  }
};
