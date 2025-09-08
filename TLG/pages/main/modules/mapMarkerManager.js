// 개별 매장 전용 지도 마커 관리자 (집계마커 제거)
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
  requestCache: new Map(),

  // 메인 진입점 - 레벨 변경시 호출 (개별 매장만)
  async handleMapLevelChange(level, map) {
    console.log(`🔄 지도 레벨 ${level} 변경 - 개별 매장 마커 업데이트 시작`);

    // 지도 인스턴스 유효성 검사
    if (!map) {
      console.error('❌ 지도 인스턴스가 유효하지 않음');
      return;
    }

    // 디바운싱 - 빠른 연속 호출 방지
    if (this.lastCallTime && Date.now() - this.lastCallTime < 150) {
      console.log('⚡ 디바운싱: 빠른 연속 호출 무시');
      return;
    }
    this.lastCallTime = Date.now();

    // 이전 작업 취소 (디바운싱 개선)
    if (this.isLoading) {
      console.log('🔄 기존 작업 취소 후 새 작업 시작');
      this.shouldCancel = true;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.handleMapLevelChange(level, map), 150);
      return;
    }

    this.isLoading = true;
    this.shouldCancel = false;
    this.currentLevel = level;

    try {
      const newBounds = map.getBounds();

      // 뷰포트 기반 diff 업데이트
      if (this.shouldUpdateForViewportChange(newBounds)) {
        console.log(`🔄 뷰포트 변경 감지 - diff 업데이트 수행`);
      }

      // 개별 매장 API로 마커 업데이트
      await this.refreshMarkersWithAPI(map, level);
      this.currentBounds = newBounds;

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ 마커 업데이트 실패:', error);
      }
    } finally {
      this.isLoading = false;
    }

    if (!this.shouldCancel) {
      console.log(`✅ 지도 레벨 ${level} 개별 매장 마커 업데이트 완료`);
    }
  },

  // 뷰포트 변경 감지
  shouldUpdateForViewportChange(newBounds) {
    if (!this.currentBounds) return true;

    const oldSW = this.currentBounds.getSouthWest();
    const oldNE = this.currentBounds.getNorthEast();
    const newSW = newBounds.getSouthWest();
    const newNE = newBounds.getNorthEast();

    // 뷰포트가 30% 이상 변경되면 업데이트
    const latDiff = Math.abs(oldNE.getLat() - newNE.getLat()) / Math.abs(oldNE.getLat() - oldSW.getLat());
    const lngDiff = Math.abs(oldNE.getLng() - newNE.getLng()) / Math.abs(oldNE.getLng() - oldSW.getLng());

    return latDiff > 0.3 || lngDiff > 0.3;
  },

  // 개별 매장 전용 API를 사용한 마커 갱신
  async refreshMarkersWithAPI(map, level) {
    console.log(`🌐 개별 매장 API 호출 시작 (레벨: ${level})`);

    const bounds = map.getBounds();
    const bbox = [
      bounds.getSouthWest().getLng(),
      bounds.getSouthWest().getLat(),
      bounds.getNorthEast().getLng(),
      bounds.getNorthEast().getLat()
    ];

    const params = new URLSearchParams({
      level: level.toString(),
      bbox: bbox.join(',')
    });

    const cacheKey = params.toString();
    console.log(`📍 API 요청: /api/clusters/clusters?${cacheKey}`);

    // 캐시 확인 (1분간 유효)
    if (this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        console.log(`⚡ 캐시된 데이터 사용: ${cached.data.features?.length || 0}개`);
        return this.processAPIResponse(cached.data);
      }
    }

    try {
      const response = await fetch(`/api/clusters/clusters?${params}`);
      const data = await response.json();

      // 성공한 응답만 캐시
      if (data.success) {
        this.requestCache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
      }

      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }

      // 작업 취소 확인
      if (this.shouldCancel) {
        console.log('🚫 API 응답 후 작업 취소됨');
        return;
      }

      return this.processAPIResponse(data);

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ 개별 매장 API 호출 실패:', error);
      }
    }
  },

  // API 응답 처리 로직 (개별 매장만)
  async processAPIResponse(data) {
    const features = data.data || data.features || [];
    console.log(`✅ API 응답 처리: ${data.type}, ${features.length}개 피처`);

    // 개별 매장만 처리
    await this.renderIndividualMarkers(features, window.currentMap);

    return features;
  },

  // 개별 매장 마커 렌더링 (diff 적용)
  async renderIndividualMarkers(features, map) {
    console.log(`🏪 개별 매장 마커 ${features.length}개 렌더링 시작`);

    if (!features || features.length === 0) {
      console.log('📍 개별 매장 데이터가 없습니다');
      return;
    }

    const newMarkerKeys = new Set();
    const markersToAdd = [];

    for (const feature of features) {
      try {
        if (feature.kind === 'individual') {
          const markerKey = `store-${feature.store_id}-${feature.lat}-${feature.lng}`;
          newMarkerKeys.add(markerKey);

          // 기존 마커가 없으면 새로 생성
          if (!this.currentMarkers.has(markerKey)) {
            const marker = this.createStoreMarker(feature, map);
            if (marker) {
              markersToAdd.push({ key: markerKey, marker });
            }
          }
        }
      } catch (error) {
        console.error('❌ 개별 마커 생성 실패:', error, feature);
      }
    }

    // 작업 취소 최종 확인
    if (!this.shouldCancel) {
      // 사라진 마커들 제거
      for (const [key, marker] of this.currentMarkers) {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      }

      // 새 마커들 추가
      for (const { key, marker } of markersToAdd) {
        this.currentMarkers.set(key, marker);
      }

      console.log(`✅ 개별 매장 마커 업데이트 완료 - 추가: ${markersToAdd.length}개, 총: ${this.currentMarkers.size}개`);
    }
  },

  // 개별 매장 마커 생성 (서버 데이터 활용)
  createStoreMarker(feature, map) {
    const position = new kakao.maps.LatLng(feature.lat, feature.lng);
    const isOpen = feature.is_open !== false;
    const rating = feature.rating_average || '0.0';
    const categoryIcon = feature.category_icon || '🍽️'; // 서버에서 계산된 아이콘 사용

    const markerId = `store-${feature.store_id || Math.random().toString(36).substr(2, 9)}`;

    const storeData = {
      id: feature.store_id,
      name: feature.name,
      category: feature.category,
      ratingAverage: feature.rating_average,
      reviewCount: feature.review_count,
      isOpen: feature.is_open,
      coord: { lat: feature.lat, lng: feature.lng },
      fullAddress: feature.full_address // 서버에서 조합된 주소 사용
    };

    const content = `
      <div id="${markerId}" class="clean-store-marker ${isOpen ? 'open' : 'closed'}" onclick="(async function(){ try { if(window.renderStore) await window.renderStore(${JSON.stringify(storeData).replace(/"/g, '&quot;')}); else console.error('renderStore not found'); } catch(e) { console.error('renderStore error:', e); } })()">
        <div class="marker-card">
          <div class="marker-icon">
            <span class="icon-emoji">${categoryIcon}</span>
          </div>
          <div class="marker-info">
            <div class="store-name">${feature.name && feature.name.length > 8 ? feature.name.substring(0, 8) + '...' : feature.name || '매장'}</div>
            <div class="store-details">
              <span class="rating">★ ${rating}</span>
              <span class="status ${isOpen ? 'open' : 'closed'}">${isOpen ? '운영중' : '준비중'}</span>
            </div>
          </div>
        </div>
      </div>
      <style>
        .clean-store-marker {
          position: relative;
          cursor: pointer;
          z-index: 200;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clean-store-marker:hover {
          z-index: 9999 !important;
          transform: scale(1.05);
        }

        .marker-card {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
          max-width: 180px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .clean-store-marker:hover .marker-card {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .marker-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: ${isOpen 
            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
          };
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-emoji {
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .marker-info {
          flex: 1;
          min-width: 0;
        }

        .store-name {
          font-weight: 700;
          font-size: 13px;
          color: #1f2937;
          line-height: 1.2;
          margin-bottom: 2px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .store-details {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .rating {
          color: #fbbf24;
          font-weight: 600;
        }

        .status {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 10px;
        }

        .status.open {
          background: rgba(16, 185, 129, 0.1);
          color: #065f46;
        }

        .status.closed {
          background: rgba(239, 68, 68, 0.1);
          color: #7f1d1d;
        }
      </style>
    `;

    const customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: position,
      content: content,
      yAnchor: 1,
      zIndex: 200
    });

    return customOverlay;
  },

  // 모든 마커 제거
  clearAllMarkers() {
    console.log(`🧹 기존 마커 ${this.currentMarkers.size}개 제거`);

    for (const [key, marker] of this.currentMarkers) {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    }

    this.currentMarkers.clear();
  },

  // 완전 초기화 (메모리 관리 강화)
  reset() {
    console.log('🔄 MapMarkerManager 완전 초기화 (개별 매장 전용)');

    this.shouldCancel = true;
    this.clearAllMarkers();

    // 타이머 정리
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 캐시 정리 (메모리 절약)
    this.requestCache.clear();

    this.currentLevel = 0;
    this.isLoading = false;
    this.shouldCancel = false;
    this.currentBounds = null;
    this.lastCallTime = 0;

    console.log('✅ MapMarkerManager 초기화 완료 (개별 매장 전용)');
  }
};