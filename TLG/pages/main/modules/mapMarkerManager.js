// 새로운 PostGIS 기반 지도 마커 관리자
window.MapMarkerManager = {
  // 현재 표시된 마커들
  currentMarkers: [],

  // 현재 지도 레벨
  currentLevel: 0,

  // 현재 마커 타입
  currentMarkerType: null,

  // 처리 중 플래그
  isLoading: false,

  // 현재 작업 취소 플래그
  shouldCancel: false,

  // 메인 진입점 - 레벨 변경시 호출
  async handleMapLevelChange(level, map) {
    console.log(`🔄 지도 레벨 ${level} 변경 - 통합 API 마커 업데이트 시작`);

    // 지도 인스턴스 유효성 검사
    if (!map) {
      console.error('❌ 지도 인스턴스가 유효하지 않음');
      return;
    }

    // 이전 작업 취소
    if (this.isLoading) {
      console.log('🔄 기존 작업 취소 후 새 작업 시작');
      this.shouldCancel = true;
      setTimeout(() => this.handleMapLevelChange(level, map), 100);
      return;
    }

    this.isLoading = true;
    this.shouldCancel = false;
    this.currentLevel = level;

    try {
      // 새 마커 타입 결정
      const newMarkerType = this.getMarkerType(level);

      // 마커 타입이 바뀌면 기존 마커 제거
      if (this.currentMarkerType !== newMarkerType) {
        console.log(`🔄 마커 타입 변경 (${this.currentMarkerType} → ${newMarkerType}) - 기존 마커 제거`);
        this.clearAllMarkers();
        this.currentMarkerType = newMarkerType;
      }

      // 통합 API로 마커 업데이트
      await this.refreshMarkersWithAPI(map, level);

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

  // 마커 타입 결정 (레벨별)
  getMarkerType(level) {
    if (level <= 5) return 'individual';      // 개별 매장
    return 'cluster';                         // 클러스터
  },

  // 통합 API를 사용한 마커 갱신
  async refreshMarkersWithAPI(map, level) {
    console.log(`🌐 통합 클러스터 API 호출 시작 (레벨: ${level})`);

    // 현재 뷰포트 가져오기
    const bounds = map.getBounds();
    const bbox = [
      bounds.getSouthWest().getLng(), // xmin
      bounds.getSouthWest().getLat(), // ymin
      bounds.getNorthEast().getLng(), // xmax
      bounds.getNorthEast().getLat()  // ymax
    ];

    const params = new URLSearchParams({
      level: level.toString(),
      bbox: bbox.join(',')
    });

    console.log(`📍 API 요청: /api/stores/clusters?${params.toString()}`);

    try {
      const response = await fetch(`/api/stores/clusters?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }

      // 작업 취소 확인
      if (this.shouldCancel) {
        console.log('🚫 API 응답 후 작업 취소됨');
        return;
      }

      console.log(`✅ API 응답: ${data.type}, ${data.count}개 피처`);

      // 기존 마커 제거 (같은 타입이라도 새로 생성)
      this.clearAllMarkers();

      // 응답 타입별 마커 생성
      if (data.type === 'individual') {
        await this.renderIndividualMarkers(data.features, map);
      } else if (data.type === 'cluster') {
        await this.renderClusterMarkers(data.features, map);
      }

    } catch (error) {
      if (!this.shouldCancel) {
        console.error('❌ 통합 API 호출 실패:', error);
      }
    }
  },

  // 개별 매장 마커 렌더링
  async renderIndividualMarkers(features, map) {
    console.log(`🏪 개별 매장 마커 ${features.length}개 렌더링 시작`);

    const markers = features.map(feature => this.createStoreMarker(feature, map));

    // 작업 취소 최종 확인
    if (!this.shouldCancel) {
      this.currentMarkers.push(...markers);
      console.log(`✅ 개별 매장 마커 ${markers.length}개 렌더링 완료`);
    } else {
      console.log('🚫 개별 매장 마커 렌더링 취소됨');
      markers.forEach(marker => marker.setMap(null));
    }
  },

  // 클러스터 마커 렌더링
  async renderClusterMarkers(features, map) {
    console.log(`🏘️ 클러스터 마커 ${features.length}개 렌더링 시작`);

    const markers = features.map(feature => this.createClusterMarker(feature, map));

    // 작업 취소 최종 확인
    if (!this.shouldCancel) {
      this.currentMarkers.push(...markers);
      console.log(`✅ 클러스터 마커 ${markers.length}개 렌더링 완료`);
    } else {
      console.log('🚫 클러스터 마커 렌더링 취소됨');
      markers.forEach(marker => marker.setMap(null));
    }
  },

  // 개별 매장 마커 생성 (통합 API 데이터 기반)
  createStoreMarker(feature, map) {
    // 통합 API는 GeoJSON-like 구조: feature.geometry.coordinates = [lng, lat]
    const coords = feature.geometry?.coordinates || [feature.lon || feature.lng, feature.lat];
    const position = new kakao.maps.LatLng(coords[1], coords[0]); // [lng, lat] -> (lat, lng)
    
    const props = feature.properties || feature; // properties 안에 실제 데이터
    const isOpen = props.is_open !== false;
    const rating = props.rating_average ? parseFloat(props.rating_average).toFixed(1) : '0.0';
    const categoryIcon = this.getCategoryIcon(props.category);

    const markerId = `store-${props.id || props.store_id || Math.random().toString(36).substr(2, 9)}`;

    const storeData = {
      id: props.id || props.store_id,
      name: props.name,
      category: props.category,
      ratingAverage: props.rating_average,
      reviewCount: props.review_count,
      isOpen: props.is_open,
      coord: { lat: coords[1], lng: coords[0] }
    };

    const content = `
      <div id="${markerId}" class="clean-store-marker ${isOpen ? 'open' : 'closed'}" onclick="(async function(){ try { if(window.renderStore) await window.renderStore(${JSON.stringify(storeData).replace(/"/g, '&quot;')}); else console.error('renderStore not found'); } catch(e) { console.error('renderStore error:', e); } })()">
        <div class="marker-card">
          <div class="marker-icon">
            <span class="icon-emoji">${categoryIcon}</span>
          </div>
          <div class="marker-info">
            <div class="store-name">${props.name && props.name.length > 8 ? props.name.substring(0, 8) + '...' : props.name || '매장'}</div>
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
          border-color: rgba(41, 126, 252, 0.3);
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
          color: #991b1b;
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

  // 클러스터 마커 생성 (통합 API 데이터 기반)
  createClusterMarker(feature, map) {
    // 통합 API 클러스터 구조: feature.geometry.coordinates = [lng, lat]
    const coords = feature.geometry?.coordinates || [feature.lon || feature.lng, feature.lat];
    const position = new kakao.maps.LatLng(coords[1], coords[0]); // [lng, lat] -> (lat, lng)
    
    const props = feature.properties || feature; // properties 안에 집계 데이터
    const totalCount = props.count || props.total_count || props.cluster_count || 0;
    const openCount = props.open_count || Math.floor(totalCount * 0.8); // 기본값: 80% 운영 가정

    const markerId = `cluster-${Math.random().toString(36).substr(2, 9)}`;

    const content = `
      <div id="${markerId}" class="clean-cluster-marker" onclick="window.MapMarkerManager.zoomToCluster(${coords[1]}, ${coords[0]})">
        <div class="cluster-card">
          <div class="cluster-header">
            <span class="region-name">클러스터</span>
          </div>
          <div class="cluster-stats">
            <div class="stat-item">
              <span class="stat-number">${totalCount}</span>
              <span class="stat-label">매장</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${openCount}</span>
              <span class="stat-label">운영</span>
            </div>
          </div>
        </div>
      </div>
      <style>
        .clean-cluster-marker {
          cursor: pointer;
          position: relative;
          z-index: 150;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clean-cluster-marker:hover {
          transform: scale(1.1);
          z-index: 9998 !important;
        }

        .cluster-card {
          background: linear-gradient(145deg, #4f46e5 0%, #6366f1 100%);
          border-radius: 12px;
          padding: 8px 12px;
          min-width: 80px;
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .clean-cluster-marker:hover .cluster-card {
          box-shadow: 0 8px 30px rgba(79, 70, 229, 0.5);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .cluster-header {
          text-align: center;
          margin-bottom: 4px;
        }

        .region-name {
          color: white;
          font-weight: 700;
          font-size: 12px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .cluster-stats {
          display: flex;
          justify-content: space-around;
          gap: 4px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .stat-number {
          color: white;
          font-weight: 700;
          font-size: 11px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 9px;
          font-weight: 500;
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

  // 카테고리별 아이콘 반환
  getCategoryIcon(category) {
    const iconMap = {
      '한식': '🍚',
      '중식': '🥢', 
      '일식': '🍣',
      '양식': '🍝',
      '치킨': '🍗',
      '피자': '🍕',
      '버거': '🍔',
      '카페': '☕',
      '디저트': '🍰',
      '분식': '🍜',
      '족발보쌈': '🦶',
      '바베큐': '🥩',
      '해산물': '🦐',
      '아시안': '🍛',
      '패스트푸드': '🍟',
      '술집': '🍺',
      '기타': '🍽️'
    };

    // 카테고리 이름에서 키워드 매칭
    for (const [key, icon] of Object.entries(iconMap)) {
      if (category && category.includes(key)) {
        return icon;
      }
    }

    return '🍽️';
  },

  // 클러스터 확대
  zoomToCluster(lat, lng) {
    console.log(`📍 클러스터 (${lat}, ${lng})로 확대`);

    if (window.currentMap) {
      const position = new kakao.maps.LatLng(lat, lng);
      window.currentMap.setCenter(position);

      // 현재 레벨에서 2단계 확대
      const currentLevel = window.currentMap.getLevel();
      const newLevel = Math.max(1, currentLevel - 2);
      window.currentMap.setLevel(newLevel);
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
  },

  // 완전 초기화
  reset() {
    console.log('🔄 MapMarkerManager 완전 초기화 (PostGIS 통합 API 버전)');

    this.shouldCancel = true;
    this.clearAllMarkers();

    this.currentLevel = 0;
    this.currentMarkerType = null;
    this.isLoading = false;
    this.shouldCancel = false;

    console.log('✅ MapMarkerManager 초기화 완료');
  }
};