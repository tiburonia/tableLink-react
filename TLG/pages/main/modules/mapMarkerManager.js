
// 지도 마커 관리자
window.MapMarkerManager = {
  // 전역 마커 저장소
  individualMarkers: new Map(), // 개별 매장 마커
  clusterMarkers: new Map(),    // 집계 마커
  currentLevel: 0,
  currentStores: [],
  
  // 마커 생성 프로세스 제어
  isProcessing: false,          // 현재 마커 생성 중인지
  currentProcessId: null,       // 현재 진행중인 프로세스 ID
  shouldCancel: false,          // 현재 프로세스를 취소해야 하는지
  debounceTimer: null,          // 디바운싱 타이머

  // 레벨에 따른 동적 마커 업데이트 (메인 엔트리 포인트)
  async handleMapLevelChange(level, stores, map) {
    // 디바운싱: 빠른 연속 호출 방지
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      await this._doHandleMapLevelChange(level, stores, map);
    }, 100);
  },

  // 실제 레벨 변경 처리 함수
  async _doHandleMapLevelChange(level, stores, map) {
    console.log(`🔄 레벨 ${level} 변경에 따른 마커 업데이트 시작`);
    
    // 동일한 레벨이면 무시
    if (this.currentLevel === level && this.currentStores.length === stores.length) {
      console.log(`⏸️ 동일한 레벨 ${level} - 마커 업데이트 생략`);
      return;
    }

    // 기존 프로세스가 진행중이면 중단
    if (this.isProcessing) {
      console.log(`⏸️ 기존 마커 생성 프로세스 중단 요청 (이전 레벨: ${this.currentLevel})`);
      this.shouldCancel = true;
      
      // 짧은 대기 후 강제 중단 (비동기 프로세스 완전 정리)
      await this.waitForProcessCompletion(800);
    }
    
    // 새로운 프로세스 시작
    const processId = Date.now() + Math.random();
    this.currentProcessId = processId;
    this.isProcessing = true;
    this.shouldCancel = false;
    
    console.log(`🆕 새 마커 프로세스 시작 (ID: ${processId}, 레벨: ${level})`);
    
    this.currentLevel = level;
    this.currentStores = stores;

    // **모든 마커 완전 제거 (renderMap.js 전역 마커 포함)**
    this.clearAllMarkersCompletely();

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

    // 프로세스가 중단되었는지 확인
    if (this.shouldCancel || this.currentProcessId !== processId) {
      console.log(`❌ 마커 프로세스 중단됨 (ID: ${processId})`);
      this.isProcessing = false;
      return;
    }

    console.log(`✅ 레벨 ${level} 마커 업데이트 완료 (ID: ${processId})`);
    this.isProcessing = false;
    this.currentProcessId = null;
  },

  // 기존 프로세스 완료 대기
  async waitForProcessCompletion(maxWaitMs = 1000) {
    const startTime = Date.now();
    
    while (this.isProcessing && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (this.isProcessing) {
      console.log(`⚠️ 기존 프로세스 강제 중단 (대기 시간 초과)`);
      this.isProcessing = false;
      this.currentProcessId = null;
    }
  },

  // 1. 모드 결정 (개별 vs 집계)
  determineModeByLevel(level) {
    // 레벨 1-5: 개별 매장 마커
    // 레벨 6+: 집계 마커
    return level <= 5 ? 'store' : 'region';
  },

  // 2. 레벨별 지역 단위 결정
  getRegionTierByLevel(level) {
    if (level >= 11) return 'sido';        // 11+ -> 특별시,광역시,도,특별자치시 집계
    if (level >= 8) return 'sigungu';      // 8-10 -> 시,군,구 집계
    return 'dong';                         // 6-7 -> 읍,면,동 집계
  },

  // 개별 매장 마커 표시
  async showIndividualMarkers(stores, map) {
    console.log(`🏪 개별 매장 마커 생성: ${stores.length}개`);

    const processId = this.currentProcessId;
    let createdCount = 0;

    for (let i = 0; i < stores.length; i++) {
      // 프로세스 중단 확인 (매 10개마다)
      if (i % 10 === 0 && (this.shouldCancel || this.currentProcessId !== processId)) {
        console.log(`⏸️ 개별 마커 생성 중단 (${createdCount}/${stores.length}개 완료)`);
        return;
      }

      const store = stores[i];
      if (!store.coord) continue;

      const markerId = `store_${store.id}`;
      
      // 이미 생성된 마커가 있으면 재사용
      if (this.individualMarkers.has(markerId)) {
        const marker = this.individualMarkers.get(markerId);
        if (marker && marker.setMap) {
          marker.setMap(map);
          createdCount++;
        }
        continue;
      }

      // 새 마커 생성
      const marker = await this.createCustomMarker(store, map);
      if (marker) {
        this.individualMarkers.set(markerId, marker);
        createdCount++;
      }

      // CPU 양보 (매 20개마다)
      if (i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // 최종 중단 확인
    if (this.shouldCancel || this.currentProcessId !== processId) {
      console.log(`⏸️ 개별 마커 생성 최종 중단 (${createdCount}/${stores.length}개 완료)`);
      return;
    }

    console.log(`✅ 개별 마커 생성 완료: ${createdCount}개`);
  },

  // 집계 마커 표시
  async showClusterMarkers(stores, map, tier) {
    console.log(`🏘️ ${tier} 집계 마커 생성: ${stores.length}개 매장`);

    const processId = this.currentProcessId;

    // 집계 마커 모드에서는 모든 개별 마커를 강제로 완전 제거
    console.log(`🚫 집계 마커 모드 진입 - 모든 개별 마커 강제 제거 시작`);
    
    // 1. MapMarkerManager 내부 개별 마커 제거
    this.individualMarkers.forEach((marker, markerId) => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    this.individualMarkers.clear();
    
    // 2. 전역 markerMap 완전 제거
    if (window.markerMap && window.markerMap.size > 0) {
      window.markerMap.forEach((marker, storeId) => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      window.markerMap.clear();
    }
    
    // 3. 전역 currentMarkers 배열 완전 제거
    if (window.currentMarkers && window.currentMarkers.length > 0) {
      window.currentMarkers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      window.currentMarkers = [];
    }
    
    console.log(`✅ 모든 개별 마커 강제 제거 완료 - 집계 마커 모드 준비`);

    // 지역별로 매장 그룹화
    const clusters = this.groupStoresByRegion(stores, tier);
    console.log(`📊 ${tier} 그룹화 결과: ${clusters.size}개 지역`);
    
    // 주소가 없는 매장들을 처리 (좌표 기반으로 지역 추정)
    const storesWithoutAddress = stores.filter(store => !store.address);
    if (storesWithoutAddress.length > 0) {
      console.log(`⚠️ 주소 없는 매장 ${storesWithoutAddress.length}개 발견 - 좌표 기반 지역 추정`);
      
      storesWithoutAddress.forEach(store => {
        if (store.coord && store.coord.lat && store.coord.lng) {
          // 좌표 기반으로 대략적인 지역 추정
          let estimatedRegion;
          
          if (tier === 'sido') {
            estimatedRegion = '서울특별시'; // 기본값
          } else if (tier === 'sigungu') {
            estimatedRegion = '서울특별시 중구'; // 기본값
          } else {
            estimatedRegion = '서울특별시 중구 을지로동'; // 기본값
          }
          
          // 기존 그룹에 추가하거나 새 그룹 생성
          if (!clusters.has(estimatedRegion)) {
            clusters.set(estimatedRegion, []);
          }
          clusters.get(estimatedRegion).push(store);
          
          console.log(`📍 매장 ${store.id} (${store.name}) - 추정 지역: ${estimatedRegion}`);
        }
      });
    }
    
    // 각 지역별 매장 수 출력
    for (const [regionKey, regionStores] of clusters.entries()) {
      console.log(`  - ${regionKey}: ${regionStores.length}개 매장`);
    }

    let createdCount = 0;
    const clusterArray = Array.from(clusters.entries());
    
    for (let i = 0; i < clusterArray.length; i++) {
      // 프로세스 중단 확인 (매번)
      if (this.shouldCancel || this.currentProcessId !== processId) {
        console.log(`⏸️ 집계 마커 생성 중단 (${createdCount}/${clusterArray.length}개 완료)`);
        return;
      }

      const [regionKey, regionStores] = clusterArray[i];
      const clusterId = `${tier}_${regionKey}`;
      
      // 이미 생성된 집계 마커가 있으면 재사용
      if (this.clusterMarkers.has(clusterId)) {
        const marker = this.clusterMarkers.get(clusterId);
        if (marker && marker.setMap) {
          marker.setMap(map);
          console.log(`♻️ 기존 집계 마커 재사용: ${regionKey}`);
          createdCount++;
        }
        continue;
      }

      // 중간 중단 체크
      if (this.shouldCancel || this.currentProcessId !== processId) {
        console.log(`⏸️ 집계 마커 생성 중단 (중간 체크): ${regionKey}`);
        return;
      }

      // 새 집계 마커 생성
      console.log(`🆕 새 집계 마커 생성: ${regionKey} (${regionStores.length}개 매장)`);
      const marker = await this.createClusterMarker(regionKey, regionStores, map, tier);
      
      // 생성 후 중단 체크
      if (this.shouldCancel || this.currentProcessId !== processId) {
        console.log(`⏸️ 집계 마커 생성 중단 (생성 후): ${regionKey}`);
        if (marker && marker.setMap) {
          marker.setMap(null); // 생성된 마커 제거
        }
        return;
      }

      if (marker) {
        this.clusterMarkers.set(clusterId, marker);
        marker.setMap(map); // 명시적으로 지도에 표시
        console.log(`✅ 집계 마커 생성 및 표시 성공: ${regionKey}`);
        createdCount++;
      } else {
        console.log(`❌ 집계 마커 생성 실패: ${regionKey}`);
      }

      // CPU 양보 (매 3개마다)
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // CPU 양보 후에도 중단 체크
        if (this.shouldCancel || this.currentProcessId !== processId) {
          console.log(`⏸️ 집계 마커 생성 중단 (CPU 양보 후): ${i}/${clusterArray.length}`);
          return;
        }
      }
    }

    // 최종 중단 확인
    if (this.shouldCancel || this.currentProcessId !== processId) {
      console.log(`⏸️ 집계 마커 생성 최종 중단 (${createdCount}/${clusterArray.length}개 완료)`);
      return;
    }

    console.log(`✅ ${tier} 집계 마커 생성 완료: ${createdCount}개`);
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
      // 시/도 (첫 번째 부분) - 정규화 적용
      const rawSido = parts[0] || null;
      return rawSido ? this.normalizeSidoName(rawSido) : null;
    } else if (tier === 'sigungu') {
      // 시/군/구 (두 번째 부분까지) - 정규화 적용
      if (parts.length >= 2) {
        const normalizedSido = this.normalizeSidoName(parts[0]);
        const normalizedSigungu = this.normalizeSigunguName(parts[1]);
        return `${normalizedSido} ${normalizedSigungu}`;
      }
      return null;
    } else if (tier === 'dong') {
      // 읍/면/동 (세 번째 부분까지) - 정규화 적용
      if (parts.length >= 3) {
        const normalizedSido = this.normalizeSidoName(parts[0]);
        const normalizedSigungu = this.normalizeSigunguName(parts[1]);
        const normalizedDong = this.normalizeDongName(parts[2]);
        return `${normalizedSido} ${normalizedSigungu} ${normalizedDong}`;
      }
      return null;
    }

    return null;
  },

  // 시/도명 정규화
  normalizeSidoName(sidoName) {
    if (!sidoName) return sidoName;
    
    const normalizeMap = {
      '서울': '서울특별시',
      '서울시': '서울특별시',
      '서울특별시': '서울특별시',
      
      '부산': '부산광역시',
      '부산시': '부산광역시',
      '부산광역시': '부산광역시',
      
      '대구': '대구광역시',
      '대구시': '대구광역시',
      '대구광역시': '대구광역시',
      
      '인천': '인천광역시',
      '인천시': '인천광역시',
      '인천광역시': '인천광역시',
      
      '광주': '광주광역시',
      '광주시': '광주광역시',
      '광주광역시': '광주광역시',
      
      '대전': '대전광역시',
      '대전시': '대전광역시',
      '대전광역시': '대전광역시',
      
      '울산': '울산광역시',
      '울산시': '울산광역시',
      '울산광역시': '울산광역시',
      
      '세종': '세종특별자치시',
      '세종시': '세종특별자치시',
      '세종특별자치시': '세종특별자치시',
      
      '경기': '경기도',
      '경기도': '경기도',
      
      '강원': '강원도',
      '강원도': '강원도',
      
      '충북': '충청북도',
      '충청북도': '충청북도',
      
      '충남': '충청남도',
      '충청남도': '충청남도',
      
      '전북': '전라북도',
      '전라북도': '전라북도',
      
      '전남': '전라남도',
      '전라남도': '전라남도',
      
      '경북': '경상북도',
      '경상북도': '경상북도',
      
      '경남': '경상남도',
      '경상남도': '경상남도',
      
      '제주': '제주특별자치도',
      '제주도': '제주특별자치도',
      '제주특별자치도': '제주특별자치도'
    };
    
    return normalizeMap[sidoName] || sidoName;
  },

  // 시/군/구명 정규화
  normalizeSigunguName(sigunguName) {
    if (!sigunguName) return sigunguName;
    
    // 구/시/군 표기 통일
    if (sigunguName.endsWith('구') && !sigunguName.includes('시')) {
      return sigunguName; // 이미 구로 끝나면 그대로
    }
    if (sigunguName.endsWith('시')) {
      return sigunguName; // 이미 시로 끝나면 그대로
    }
    if (sigunguName.endsWith('군')) {
      return sigunguName; // 이미 군으로 끝나면 그대로
    }
    
    return sigunguName;
  },

  // 동/읍/면명 정규화
  normalizeDongName(dongName) {
    if (!dongName) return dongName;
    
    // 동/읍/면 표기 통일
    if (dongName.endsWith('동') || dongName.endsWith('읍') || dongName.endsWith('면')) {
      return dongName; // 이미 동/읍/면으로 끝나면 그대로
    }
    
    return dongName;
  },

  // 집계 마커 생성
  async createClusterMarker(regionName, stores, map, tier) {
    if (!stores || stores.length === 0) return null;

    // 중심 좌표 계산 (매장들의 평균 위치)
    let centerCoord = this.calculateCenterCoordinate(stores);
    
    // 주소 없는 매장 그룹인 경우 기본 서울 중심 좌표 사용
    if (!centerCoord && regionName === '위치 미확인') {
      centerCoord = { lat: 37.5665, lng: 126.9780 }; // 서울 중심
      console.log(`📍 위치 미확인 매장 그룹 - 기본 좌표 사용: ${centerCoord.lat}, ${centerCoord.lng}`);
    }
    
    if (!centerCoord) {
      console.log(`❌ ${regionName} 집계 마커 - 유효한 좌표를 찾을 수 없음`);
      return null;
    }

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
    // 지역명에서 마지막 부분만 추출 (예: "서울특별시 중구 을지로동" -> "을지로동")
    const displayName = this.extractDisplayName(regionName, tier);

    return `
      <div class="cluster-marker" onclick="window.MapMarkerManager.handleClusterClick('${regionName}', '${tier}')">
        <div class="cluster-container">
          <div class="cluster-rectangle">
            <div class="cluster-left">
              <div class="cluster-name">${displayName}</div>
              <div class="cluster-info">운영중 ${openCount}개</div>
            </div>
            <div class="cluster-right">
              <div class="cluster-count">${totalCount}</div>
            </div>
          </div>
          <div class="cluster-point"></div>
        </div>
      </div>

      <style>
        .cluster-marker {
          position: relative;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
        }

        .cluster-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cluster-rectangle {
          width: 70px;
          height: 30px;
          background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 2px solid white;
          box-shadow: 0 3px 15px rgba(41, 126, 252, 0.3);
          padding: 0 8px;
          position: relative;
          overflow: hidden;
        }

        .cluster-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 1px;
        }

        .cluster-name {
          color: white;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 40px;
        }

        .cluster-info {
          color: rgba(255, 255, 255, 0.9);
          font-size: 8px;
          font-weight: 500;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .cluster-right {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          width: 18px;
          height: 18px;
        }

        .cluster-count {
          color: white;
          font-size: 10px;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }

        .cluster-point {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid white;
          margin-top: -2px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .cluster-marker:hover {
          transform: translateY(-2px) scale(1.05);
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.25));
        }

        .cluster-marker:hover .cluster-rectangle {
          box-shadow: 0 6px 25px rgba(41, 126, 252, 0.4);
        }

        .cluster-marker:active {
          transform: translateY(0) scale(1.02);
        }

        .cluster-marker:active .cluster-rectangle {
          transform: scale(0.95);
        }
      </style>
    `;
  },

  // 지역명에서 표시할 이름 추출
  extractDisplayName(regionName, tier) {
    if (!regionName) return '지역';
    
    const parts = regionName.split(' ').filter(part => part.length > 0);
    
    if (tier === 'sido') {
      // 시/도 레벨: 전체 이름 (예: "서울특별시")
      return parts[0] || regionName;
    } else if (tier === 'sigungu') {
      // 시/군/구 레벨: 마지막 부분 (예: "중구")
      return parts.length >= 2 ? parts[1] : regionName;
    } else if (tier === 'dong') {
      // 동/읍/면 레벨: 마지막 부분 (예: "을지로동")
      return parts.length >= 3 ? parts[2] : regionName;
    }
    
    return regionName;
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

  // 모든 마커 완전 삭제 (renderMap.js 전역 마커 포함)
  clearAllMarkersCompletely() {
    console.log('🧹 모든 마커 완전 삭제 시작 (전역 마커 포함)');
    
    // 1. MapMarkerManager 내부 마커 삭제
    this.hideAllMarkers();
    this.individualMarkers.clear();
    this.clusterMarkers.clear();
    
    // 2. renderMap.js 전역 마커 삭제
    if (window.markerMap && window.markerMap.size > 0) {
      window.markerMap.forEach((marker, storeId) => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.markerMap.clear();
      console.log('🗑️ 전역 markerMap 클리어 완료');
    }

    if (window.currentMarkers && window.currentMarkers.length > 0) {
      window.currentMarkers.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.currentMarkers = [];
      console.log('🗑️ 전역 currentMarkers 배열 클리어 완료');
    }

    console.log('✅ 모든 마커 완전 삭제 완료 (전역 마커 포함)');
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
