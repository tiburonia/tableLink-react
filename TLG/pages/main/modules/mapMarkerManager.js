// 지도 마커 관리자
window.MapMarkerManager = {
  async createCustomMarker(store, map, preloadedRating = null) {
    if (!store.coord) return;

    // 매장 운영 상태 확인
    const isOpen = store.isOpen !== false;
    const statusIcon = isOpen ? '🟢' : '🔴';
    const statusText = isOpen ? '운영중' : '운영중지';
    const statusColor = isOpen ? '#4caf50' : '#f44336';

    console.log(`🏪 마커 생성: ${store.name} - ${statusText} (DB 값: ${store.isOpen})`);

    // 별점 정보 사용 (미리 로드된 경우 사용, 아니면 개별 조회)
    let rating = '0.0';
    if (preloadedRating) {
      rating = parseFloat(preloadedRating.ratingAverage).toFixed(1);
      console.log(`📊 마커: ${store.name} 미리 로드된 별점 사용: ${rating}점`);
    } else {
      const ratingData = await window.loadStoreRatingAsync(store.id);
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
        console.log(`📊 마커: ${store.name} 개별 별점 조회: ${rating}점`);
      }
    }

    // 커스텀 마커 HTML 생성
    const customOverlayContent = this.getMarkerHTML(store, rating, statusIcon, statusColor);

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

    console.log(`🔄 일괄 마커 생성 시작: ${stores.length}개 매장`);

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

    console.log(`✅ 일괄 마커 생성 완료: ${markers.length}개 마커`);
    return markers;
  },

  getMarkerHTML(store, rating, statusIcon, statusColor) {
    const gradientColor = statusColor === '#4caf50' ? 
      'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)' : 
      'linear-gradient(135deg, #f44336 0%, #ef5350 50%, #e57373 100%)';
    
    return `
      <div class="modern-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="marker-container">
          <div class="marker-circle" style="background: ${gradientColor};">
            <div class="marker-inner">
              <div class="rating-display">
                <span class="star-icon">⭐</span>
                <span class="rating-text">${rating}</span>
              </div>
              <div class="status-indicator" style="background: ${statusColor};">
                <span class="status-emoji">${statusIcon}</span>
              </div>
            </div>
            <div class="marker-pulse" style="background: ${statusColor};"></div>
          </div>
          <div class="marker-point"></div>
        </div>
        <div class="marker-tooltip">
          <div class="tooltip-content">
            <div class="store-title">${store.name}</div>
            <div class="store-meta">
              <span class="category-tag">${store.category || '음식점'}</span>
              <span class="rating-info">★ ${rating}</span>
            </div>
          </div>
          <div class="tooltip-arrow"></div>
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

        .marker-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 2;
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 2px;
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

        .status-indicator {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .status-emoji {
          font-size: 8px;
          filter: brightness(1.2);
        }

        .marker-pulse {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 50%;
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
            transform: scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        .marker-point {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid white;
          margin-top: -2px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .marker-tooltip {
          position: absolute;
          bottom: 65px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.12),
            0 4px 16px rgba(0,0,0,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 20;
          white-space: nowrap;
          max-width: 200px;
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .store-title {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
        }

        .store-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .category-tag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
        }

        .rating-info {
          color: #fbbf24;
          font-size: 12px;
          font-weight: 600;
        }

        .tooltip-arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255,255,255,0.98);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .modern-marker:hover {
          transform: translateY(-2px) scale(1.05);
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25));
        }

        .modern-marker:hover .marker-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-4px);
        }

        .modern-marker:hover .marker-pulse {
          animation-duration: 1s;
        }

        .modern-marker:active {
          transform: translateY(0) scale(1.02);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }

        .modern-marker:active .marker-circle {
          transform: scale(0.95);
        }
      </style>
    `;
  }
};