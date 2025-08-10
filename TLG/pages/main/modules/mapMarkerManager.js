// 새로운 간단한 지도 마커 관리자
window.MapMarkerManager = {
  // 현재 표시된 마커들
  currentMarkers: [],

  // 현재 지도 레벨
  currentLevel: 0,

  // 처리 중 플래그
  isLoading: false,

  // 현재 작업 취소 플래그
  shouldCancel: false,

  // 메인 진입점 - 레벨 변경시 호출
  async handleMapLevelChange(level, map) {
    console.log(`🔄 지도 레벨 ${level} 변경 - 마커 업데이트 시작`);

    // 이전 레벨과 현재 레벨의 마커 타입 확인
    const prevMarkerType = this.getMarkerType(this.currentLevel);
    const newMarkerType = this.getMarkerType(level);

    if (this.isLoading) {
      // 마커 타입이 바뀌면 기존 작업 취소하고 새로 시작
      if (prevMarkerType !== newMarkerType) {
        console.log(`🔄 마커 타입 변경 (${prevMarkerType} → ${newMarkerType}) - 기존 작업 취소`);
        this.shouldCancel = true;
        this.clearAllMarkers();
        // 잠시 대기 후 새 작업 시작
        setTimeout(() => this.handleMapLevelChange(level, map), 100);
        return;
      } else {
        console.log('⏸️ 이미 로딩 중 - 무시');
        return;
      }
    }

    this.isLoading = true;
    this.shouldCancel = false;
    
    // 마커 타입이 같으면 기존 마커 유지하고 추가 마커만 생성
    if (prevMarkerType === newMarkerType) {
      console.log(`✨ 마커 타입 동일 (${newMarkerType}) - 기존 마커 유지하고 새 영역 추가`);
      this.currentLevel = level;
      
      try {
        // 같은 마커 타입 내에서 추가 마커 생성
        await this.addMarkersForCurrentType(map, level, newMarkerType);
      } catch (error) {
        if (!this.shouldCancel) {
          console.error('❌ 추가 마커 생성 실패:', error);
        }
      } finally {
        this.isLoading = false;
      }
      return;
    }
    
    // 마커 타입이 바뀔 때만 기존 마커 제거
    this.clearAllMarkers();
    this.currentLevel = level;

    try {
      // 레벨별 마커 생성
      if (level <= 5) {
        // 개별 매장 마커만 (레벨 1-5)
        console.log(`🏪 레벨 ${level}: 개별 매장 마커만 표시`);
        await this.showStoreMarkers(map);
      } else if (level <= 7) {
        // 읍면동 집계 마커만 (레벨 6-7)
        console.log(`🏘️ 레벨 ${level}: 읍면동 집계 마커만 표시`);
        await this.showClusterMarkers(map, level);
      } else if (level <= 10) {
        // 시군구 집계 마커만 (레벨 8-10)
        console.log(`🏛️ 레벨 ${level}: 시군구 집계 마커만 표시`);
        await this.showClusterMarkers(map, level);
      } else {
        // 시도 집계 마커만 (레벨 11+)
        console.log(`🗺️ 레벨 ${level}: 시도 집계 마커만 표시`);
        await this.showClusterMarkers(map, level);
      }

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ 마커 업데이트 실패:', error);
      }
    } finally {
      this.isLoading = false;
    }

    if (!this.shouldCancel) {
      console.log(`✅ 지도 레벨 ${level} 마커 업데이트 완료`);
    }
  },

  // 마커 타입 결정 (레벨별 세분화)
  getMarkerType(level) {
    if (level <= 5) return 'individual';      // 개별 매장
    if (level <= 7) return 'eupmyeondong';    // 읍면동 집계
    if (level <= 10) return 'sigungu';        // 시군구 집계
    return 'sido';                            // 시도 집계
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

    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 개별 매장 마커 생성 취소됨 (레벨 변경)');
      return;
    }

    // 유효한 좌표를 가진 매장들 필터링
    const validStores = stores.filter(store => store.coord?.lat && store.coord?.lng);
    console.log(`📍 유효한 매장 수: ${validStores.length}개`);

    // 모든 마커를 한번에 생성
    const markers = this.createStoreMarkersBatch(validStores, map);
    
    // 작업 취소 최종 확인 후 추가
    if (!this.shouldCancel) {
      this.currentMarkers.push(...markers);
      console.log(`✅ 개별 마커 ${markers.length}개 생성 완료`);
    } else {
      console.log('🚫 개별 매장 마커 생성 취소됨 (마커 생성 후)');
      // 생성된 마커들 정리
      markers.forEach(marker => marker.setMap(null));
    }
  },

  // 집계 마커 표시
  async showClusterMarkers(map, level) {
    console.log(`🏘️ 집계 마커 표시 시작 (레벨 ${level})`);

    const stores = await this.fetchStores(map);
    
    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 집계 마커 생성 취소됨 (레벨 변경)');
      return;
    }
    
    console.log(`📍 조회된 매장 수: ${stores.length}개`);

    // 지역별 그룹화
    const clusters = this.groupStoresByRegion(stores, level);
    console.log(`🗂️ 그룹화 결과: ${clusters.size}개 지역`);

    // 각 지역별 매장 수 로그
    for (const [regionName, regionStores] of clusters.entries()) {
      console.log(`   📍 ${regionName}: ${regionStores.length}개 매장`);
    }

    // 모든 집계 마커를 한번에 생성
    const markers = await this.createClusterMarkersBatch(clusters, map);
    
    // 작업 취소 최종 확인 후 추가
    if (!this.shouldCancel) {
      this.currentMarkers.push(...markers);
      console.log(`✅ 집계 마커 ${markers.length}개 생성 완료`);
    } else {
      console.log('🚫 집계 마커 생성 취소됨 (마커 생성 후)');
      // 생성된 마커들 정리
      markers.forEach(marker => marker.setMap(null));
    }
  },

  // 개별 매장 마커 배치 생성
  createStoreMarkersBatch(stores, map) {
    console.log(`📦 개별 매장 마커 배치 생성: ${stores.length}개`);
    
    // 모든 마커를 한번에 생성
    const markers = stores.map(store => this.createStoreMarker(store, map));
    
    console.log(`✅ 배치 생성 완료: ${markers.length}개 마커`);
    return markers;
  },

  // 개별 매장 마커 생성
  createStoreMarker(store, map) {
    const position = new kakao.maps.LatLng(store.coord.lat, store.coord.lng);
    const isOpen = store.isOpen !== false;
    const rating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';

    // 고유 ID 생성
    const markerId = `store-${store.id || Math.random().toString(36).substr(2, 9)}`;

    const content = `
      <div id="${markerId}" class="store-marker store-marker-hoverable" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
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
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          min-width: 100px;
          position: relative;
          z-index: 200;
          transition: all 0.2s ease;
        }
        .store-marker-hoverable:hover {
          transform: scale(1.1) !important;
          z-index: 9999 !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
          border-width: 3px !important;
        }
        .store-name {
          font-weight: bold;
          color: #333;
          font-size: 12px;
          margin-bottom: 2px;
          line-height: 1.2;
        }
        .store-status {
          font-size: 10px;
          font-weight: 500;
          line-height: 1.2;
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

  // 집계 마커 배치 생성 (최적화된 버전)
  async createClusterMarkersBatch(clusters, map) {
    console.log(`📦 집계 마커 배치 생성: ${clusters.size}개`);
    
    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 집계 마커 배치 생성 중단됨');
      return [];
    }
    
    const clusterEntries = Array.from(clusters.entries());
    
    // 1단계: 모든 행정기관 좌표를 배치로 조회
    const adminCoords = await this.batchGetAdministrativeCoords(clusterEntries);
    
    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 집계 마커 배치 생성 중단됨 (좌표 조회 후)');
      return [];
    }
    
    // 2단계: 좌표와 함께 마커 생성 (DB 조회 없이)
    const markerPromises = clusterEntries.map(([regionName, regionStores], index) => 
      this.createClusterMarkerWithCoord(regionName, regionStores, map, adminCoords[index])
    );
    
    const markers = await Promise.all(markerPromises);
    const validMarkers = markers.filter(marker => marker !== null);
    
    console.log(`✅ 배치 생성 완료: ${validMarkers.length}개 마커`);
    return validMarkers;
  },

  // 좌표가 미리 제공된 집계 마커 생성 (성능 최적화)
  async createClusterMarkerWithCoord(regionName, stores, map, preCalculatedCoord) {
    if (!stores || stores.length === 0) return null;

    let anchorCoord = preCalculatedCoord;
    
    // 미리 계산된 좌표가 없으면 기존 방식 사용
    if (!anchorCoord) {
      anchorCoord = await this.calculateAnchorPosition(stores, this.currentLevel);
      if (!anchorCoord) return null;
    }

    return this.createClusterMarkerElement(regionName, stores, map, anchorCoord);
  },

  // 집계 마커 생성 (기존 메서드)
  async createClusterMarker(regionName, stores, map) {
    if (!stores || stores.length === 0) return null;

    // 앵커 좌표 계산 (DB 행정기관 좌표 우선, 읍면동은 ST_PointOnSurface)
    const anchorCoord = await this.calculateAnchorPosition(stores, this.currentLevel);
    if (!anchorCoord) return null;

    return this.createClusterMarkerElement(regionName, stores, map, anchorCoord);
  },

  // 마커 엘리먼트 생성 (공통 로직)
  createClusterMarkerElement(regionName, stores, map, anchorCoord) {

    const position = new kakao.maps.LatLng(anchorCoord.lat, anchorCoord.lng);
    const storeCount = stores.length;
    const openCount = stores.filter(s => s.isOpen !== false).length;

    // 표시용 지역명 계산 (첫 번째 매장 기준)
    const displayName = stores.length > 0 ?
      this.getDisplayRegionName(stores[0], this.currentLevel) || regionName :
      regionName;

    // 고유 ID 생성
    const markerId = `cluster-${Math.random().toString(36).substr(2, 9)}`;

    const content = `
      <div id="${markerId}" class="cluster-marker cluster-marker-hoverable" onclick="window.MapMarkerManager.zoomToRegion('${regionName}', ${anchorCoord.lat}, ${anchorCoord.lng})">
        <div class="cluster-info">
          <div class="region-name">${displayName}</div>
          <div class="cluster-count">${storeCount}</div>
        </div>
      </div>
      <style>
        .cluster-marker {
          background: linear-gradient(135deg, #297efc, #4f46e5);
          color: white;
          border-radius: 6px;
          padding: 2px 5px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(41,126,252,0.3);
          min-width: 32px;
          text-align: center;
          position: relative;
          z-index: 100;
          transition: all 0.2s ease;
        }
        .cluster-marker-hoverable:hover {
          transform: scale(1.2) !important;
          z-index: 9998 !important;
          box-shadow: 0 4px 15px rgba(41,126,252,0.6) !important;
          border-color: rgba(255,255,255,0.4) !important;
        }
        .region-name {
          font-weight: bold;
          font-size: 8px;
          line-height: 1.1;
          margin-bottom: 1px;
        }
        .cluster-count {
          font-size: 7px;
          opacity: 0.9;
          line-height: 1;
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
      // 레벨 11+ - 시/도 단위만 (sido만)
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
      // 레벨 11+ - 시도 집계 마커만, sido만 표시
      return sido;
    }
  },

  // 집계 마커 앵커 위치 계산 (DB 행정기관 좌표 우선, 읍면동은 ST_PointOnSurface)
  async calculateAnchorPosition(stores, level) {
    // 작업 취소 확인
    if (this.shouldCancel) {
      return null;
    }

    // 좌표가 유효한 매장만 필터링
    const validStores = stores.filter(s => {
      return s && s.coord && 
             typeof s.coord.lat === 'number' && 
             typeof s.coord.lng === 'number' &&
             !isNaN(s.coord.lat) && 
             !isNaN(s.coord.lng);
    });

    if (validStores.length === 0) {
      console.warn('⚠️ 유효한 좌표를 가진 매장이 없습니다');
      return null;
    }

    const firstStore = validStores[0];

    if (level >= 11) {
      // 레벨 11+ - 시도 레벨만, DB에서 도청/시청 좌표 조회
      const coord = await this.getAdministrativeOfficeCoord('sido', firstStore.sido);
      if (this.shouldCancel) return null;
      if (coord) {
        console.log(`🏛️ 시도청 앵커: ${firstStore.sido} (${coord.lat}, ${coord.lng})`);
        return coord;
      }
    } else if (level >= 8) {
      // 시군구 레벨 - DB에서 시청/군청/구청 좌표 조회
      if (firstStore.sigungu) {
        const coord = await this.getAdministrativeOfficeCoord('sigungu', firstStore.sigungu);
        if (this.shouldCancel) return null;
        if (coord) {
          console.log(`🏛️ 시군구청 앵커: ${firstStore.sigungu} (${coord.lat}, ${coord.lng})`);
          return coord;
        }
      }
    } else {
      // 읍면동 레벨 - ST_PointOnSurface로 중심점 계산
      if (firstStore.sido && firstStore.sigungu && firstStore.eupmyeondong) {
        const coord = await this.getEupmyeondongCenter(firstStore.sido, firstStore.sigungu, firstStore.eupmyeondong);
        if (this.shouldCancel) return null;
        if (coord) {
          console.log(`📍 읍면동 중심점 앵커: ${firstStore.eupmyeondong} (${coord.lat}, ${coord.lng})`);
          return coord;
        }
      }
    }

    // 모든 방법이 실패하면 센트로이드 사용
    const centroid = this.calculateCentroid(validStores);
    console.log(`📍 센트로이드 앵커(fallback): (${centroid.lat}, ${centroid.lng})`);
    return centroid;
  },

  // 행정기관 좌표 배치 조회 (성능 최적화)
  async batchGetAdministrativeCoords(clusterEntries) {
    const coordRequests = clusterEntries.map(([regionName, regionStores]) => {
      const firstStore = regionStores[0];
      let regionType, targetRegion;
      
      if (this.currentLevel >= 11) {
        regionType = 'sido';
        targetRegion = firstStore.sido;
      } else if (this.currentLevel >= 8) {
        regionType = 'sigungu';
        targetRegion = firstStore.sigungu;
      } else {
        // 읍면동은 배치 조회 안함 (ST_PointOnSurface 필요)
        return null;
      }
      
      return { regionType, regionName: targetRegion };
    });
    
    // null이 아닌 요청들만 필터링
    const validRequests = coordRequests.filter(req => req !== null);
    
    if (validRequests.length === 0) {
      return new Array(clusterEntries.length).fill(null);
    }
    
    try {
      console.log(`🚀 행정기관 좌표 배치 조회: ${validRequests.length}개`);
      
      const response = await fetch('/api/stores/administrative-offices-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: validRequests })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 배치 좌표 조회 완료: ${data.offices.length}개`);
        
        // 결과를 원래 순서에 맞게 매핑
        const results = new Array(clusterEntries.length).fill(null);
        let validIndex = 0;
        
        coordRequests.forEach((req, index) => {
          if (req !== null) {
            const office = data.offices[validIndex];
            if (office) {
              results[index] = {
                lat: office.latitude,
                lng: office.longitude
              };
            }
            validIndex++;
          }
        });
        
        return results;
      }
    } catch (error) {
      console.error('❌ 배치 좌표 조회 실패:', error);
    }
    
    return new Array(clusterEntries.length).fill(null);
  },

  // DB에서 행정기관 좌표 조회 (기존 메서드 유지)
  async getAdministrativeOfficeCoord(regionType, regionName) {
    try {
      const response = await fetch(`/api/stores/administrative-office?regionType=${regionType}&regionName=${encodeURIComponent(regionName)}`);
      const data = await response.json();

      if (data.success && data.office) {
        return {
          lat: data.office.latitude,
          lng: data.office.longitude
        };
      }

      return null;
    } catch (error) {
      console.error('❌ 행정기관 좌표 조회 실패:', error);
      return null;
    }
  },

  // 읍면동 중심점 계산 (ST_PointOnSurface)
  async getEupmyeondongCenter(sido, sigungu, eupmyeondong) {
    try {
      const params = new URLSearchParams({
        sido: sido,
        sigungu: sigungu,
        eupmyeondong: eupmyeondong
      });

      const response = await fetch(`/api/stores/eupmyeondong-center?${params}`);
      const data = await response.json();

      if (data.success && data.center) {
        return {
          lat: data.center.latitude,
          lng: data.center.longitude
        };
      }

      return null;
    } catch (error) {
      console.error('❌ 읍면동 중심점 계산 실패:', error);
      return null;
    }
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

  // 같은 마커 타입에서 추가 마커 생성
  async addMarkersForCurrentType(map, level, markerType) {
    console.log(`➕ ${markerType} 타입 추가 마커 생성 시작 (레벨 ${level})`);

    if (markerType === 'individual') {
      // 개별 매장 마커 추가
      await this.addStoreMarkers(map);
    } else {
      // 집계 마커 추가
      await this.addClusterMarkers(map, level);
    }

    console.log(`✅ ${markerType} 타입 추가 마커 생성 완료`);
  },

  // 개별 매장 마커 추가 (중복 방지)
  async addStoreMarkers(map) {
    console.log('🏪 개별 매장 추가 마커 표시 시작');

    const stores = await this.fetchStores(map);

    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 개별 매장 추가 마커 생성 취소됨 (레벨 변경)');
      return;
    }

    // 기존 마커 위치 추출 (중복 방지용)
    const existingPositions = this.getExistingMarkerPositions();

    // 유효한 좌표를 가진 매장들 필터링 및 중복 제거
    const validStores = stores.filter(store => {
      if (!store.coord?.lat || !store.coord?.lng) return false;
      
      // 기존 마커와 중복되는지 확인 (10m 이내는 중복으로 간주)
      const isDuplicate = existingPositions.some(pos => 
        this.calculateDistance(store.coord.lat, store.coord.lng, pos.lat, pos.lng) < 10
      );
      
      return !isDuplicate;
    });

    console.log(`📍 기존 마커: ${existingPositions.length}개, 새로운 매장: ${validStores.length}개`);

    if (validStores.length === 0) {
      console.log('ℹ️ 추가할 새로운 매장이 없습니다');
      return;
    }

    // 새로운 마커들을 한번에 생성
    const newMarkers = this.createStoreMarkersBatch(validStores, map);
    
    // 작업 취소 최종 확인 후 추가
    if (!this.shouldCancel) {
      this.currentMarkers.push(...newMarkers);
      console.log(`✅ 개별 추가 마커 ${newMarkers.length}개 생성 완료`);
    } else {
      console.log('🚫 개별 매장 추가 마커 생성 취소됨 (마커 생성 후)');
      // 생성된 마커들 정리
      newMarkers.forEach(marker => marker.setMap(null));
    }
  },

  // 집계 마커 추가 (중복 방지)
  async addClusterMarkers(map, level) {
    console.log(`🏘️ 집계 추가 마커 표시 시작 (레벨 ${level})`);

    const stores = await this.fetchStores(map);
    
    // 작업 취소 확인
    if (this.shouldCancel) {
      console.log('🚫 집계 추가 마커 생성 취소됨 (레벨 변경)');
      return;
    }
    
    console.log(`📍 조회된 매장 수: ${stores.length}개`);

    // 지역별 그룹화
    const clusters = this.groupStoresByRegion(stores, level);
    console.log(`🗂️ 그룹화 결과: ${clusters.size}개 지역`);

    // 기존 마커 위치 추출 (중복 방지용)
    const existingPositions = this.getExistingMarkerPositions();

    // 새로운 지역만 필터링 (중복 제거)
    const newClusters = new Map();
    for (const [regionName, regionStores] of clusters.entries()) {
      // 해당 지역의 앵커 위치 계산
      const anchorCoord = await this.calculateAnchorPosition(regionStores, level);
      if (!anchorCoord || this.shouldCancel) continue;

      // 기존 마커와 중복되는지 확인 (100m 이내는 중복으로 간주)
      const isDuplicate = existingPositions.some(pos => 
        this.calculateDistance(anchorCoord.lat, anchorCoord.lng, pos.lat, pos.lng) < 100
      );

      if (!isDuplicate) {
        newClusters.set(regionName, regionStores);
      }
    }

    console.log(`📍 기존 마커: ${existingPositions.length}개, 새로운 지역: ${newClusters.size}개`);

    if (newClusters.size === 0) {
      console.log('ℹ️ 추가할 새로운 지역이 없습니다');
      return;
    }

    // 각 지역별 매장 수 로그
    for (const [regionName, regionStores] of newClusters.entries()) {
      console.log(`   📍 ${regionName}: ${regionStores.length}개 매장`);
    }

    // 새로운 집계 마커들을 한번에 생성
    const newMarkers = await this.createClusterMarkersBatch(newClusters, map);
    
    // 작업 취소 최종 확인 후 추가
    if (!this.shouldCancel) {
      this.currentMarkers.push(...newMarkers);
      console.log(`✅ 집계 추가 마커 ${newMarkers.length}개 생성 완료`);
    } else {
      console.log('🚫 집계 추가 마커 생성 취소됨 (마커 생성 후)');
      // 생성된 마커들 정리
      newMarkers.forEach(marker => marker.setMap(null));
    }
  },

  // 기존 마커들의 위치 추출
  getExistingMarkerPositions() {
    const positions = [];
    
    this.currentMarkers.forEach(marker => {
      try {
        if (marker && marker.getPosition) {
          const pos = marker.getPosition();
          if (pos && pos.getLat && pos.getLng) {
            positions.push({
              lat: pos.getLat(),
              lng: pos.getLng()
            });
          }
        }
      } catch (error) {
        // 위치 추출 실패시 무시
      }
    });

    return positions;
  },

  // 두 지점 간 거리 계산 (미터 단위)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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