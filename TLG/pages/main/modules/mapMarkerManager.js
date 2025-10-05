// 지도 마커 관리자 - View Layer (레이어드 아키텍처 적용)
// Controller와 Service를 통한 데이터 처리, 통일된 storeData 객체 사용

window.MapMarkerManager = {
  // 현재 표시된 마커들 (위치별 인덱싱)
  currentMarkers: new Map(),

  // 현재 지도 레벨
  currentLevel: 0,

  // 처리 중 플래그
  isLoading: false,

  // 현재 작업 취소 플래그
  shouldCancel: false,

  // 현재 뷰포트 영역
  currentBounds: null,

  // 성능 최적화 관련
  lastCallTime: 0,
  debounceTimer: null,

  /**
   * 메인 진입점 - 레벨 변경시 호출 (Controller 연동)
   */
  async handleMapLevelChange(map) {
    const currentLevel = map.getZoom();
    console.log(`🔄 [MapMarkerManager] 지도 줌 레벨 ${currentLevel} 변경 - 마커 업데이트 시작`);

    // 지도 인스턴스 유효성 검사
    if (!map) {
      console.error('❌ [MapMarkerManager] 지도 인스턴스가 유효하지 않음');
      return;
    }

    // Controller 의존성 확인
    if (!window.mapController) {
      console.error('❌ [MapMarkerManager] mapController 의존성 없음');
      return;
    }

    // 디바운싱 - 빠른 연속 호출 방지
    if (this.lastCallTime && Date.now() - this.lastCallTime < 150) {
      console.log('⚡ [MapMarkerManager] 디바운싱: 빠른 연속 호출 무시');
      return;
    }
    this.lastCallTime = Date.now();

    // 이전 작업 취소 (디바운싱 개선)
    if (this.isLoading) {
      console.log('🔄 [MapMarkerManager] 기존 작업 취소 후 새 작업 시작');
      this.shouldCancel = true;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.handleMapLevelChange(map), 150);
      return;
    }

    this.isLoading = true;
    this.shouldCancel = false;
    this.currentLevel = currentLevel;

    try {
      const newBounds = this.getViewportBounds(map);

      // 뷰포트 기반 diff 업데이트
      if (this.shouldUpdateForViewportChange(newBounds)) {
        console.log(`🔄 [MapMarkerManager] 뷰포트 변경 감지 - diff 업데이트 수행`);
      }

      // Service Layer를 통한 매장 데이터 조회 및 마커 업데이트
      await this.refreshMarkersWithService(map, currentLevel);
      this.currentBounds = newBounds;

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ [MapMarkerManager] 마커 업데이트 실패:', error);
      }
    } finally {
      this.isLoading = false;
    }

    if (!this.shouldCancel) {
      console.log(`✅ [MapMarkerManager] 지도 레벨 ${currentLevel} 마커 업데이트 완료`);
    }
  },

  /**
   * 뷰포트 변경 감지
   */
  shouldUpdateForViewportChange(newBounds) {
    if (!this.currentBounds) return true;

    // 뷰포트가 30% 이상 변경되면 업데이트
    const latDiff = Math.abs(this.currentBounds.maxLat - newBounds.maxLat) / Math.abs(this.currentBounds.maxLat - this.currentBounds.minLat);
    const lngDiff = Math.abs(this.currentBounds.maxLng - newBounds.maxLng) / Math.abs(this.currentBounds.maxLng - this.currentBounds.minLng);

    return latDiff > 0.3 || lngDiff > 0.3;
  },

  /**
   * Service Layer를 통한 마커 갱신 (레이어드 아키텍처)
   */
  async refreshMarkersWithService(map, level) {
    console.log(`🌐 [MapMarkerManager] Service Layer를 통한 매장 데이터 조회 시작 (레벨: ${level})`);

    try {
      // Service Layer 의존성 확인
      if (!window.mapService) {
        throw new Error('mapService 의존성이 없습니다');
      }

      console.log(`📍 [MapMarkerManager] mapService.getViewportStores 호출`);

      // Service Layer를 통한 표준화된 storeData 조회
      const stores = await window.mapService.getViewportStores(map);

      // 작업 취소 확인
      if (this.shouldCancel) {
        console.log('🚫 [MapMarkerManager] Service 응답 후 작업 취소됨');
        return;
      }

      console.log(`✅ [MapMarkerManager] Service에서 ${stores.length}개 표준화된 매장 데이터 수신`);

      // 표준화된 storeData로 마커 렌더링
      return this.renderStandardizedStoreMarkers(stores, map);

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ [MapMarkerManager] Service Layer를 통한 매장 데이터 조회 실패:', error);
      }
    }
  },

  /**
   * 표준화된 storeData 객체를 사용한 마커 렌더링 (diff 적용)
   */
  async renderStandardizedStoreMarkers(stores, map) {
    console.log(`🏪 [MapMarkerManager] 표준화된 매장 마커 ${stores.length}개 렌더링 시작`);

    if (!stores || stores.length === 0) {
      console.log('📍 [MapMarkerManager] 매장 데이터가 없습니다');
      this.clearAllMarkers();
      return;
    }

    const newMarkerKeys = new Set();
    const markersToAdd = [];

    for (const storeData of stores) {
      try {
        // 표준화된 storeData 유효성 검증
        if (!this.validateStoreData(storeData)) {
          console.warn('⚠️ [MapMarkerManager] 유효하지 않은 storeData:', storeData);
          continue;
        }

        const markerKey = `store-${storeData.id}-${storeData.coord.lat}-${storeData.coord.lng}`;
        newMarkerKeys.add(markerKey);

        // 기존 마커가 없으면 새로 생성
        if (!this.currentMarkers.has(markerKey)) {
          const marker = this.createStandardizedStoreMarker(storeData, map);
          if (marker) {
            markersToAdd.push({ key: markerKey, marker });
          }
        }
      } catch (error) {
        console.error('❌ [MapMarkerManager] 표준화된 마커 생성 실패:', error, storeData);
      }
    }

    // 작업 취소 최종 확인
    if (!this.shouldCancel) {
      // 사라진 마커들 제거
      for (const [key, marker] of this.currentMarkers) {
        if (!newMarkerKeys.has(key)) {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
          this.currentMarkers.delete(key);
        }
      }

      // 새 마커들 추가
      for (const { key, marker } of markersToAdd) {
        this.currentMarkers.set(key, marker);
      }

      console.log(`✅ [MapMarkerManager] 표준화된 매장 마커 업데이트 완료 - 추가: ${markersToAdd.length}개, 총: ${this.currentMarkers.size}개`);
    }
  },

  /**
   * 표준화된 storeData 객체를 사용한 마커 생성
   */
  createStandardizedStoreMarker(storeData, map) {
    const position = new naver.maps.LatLng(storeData.coord.lat, storeData.coord.lng);
    const isOpen = storeData.isOpen;
    const rating = storeData.ratingAverage ? storeData.ratingAverage.toFixed(1) : '0.0';
    const categoryIcon = this.getCategoryIcon(storeData.category);

    const markerId = `store-${storeData.id}`;

   

    const content = `
      <div id="${markerId}" class="native-store-marker ${isOpen ? 'open' : 'closed'}" onclick="(async function(){ try { if(window.renderStore) await window.renderStore(${JSON.stringify(storeData).replace(/"/g, '&quot;')}); else console.error('renderStore not found'); } catch(e) { console.error('renderStore error:', e); } })()">
        <div class="marker-card">
          <div class="marker-icon-wrapper">
            <div class="marker-icon">
              <span class="icon-emoji">${categoryIcon}</span>
            </div>
          </div>
          <div class="marker-content">
            <div class="store-name">${storeData.name && storeData.name.length > 9 ? storeData.name.substring(0, 9) + '...' : storeData.name}</div>
            <div class="store-meta">
              <span class="rating-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                ${rating}
              </span>
              <span class="status-badge ${isOpen ? 'open' : 'closed'}">
                ${isOpen ? '영업중' : '준비중'}
              </span>
            </div>
          </div>
        </div>
        <div class="marker-pointer"></div>
      </div>
      <style>
        .native-store-marker {
          position: relative;
          cursor: pointer;
          z-index: 200;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12));
        }

        .native-store-marker:hover {
          z-index: 9999 !important;
          transform: translateY(-4px) scale(1.06);
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.18));
        }

        .native-store-marker:active {
          transform: translateY(-2px) scale(1.02);
          transition: all 0.1s ease;
        }

        .marker-card {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 16px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 150px;
          max-width: 200px;
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
        }

        .marker-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%);
          pointer-events: none;
        }

        .native-store-marker:hover .marker-card {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .marker-icon-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .marker-icon-wrapper::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: ${isOpen
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.15) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.15) 100%)'
          };
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .native-store-marker:hover .marker-icon-wrapper::before {
          opacity: 1;
        }

        .marker-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: ${isOpen
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
          };
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 2px 8px ${isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
          transition: all 0.3s ease;
        }

        .native-store-marker:hover .marker-icon {
          transform: scale(1.08) rotate(-5deg);
          box-shadow: 0 4px 16px ${isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
        }

        .icon-emoji {
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
          transition: transform 0.3s ease;
        }

        .native-store-marker:hover .icon-emoji {
          transform: scale(1.1);
        }

        .marker-content {
          flex: 1;
          min-width: 0;
        }

        .store-name {
          font-weight: 700;
          font-size: 14px;
          color: #1f2937;
          line-height: 1.3;
          margin-bottom: 4px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          letter-spacing: -0.2px;
        }

        .store-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rating-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px 7px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          line-height: 1;
        }

        .rating-badge svg {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 3px 7px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 10px;
          line-height: 1;
          letter-spacing: -0.2px;
        }

        .status-badge.open {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.15) 100%);
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-badge.closed {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(248, 113, 113, 0.15) 100%);
          color: #7f1d1d;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .marker-pointer {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255, 255, 255, 0.98);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .native-store-marker:hover .marker-pointer {
          border-top-color: rgba(255, 255, 255, 1);
        }

        @keyframes markerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        .native-store-marker.open .marker-icon-wrapper::after {
          content: '';
          position: absolute;
          inset: -6px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: markerPulse 2s ease-in-out infinite;
          z-index: -1;
        }
      </style>
    `;

    // 네이버맵 마커 생성 (커스텀 HTML 사용)
    const marker = new naver.maps.Marker({
      map: map,
      position: position,
      icon: {
        content: content,
        anchor: new naver.maps.Point(90, 60)
      },
      zIndex: 200
    });

    return marker;
  },

  /**
   * 카테고리별 아이콘 반환
   */
  getCategoryIcon(category) {
    const categoryIcons = {
      '한식': '🍚',
      '중식': '🥢',
      '일식': '🍱',
      '양식': '🍝',
      '카페': '☕',
      '디저트': '🧁',
      '치킨': '🍗',
      '피자': '🍕',
      '햄버거': '🍔',
      '분식': '🍜',
      '술집': '🍺',
      '바': '🍸',
      '패스트푸드': '🍟',
      '기타': '🍽️'
    };

    return categoryIcons[category] || '🍽️';
  },

  /**
   * 표준화된 storeData 유효성 검증 (Service Layer 연동)
   */
  validateStoreData(storeData) {
    if (!storeData) {
      console.warn('⚠️ [MapMarkerManager] storeData가 null/undefined');
      return false;
    }

    // Service Layer의 검증 함수 사용
    if (window.mapService && typeof window.mapService.validateStoreData === 'function') {
      return window.mapService.validateStoreData(storeData);
    }

    // 기본 검증 (Service 없을 때 폴백)
    const required = ['id', 'name', 'coord'];
    const isValid = required.every(field => {
      if (field === 'coord') {
        return storeData.coord &&
               typeof storeData.coord.lat === 'number' &&
               typeof storeData.coord.lng === 'number';
      }
      return storeData.hasOwnProperty(field) && storeData[field];
    });

    if (!isValid) {
      console.warn('⚠️ [MapMarkerManager] 필수 필드 누락:', storeData);
    }

    return isValid;
  },

  /**
   * 모든 마커 제거
   */
  clearAllMarkers() {
    console.log(`🧹 [MapMarkerManager] 기존 마커 ${this.currentMarkers.size}개 제거`);

    for (const [key, marker] of this.currentMarkers) {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    }

    this.currentMarkers.clear();
  },

  /**
   * 완전 초기화 (레이어드 아키텍처 대응)
   */
  reset() {
    console.log('🔄 [MapMarkerManager] 완전 초기화 (레이어드 아키텍처 대응)');

    this.shouldCancel = true;
    this.clearAllMarkers();

    // 타이머 정리
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.currentLevel = 0;
    this.isLoading = false;
    this.shouldCancel = false;
    this.currentBounds = null;
    this.lastCallTime = 0;

    console.log('✅ [MapMarkerManager] 초기화 완료 (레이어드 아키텍처 대응)');
  },

  /**
   * 의존성 상태 확인 (디버깅용)
   */
  checkDependencies() {
    const dependencies = {
      mapController: !!window.mapController,
      mapService: !!window.mapService,
      renderStore: !!window.renderStore
    };

    console.log('🔍 [MapMarkerManager] 의존성 상태:', dependencies);
    return dependencies;
  },

  /**
   * 뷰포트 좌표 가져오기 메서드 (네이버 지도 API 호환)
   */
  getViewportBounds(map) {
    const bounds = map.getBounds();
    const sw = bounds.getSW ? bounds.getSW() : bounds._sw; // 네이버 지도 API
    const ne = bounds.getNE ? bounds.getNE() : bounds._ne;

    return {
      minLng: sw.lng || sw.x,
      minLat: sw.lat || sw.y,
      maxLng: ne.lng || ne.x,
      maxLat: ne.lat || ne.y
    };
  }
};