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
          font-size: 9px;
          border: 1px solid rgba(255,255,255,0.2);
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

  // 행정기관 찾기 (키워드 기반)
  findGovernmentOffice(stores, level) {
    // 행정기관 키워드 (우선순위별로 정렬)
    const govKeywords = [
      // 주요 행정기관
      '시청', '구청', '군청', '도청', '청사',
      // 하위 행정기관
      '읍사무소', '면사무소', '동사무소', '행정복지센터', '주민센터',
      // 공공기관
      '시청사', '구청사', '군청사', '도청사', '행정타운', '시민회관',
      // 추가 키워드
      '청', '사무소', '센터'
    ];

    // 우선순위별로 행정기관 찾기
    for (const keyword of govKeywords) {
      const govStores = stores.filter(store =>
        store.name && store.name.includes(keyword)
      );

      if (govStores.length > 0) {
        // 여러 개가 있으면 가장 짧은 이름의 매장 선택 (일반적으로 더 공식적)
        const bestGovStore = govStores.reduce((best, current) =>
          current.name.length < best.name.length ? current : best
        );

        console.log(`🏛️ 행정기관 발견 (키워드): ${bestGovStore.name} (키워드: ${keyword})`);
        return bestGovStore;
      }
    }

    // 키워드 기반 검색 실패 시, API 기반으로 다시 시도
    return this.findGovernmentOfficeByAPI(stores, level);
  },

  // 카카오 API로 행정기관 위치 검색 (백엔드 프록시 사용)
  async findGovernmentOfficeByAPI(stores, level) {
    try {
      // 센트로이드 계산
      const centroid = this.calculateCentroid(stores);
      const searchKeyword = this.getGovernmentSearchKeyword(stores[0], level);
      if (!searchKeyword) return null;

      console.log(`🔍 백엔드 프록시를 통한 행정기관 검색: "${searchKeyword}" 주변 (${centroid.lat}, ${centroid.lng})`);

      // 백엔드 프록시를 통해 카카오 API 호출
      const response = await fetch(`/api/stores/search-place?query=${encodeURIComponent(searchKeyword)}&x=${centroid.lng}&y=${centroid.lat}&radius=50000`);

      if (!response.ok) {
        console.log('❌ 백엔드 프록시 호출 실패:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.success && data.places && data.places.length > 0) {
        // 가장 정확한 행정기관 찾기
        const validPlace = this.selectBestGovernmentOffice(data.places, searchKeyword);
        if (validPlace) {
          console.log(`✅ 행정기관 발견: ${validPlace.place_name} (${validPlace.y}, ${validPlace.x})`);

          return {
            lat: parseFloat(validPlace.y),
            lng: parseFloat(validPlace.x),
            name: validPlace.place_name
          };
        }
      }

      console.log('🔍 백엔드에서 적절한 행정기관을 찾지 못함');
      return null;

    } catch (error) {
      console.error('❌ 백엔드 프록시 행정기관 검색 실패:', error);
      return null;
    }
  },

  // 검색 결과에서 가장 적절한 행정기관 선택
  selectBestGovernmentOffice(places, searchKeyword) {
    // 우선순위: 정확한 키워드 매치 > 공공기관 카테고리 > 이름 길이
    const govKeywords = ['청', '시청', '군청', '구청', '도청', '사무소', '행정복지센터'];

    for (const place of places) {
      const name = place.place_name || '';
      const category = place.category_name || '';

      // 정확한 행정기관 키워드 포함 확인
      const hasGovKeyword = govKeywords.some(keyword => name.includes(keyword));

      // 공공기관 카테고리 확인
      const isPublicOffice = category.includes('공공기관') || category.includes('행정기관');

      if (hasGovKeyword || isPublicOffice) {
        return place;
      }
    }

    // 적절한 행정기관이 없으면 첫 번째 결과 반환
    return places[0];
  },

  // 행정기관 검색 키워드 생성
  getGovernmentSearchKeyword(store, level) {
    if (!store || !store.sido) return null;

    if (level >= 11) {
      // 시도 레벨 - 도청/시청
      if (store.sido.includes('도')) {
        return `${store.sido} 도청`;
      } else if (store.sido.includes('시')) {
        return `${store.sido} 시청`;
      } else {
        return `${store.sido} 청`;
      }
    } else if (level >= 8) {
      // 시군구 레벨 - 시청/군청/구청
      if (!store.sigungu) return null;

      if (store.sigungu.includes('시')) {
        return `${store.sigungu} 시청`;
      } else if (store.sigungu.includes('군')) {
        return `${store.sigungu} 군청`;
      } else if (store.sigungu.includes('구')) {
        return `${store.sigungu} 구청`;
      } else {
        return `${store.sigungu} 청사`;
      }
    } else {
      // 읍면동 레벨 - 읍사무소/면사무소/동사무소
      if (!store.eupmyeondong) return null;

      if (store.eupmyeondong.includes('읍')) {
        return `${store.eupmyeondong} 읍사무소`;
      } else if (store.eupmyeondong.includes('면')) {
        return `${store.eupmyeondong} 면사무소`;
      } else if (store.eupmyeondong.includes('동')) {
        return `${store.eupmyeondong} 동사무소`;
      } else {
        return `${store.eupmyeondong} 행정복지센터`;
      }
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