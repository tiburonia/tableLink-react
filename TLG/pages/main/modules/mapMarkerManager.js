
// 지도 마커 관리자
window.MapMarkerManager = {
  async createCustomMarker(store, map) {
    if (!store.coord) return;

    // 매장 운영 상태 확인
    const isOpen = store.isOpen !== false;
    const statusIcon = isOpen ? '🟢' : '🔴';
    const statusText = isOpen ? '운영중' : '운영중지';
    const statusColor = isOpen ? '#4caf50' : '#f44336';

    // 별점 정보 비동기 로딩
    let rating = '0.0';
    await loadStoreRatingAsync(store.id).then(ratingData => {
      if (ratingData) {
        rating = parseFloat(ratingData.ratingAverage).toFixed(1);
      }
    });

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

    return customOverlay;
  },

  getMarkerHTML(store, rating, statusIcon, statusColor) {
    return `
      <div class="compact-marker" onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})">
        <div class="marker-pin">
          <div class="pin-head" style="background-color: ${statusColor};">
            <span class="pin-rating">★${rating}</span>
          </div>
          <div class="pin-point"></div>
        </div>
        <div class="marker-label">
          <span class="store-name">${store.name}</span>
          <span class="store-status" style="color: ${statusColor};">${statusIcon}</span>
        </div>
      </div>

      <style>
        .compact-marker {
          position: relative;
          cursor: pointer;
          z-index: 10;
        }

        .marker-pin {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2px;
        }

        .pin-head {
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
        }

        .pin-rating {
          color: white;
          font-size: 9px;
          font-weight: bold;
          transform: rotate(45deg);
          white-space: nowrap;
        }

        .pin-point {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid ${statusColor};
          margin-top: -3px;
        }

        .marker-label {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          backdrop-filter: blur(3px);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          max-width: 120px;
          position: absolute;
          left: -60px;
          top: -45px;
          width: 120px;
        }

        .store-name {
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .store-status {
          font-size: 8px;
        }

        .compact-marker:hover .pin-head {
          transform: rotate(-45deg) scale(1.1);
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }

        .compact-marker:hover .marker-label {
          background: rgba(255, 255, 255, 1);
          transform: translateX(-50%) scale(1.05);
        }

        .compact-marker:active .pin-head {
          transform: rotate(-45deg) scale(0.95);
        }
      </style>
    `;
  }
};
