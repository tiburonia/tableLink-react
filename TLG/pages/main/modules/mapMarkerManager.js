// 지도 마커 관리자
window.MapMarkerManager = {
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