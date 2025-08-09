// 지도 마커 관리자 (완전 리팩토링)
window.MapMarkerManager = {
  // 전역 마커 저장소
  individualMarkers: new Map(), // 개별 매장 마커 (레벨 1-5)
  clusterMarkers: new Map(),    // 집계 마커 (레벨 6+)
  currentLevel: 0,
  currentStores: [],

  // 마커 생성 프로세스 제어
  isProcessing: false,          
  currentProcessId: null,       
  shouldCancel: false,          
  debounceTimer: null,          

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

    // **하드 스위치: 모든 마커/오버레이 강제 제거**
    this.hardHideAllMarkersAndOverlays(map);

    // 레벨별 마커 처리
    if (level >= 1 && level <= 5) {
      // 개별 매장 마커 표시 (레벨 1-5)
      console.log(`🏪 개별 매장 마커 모드 (레벨 ${level})`);
      await this.showIndividualMarkers(stores, map);
    } else if (level >= 6 && level <= 7) {
      // 읍/면/동 집계 마커 (레벨 6-7)
      console.log(`🏘️ 읍/면/동 집계 마커 모드 (레벨 ${level})`);
      await this.showClusterMarkers(stores, map, 'dong');
    } else if (level >= 8 && level <= 10) {
      // 시/군/구 집계 마커 (레벨 8-10)
      console.log(`🏙️ 시/군/구 집계 마커 모드 (레벨 ${level})`);
      await this.showClusterMarkers(stores, map, 'sigungu');
    } else if (level >= 11) {
      // 시/도 집계 마커 (레벨 11+)
      console.log(`🗺️ 시/도 집계 마커 모드 (레벨 ${level})`);
      await this.showClusterMarkers(stores, map, 'sido');
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

  // 개별 매장 마커 표시 (레벨 1-5)
  async showIndividualMarkers(stores, map) {
    console.log(`🏪 개별 매장 마커 생성: ${stores.length}개`);

    const processId = this.currentProcessId;
    let createdCount = 0;

    // 뷰포트 필터링: 화면 내 매장만 대상
    const bounds = map.getBounds();
    const visibleStores = stores.filter(store => {
      if (!store.coord || !store.coord.lat || !store.coord.lng) return false;

      const lat = Number(store.coord.lat);
      const lng = Number(store.coord.lng);

      if (isNaN(lat) || isNaN(lng)) return false;

      const storeLatLng = new kakao.maps.LatLng(lat, lng);
      return bounds.contain(storeLatLng);
    });

    console.log(`📍 뷰포트 내 매장: ${visibleStores.length}/${stores.length}개`);

    for (let i = 0; i < visibleStores.length; i++) {
      // 프로세스 중단 확인 (매 10개마다)
      if (i % 10 === 0 && (this.shouldCancel || this.currentProcessId !== processId)) {
        console.log(`⏸️ 개별 마커 생성 중단 (${createdCount}/${visibleStores.length}개 완료)`);
        return;
      }

      const store = visibleStores[i];
      const storeKey = this.ensureStoreKey(store);
      const markerId = `store_${storeKey}`;

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

  // 집계 마커 표시 (레벨 6+)
  async showClusterMarkers(stores, map, tier) {
    console.log(`🏘️ ${tier} 집계 마커 생성: ${stores.length}개 매장`);

    const processId = this.currentProcessId;

    // 지역별로 매장 그룹화
    const clusters = this.groupStoresByRegion(stores, tier);
    console.log(`📊 ${tier} 그룹화 결과: ${clusters.size}개 지역`);

    // 각 지역별 매장 수 출력 및 유효성 검증
    const validClusters = new Map();
    for (const [regionKey, regionStores] of clusters.entries()) {
      if (regionStores && regionStores.length > 0) {
        validClusters.set(regionKey, regionStores);
        console.log(`  - ${regionKey}: ${regionStores.length}개 매장`);
      }
    }

    console.log(`✅ 유효한 지역 그룹: ${validClusters.size}개`);

    let createdCount = 0;
    const clusterArray = Array.from(validClusters.entries());

    for (let i = 0; i < clusterArray.length; i++) {
      // 프로세스 중단 확인 (매번)
      if (this.shouldCancel || this.currentProcessId !== processId) {
        console.log(`⏸️ 집계 마커 생성 중단 (${createdCount}/${clusterArray.length}개 완료)`);
        return;
      }

      const [regionKey, regionStores] = clusterArray[i];
      // 집계 마커 키 정규화
      const normalizedRegionKey = String(regionKey).replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
      const clusterId = `${tier}_${normalizedRegionKey}`;

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

  // 지역별 매장 그룹화 (개선된 주소 파싱)
  groupStoresByRegion(stores, tier) {
    const clusters = new Map();
    let skippedCount = 0;

    stores.forEach(store => {
      if (!store.address) {
        skippedCount++;
        return;
      }

      const regionName = this.extractRegionName(store.address, tier);
      if (!regionName) {
        console.log(`⚠️ 주소 파싱 실패로 제외: ${store.address} (매장: ${store.name})`);
        skippedCount++;
        return;
      }

      if (!clusters.has(regionName)) {
        clusters.set(regionName, []);
      }
      clusters.get(regionName).push(store);
    });

    if (skippedCount > 0) {
      console.log(`⚠️ 주소 파싱 실패로 제외된 매장: ${skippedCount}개`);
    }

    return clusters;
  },

  // 주소에서 지역명 추출 (강화된 파싱)
  extractRegionName(address, tier) {
    if (!address || typeof address !== 'string') return null;

    // 대괄호와 괄호 제거 후 주소 파싱
    const cleanAddress = address.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    const parts = cleanAddress.split(' ').filter(part => part.length > 0);

    console.log(`🗺️ 주소 파싱: "${address}" -> [${parts.join(', ')}] (tier: ${tier})`);

    if (tier === 'sido') {
      // 시/도 (첫 번째 부분)
      if (parts.length >= 1) {
        const rawSido = parts[0];
        return this.normalizeSidoName(rawSido);
      }
    } else if (tier === 'sigungu') {
      // 시/군/구 (두 번째 부분까지)
      if (parts.length >= 2) {
        const normalizedSido = this.normalizeSidoName(parts[0]);
        const normalizedSigungu = this.normalizeSigunguName(parts[1]);
        return `${normalizedSido} ${normalizedSigungu}`;
      }
    } else if (tier === 'dong') {
      // 읍/면/동 (세 번째 부분까지)
      if (parts.length >= 3) {
        const normalizedSido = this.normalizeSidoName(parts[0]);
        const normalizedSigungu = this.normalizeSigunguName(parts[1]);
        const normalizedDong = this.normalizeDongName(parts[2]);
        return `${normalizedSido} ${normalizedSigungu} ${normalizedDong}`;
      }
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
      return sigunguName;
    }
    if (sigunguName.endsWith('시')) {
      return sigunguName;
    }
    if (sigunguName.endsWith('군')) {
      return sigunguName;
    }

    return sigunguName;
  },

  // 동/읍/면명 정규화
  normalizeDongName(dongName) {
    if (!dongName) return dongName;

    // 동/읍/면 표기 통일
    if (dongName.endsWith('동') || dongName.endsWith('읍') || dongName.endsWith('면')) {
      return dongName;
    }

    return dongName;
  },

  // 집계 마커 생성
  async createClusterMarker(regionName, stores, map, tier) {
    if (!stores || stores.length === 0) return null;

    // 앵커 좌표 결정 (행정기관 우선, 실패시 센트로이드)
    let centerCoord = null;

    // 모든 레벨에서 행정기관 좌표 우선 시도
    centerCoord = await this.getAdministrativeOfficeCoordinate(regionName, tier);
    if (centerCoord) {
      console.log(`🏛️ ${regionName} 행정기관 좌표 사용: ${centerCoord.lat}, ${centerCoord.lng}`);
    } else {
      console.log(`⚠️ ${regionName} 행정기관 좌표를 찾을 수 없음 - 센트로이드 사용`);
      centerCoord = this.calculateCenterCoordinate(stores);
      if (centerCoord) {
        console.log(`📍 ${regionName} 센트로이드 좌표 사용: ${centerCoord.lat}, ${centerCoord.lng}`);
      }
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
    customOverlay.mapInstance = map;

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
    // 지역명에서 마지막 부분만 추출
    const displayName = this.extractDisplayName(regionName, tier);

    return `
      <div class="cluster-marker" onclick="window.MapMarkerManager.handleClusterClick('${regionName}', '${tier}', this.closest('.cluster-marker').mapInstance)">
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
          min-width: 80px;
          max-width: 150px;
          width: auto;
          height: 32px;
          background: linear-gradient(135deg, #297efc 0%, #4f46e5 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 2px solid white;
          box-shadow: 0 3px 15px rgba(41, 126, 252, 0.3);
          padding: 0 10px;
          position: relative;
          overflow: visible;
        }

        .cluster-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 1px;
          min-width: 0;
        }

        .cluster-name {
          color: white;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          white-space: nowrap;
          overflow: visible;
          text-overflow: none;
          max-width: none;
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

  // 행정기관 좌표 조회
  async getAdministrativeOfficeCoordinate(regionName, tier = 'dong') {
    try {
      if (!regionName || typeof regionName !== 'string') {
        return null;
      }

      const parts = regionName.split(' ').filter(part => part.length > 0);
      let query = '';

      if (tier === 'sido') {
        // 시/도 레벨: 도청, 시청 등
        if (parts.length < 1) return null;

        const sido = parts[0];
        if (sido.includes('특별시') || sido.includes('광역시')) {
          query = `${sido}청`;
        } else if (sido.includes('도')) {
          query = `${sido}청`;
        } else if (sido.includes('특별자치시') || sido.includes('특별자치도')) {
          query = `${sido}청`;
        } else {
          query = `${sido} 청사`;
        }

      } else if (tier === 'sigungu') {
        // 시/군/구 레벨: 시청, 군청, 구청 등
        if (parts.length < 2) return null;

        const sido = parts[0];
        const sigungu = parts[1];

        if (sigungu.includes('구')) {
          query = `${sido} ${sigungu}청`;
        } else if (sigungu.includes('시')) {
          query = `${sigungu}청`;
        } else if (sigungu.includes('군')) {
          query = `${sigungu}청`;
        } else {
          query = `${sido} ${sigungu} 청사`;
        }

      } else {
        // 읍/면/동 레벨: 읍사무소, 면사무소, 동사무소
        if (parts.length < 3) return null;

        const sido = parts[0];
        const sigungu = parts[1];
        const dong = parts[2];

        let officeName = '';
        if (dong.endsWith('읍')) {
          officeName = dong + '사무소';
        } else if (dong.endsWith('면')) {
          officeName = dong + '사무소';
        } else if (dong.endsWith('동')) {
          officeName = dong + '사무소';
        } else {
          // 읍/면/동으로 끝나지 않으면 동사무소로 가정
          officeName = dong + '동사무소';
        }

        query = `${sido} ${sigungu} ${officeName}`;
      }

      console.log(`🔍 ${tier} 행정기관 검색: ${query}`);

      return new Promise((resolve) => {
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          console.warn('⚠️ 카카오맵 서비스가 로드되지 않음');
          resolve(null);
          return;
        }

        const ps = new kakao.maps.services.Places();

        ps.keywordSearch(query, (data, status) => {
          if (status === kakao.maps.services.Status.OK && data.length > 0) {
            // 첫 번째 결과 사용 (가장 관련성 높은 결과)
            const place = data[0];
            const coord = {
              lat: parseFloat(place.y),
              lng: parseFloat(place.x)
            };

            console.log(`✅ ${tier} 행정기관 좌표 발견: ${place.place_name} (${coord.lat}, ${coord.lng})`);
            resolve(coord);
          } else {
            console.log(`❌ ${tier} 행정기관 검색 실패: ${query} (상태: ${status})`);
            resolve(null);
          }
        }, {
          category_group_code: 'PO3', // 공공기관 카테고리
          size: 5 // 검색 결과 최대 5개
        });
      });

    } catch (error) {
      console.error('❌ 행정기관 좌표 조회 중 오류:', error);
      return null;
    }
  },

  // 집계 마커 클릭 처리
  async handleClusterClick(regionName, tier, mapInstance = null) {
    console.log(`📍 ${tier} 집계 마커 클릭: ${regionName}`);

    try {
      // 해당 지역의 좌표를 찾아서 지도 이동
      let centerCoord = await this.getAdministrativeOfficeCoordinate(regionName, tier);

      if (!centerCoord) {
        // 행정기관 좌표를 찾을 수 없으면 해당 지역 매장들의 센트로이드 사용
        const stores = this.currentStores.filter(store => {
          if (!store.address) return false;
          const extractedRegion = this.extractRegionName(store.address, tier);
          return extractedRegion === regionName;
        });

        centerCoord = this.calculateCenterCoordinate(stores);
      }

      if (centerCoord) {
        // 저장된 지도 인스턴스를 우선 사용, 없으면 전역에서 찾기
        let map = mapInstance;

        if (!map) {
          if (window.currentMap) {
            map = window.currentMap;
          } else {
            const mapElement = document.getElementById('map');
            if (mapElement && mapElement._map) {
              map = mapElement._map;
            }
          }
        }

        if (map && map.panTo && map.setLevel) {
          const moveLatLng = new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng);

          // 부드러운 이동 효과
          map.panTo(moveLatLng);

          // 레벨을 4로 설정
          setTimeout(() => {
            map.setLevel(4);
            console.log(`✅ ${regionName} 지역으로 이동 완료 (레벨 4)`);
          }, 300);
        } else {
          console.warn('⚠️ 유효한 지도 인스턴스를 찾을 수 없음');
        }
      } else {
        console.warn(`⚠️ ${regionName} 지역의 좌표를 찾을 수 없음`);
      }

    } catch (error) {
      console.error('❌ 집계 마커 클릭 처리 중 오류:', error);
    }
  },

  // 모든 마커 숨기기
  hideAllMarkers() {
    this.individualMarkers.forEach(marker => {
      marker.setMap(null);
    });

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

  // 하드 스위치: 모든 마커/오버레이 강제 제거
  hardHideAllMarkersAndOverlays(map) {
    console.log('🛡️ 하드 스위치 시작 - 모든 마커/오버레이 강제 제거');

    // 1. MapMarkerManager 내부 마커 완전 제거
    this.individualMarkers.forEach((marker, markerId) => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    this.individualMarkers.clear();

    this.clusterMarkers.forEach((marker, markerId) => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    this.clusterMarkers.clear();

    // 2. renderMap.js 전역 마커 완전 제거
    if (window.markerMap && window.markerMap.size > 0) {
      window.markerMap.forEach((marker, storeId) => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.markerMap.clear();
      console.log('🗑️ 전역 markerMap 강제 클리어');
    }

    if (window.currentMarkers && window.currentMarkers.length > 0) {
      window.currentMarkers.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      window.currentMarkers = [];
      console.log('🗑️ 전역 currentMarkers 강제 클리어');
    }

    console.log('✅ 하드 스위치 완료 - 모든 마커/오버레이 강제 제거');
  },

  // 매장 키 정규화
  ensureStoreKey(store) {
    let key = store.id || store.storeId || store._id;

    if (!key && store.coord && store.coord.lat && store.coord.lng) {
      const lat = Number(store.coord.lat).toFixed(6);
      const lng = Number(store.coord.lng).toFixed(6);
      key = `coord_${lat}_${lng}`;
    }

    if (!key) {
      key = `unknown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn(`⚠️ 매장 키 생성 실패 - 랜덤키 사용: ${key}`, store);
    }

    return String(key);
  },

  // 개별 마커 생성
  async createCustomMarker(store, map, preloadedRating = null) {
    if (!store.coord) return null;

    const lat = Number(store.coord.lat);
    const lng = Number(store.coord.lng);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`⚠️ 유효하지 않은 좌표: ${store.name} (${store.coord.lat}, ${store.coord.lng})`);
      return null;
    }

    const storeKey = this.ensureStoreKey(store);

    const isOpen = store.isOpen !== false;
    const statusText = isOpen ? '운영중' : '운영준비중';
    const statusColor = isOpen ? '#4caf50' : '#ff9800';

    let rating = '0.0';
    if (preloadedRating) {
      rating = parseFloat(preloadedRating.ratingAverage).toFixed(1);
    } else {
      const ratingData = await window.loadStoreRatingAsync(storeKey);
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
      }
    }

    const customOverlayContent = this.getMarkerHTML(store, rating, statusColor, statusText);

    const customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: new kakao.maps.LatLng(lat, lng),
      content: customOverlayContent,
      yAnchor: 0.95,
      xAnchor: 0.5
    });

    customOverlay.storeId = storeKey;
    customOverlay.storeName = store.name;
    customOverlay.isOpen = store.isOpen;
    customOverlay.createdAt = new Date().toISOString();

    return customOverlay;
  },

  // 마커 HTML 생성
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