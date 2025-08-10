
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
    
    // 각 지역별 마커 생성 (순차적으로 처리하여 API 제한 방지)
    for (const [regionName, regionStores] of clusters.entries()) {
      console.log(`   📍 ${regionName}: ${regionStores.length}개 매장`);
      const marker = await this.createClusterMarker(regionName, regionStores, map);
      if (marker) {
        this.currentMarkers.push(marker);
      }
      
      // API 호출 간격 조절 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));
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
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid ${isOpen ? '#4caf50' : '#ff9800'};
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          min-width: 120px;
          position: relative;
          z-index: 200;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(10px);
        }
        .store-marker::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${isOpen ? '#4caf50' : '#ff9800'}, ${isOpen ? '#66bb6a' : '#ffb74d'});
          border-radius: 12px 12px 0 0;
        }
        .store-marker-hoverable:hover {
          transform: scale(1.08) translateY(-3px) !important;
          z-index: 9999 !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25) !important;
          border-width: 3px !important;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%) !important;
        }
        .store-name {
          font-weight: 700;
          color: #1a1a1a;
          font-size: 12px;
          margin-bottom: 4px;
          line-height: 1.3;
          text-shadow: 0 0.5px 1px rgba(0,0,0,0.05);
        }
        .store-status {
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .store-status.open { 
          color: #2e7d32; 
          background: rgba(76, 175, 80, 0.1);
        }
        .store-status.closed { 
          color: #ef6c00; 
          background: rgba(255, 152, 0, 0.1);
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

  // 집계 마커 생성
  async createClusterMarker(regionName, stores, map) {
    if (!stores || stores.length === 0) return null;
    
    // 앵커 좌표 계산 (카카오 API 행정기관 우선, 없으면 센트로이드)
    const anchorCoord = await this.calculateAnchorPosition(stores, this.currentLevel);
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
          background: linear-gradient(135deg, #297efc 0%, #4f46e5 50%, #667eea 100%);
          color: white;
          border-radius: 12px;
          padding: 8px 12px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(41,126,252,0.35);
          min-width: 60px;
          text-align: center;
          position: relative;
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-size: 11px;
          border: 2px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
        }
        .cluster-marker::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          z-index: -1;
        }
        .cluster-marker-hoverable:hover {
          transform: scale(1.15) translateY(-2px) !important;
          z-index: 9998 !important;
          box-shadow: 0 8px 30px rgba(41,126,252,0.65) !important;
          border-color: rgba(255,255,255,0.6) !important;
          filter: brightness(1.1);
        }
        .region-name {
          font-weight: 700;
          font-size: 10px;
          line-height: 1.2;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .cluster-count {
          font-size: 8px;
          opacity: 0.95;
          line-height: 1;
          font-weight: 500;
          background: rgba(255,255,255,0.15);
          padding: 1px 4px;
          border-radius: 4px;
          display: inline-block;
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

  // 집계 마커 앵커 위치 계산 (카카오 API 행정기관 위치 우선, 없으면 센트로이드)
  async calculateAnchorPosition(stores, level) {
    const validStores = stores.filter(s => s.coord?.lat && s.coord?.lng);
    if (validStores.length === 0) return null;
    
    // 카카오 API로 행정기관 위치 검색
    const govCoord = await this.findGovernmentOfficeByAPI(validStores, level);
    if (govCoord) {
      console.log(`📍 카카오 API 행정기관 앵커: (${govCoord.lat}, ${govCoord.lng})`);
      return govCoord;
    }
    
    // API로 찾지 못하면 매장명 기반 행정기관 찾기
    const govStore = this.findGovernmentOffice(validStores, level);
    if (govStore) {
      console.log(`📍 매장명 기반 행정기관 앵커: ${govStore.name} (${govStore.coord.lat}, ${govStore.coord.lng})`);
      return govStore.coord;
    }
    
    // 행정기관이 없으면 센트로이드 사용
    const centroid = this.calculateCentroid(validStores);
    console.log(`📍 센트로이드 앵커: (${centroid.lat}, ${centroid.lng})`);
    return centroid;
  },

  // 카카오 API로 행정기관 위치 검색
  async findGovernmentOfficeByAPI(stores, level) {
    try {
      // 센트로이드 계산
      const centroid = this.calculateCentroid(stores);
      
      // 레벨별 검색 키워드 결정
      const searchKeyword = this.getGovernmentSearchKeyword(stores[0], level);
      if (!searchKeyword) return null;
      
      console.log(`🔍 카카오 API 행정기관 검색: "${searchKeyword}" 주변 (${centroid.lat}, ${centroid.lng})`);
      
      // 카카오 장소 검색 API 호출
      const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchKeyword)}&x=${centroid.lng}&y=${centroid.lat}&radius=20000&sort=distance`, {
        headers: {
          'Authorization': 'KakaoAK 8b85ede876c3b97074b5f6fa8e999c55'
        }
      });
      
      if (!response.ok) {
        console.log('❌ 카카오 API 호출 실패:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        const place = data.documents[0];
        console.log(`✅ 행정기관 발견: ${place.place_name} (${place.y}, ${place.x})`);
        
        return {
          lat: parseFloat(place.y),
          lng: parseFloat(place.x)
        };
      }
      
      console.log('🔍 카카오 API에서 행정기관을 찾지 못함');
      return null;
      
    } catch (error) {
      console.error('❌ 카카오 API 행정기관 검색 실패:', error);
      return null;
    }
  },

  // 레벨별 행정기관 검색 키워드 생성
  getGovernmentSearchKeyword(store, level) {
    const { sido, sigungu, eupmyeondong } = store;
    
    if (!sido) return null;
    
    if (level <= 7) {
      // 읍면동 단위 - 읍사무소/면사무소/동사무소
      if (eupmyeondong) {
        if (eupmyeondong.includes('읍')) {
          return `${sido} ${sigungu} ${eupmyeondong} 읍사무소`;
        } else if (eupmyeondong.includes('면')) {
          return `${sido} ${sigungu} ${eupmyeondong} 면사무소`;
        } else {
          return `${sido} ${sigungu} ${eupmyeondong} 동사무소`;
        }
      } else if (sigungu) {
        return `${sido} ${sigungu} 구청`;
      } else {
        return `${sido} 시청`;
      }
    } else if (level <= 10) {
      // 시군구 단위 - 시청/군청/구청
      if (sigungu) {
        if (sigungu.includes('시')) {
          return `${sido} ${sigungu} 시청`;
        } else if (sigungu.includes('군')) {
          return `${sido} ${sigungu} 군청`;
        } else if (sigungu.includes('구')) {
          return `${sido} ${sigungu} 구청`;
        } else {
          return `${sido} ${sigungu}청`;
        }
      } else {
        return `${sido} 시청`;
      }
    } else {
      // 시도 단위 - 시청/도청
      if (sido.includes('도')) {
        return `${sido} 도청`;
      } else {
        return `${sido} 시청`;
      }
    }
  },

  // 매장명 기반 행정기관 찾기 (기존 방식)
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
        
        console.log(`🏛️ 행정기관 발견: ${bestGovStore.name} (키워드: ${keyword})`);
        return bestGovStore;
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
