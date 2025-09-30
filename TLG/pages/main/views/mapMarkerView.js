
/**
 * 지도 마커 UI 렌더링 뷰
 * 마커 DOM 생성과 화면 렌더링만 담당
 */
export const mapMarkerView = {
  /**
   * 개별 매장 마커 생성
   */
  createStoreMarker(markerData, map) {
    if (!markerData || !markerData.position || !map) {
      console.error('❌ 마커 생성에 필요한 데이터가 부족함');
      return null;
    }

    const markerId = `store-marker-${markerData.id}-${Date.now()}`;
    const content = this.generateMarkerHTML(markerData, markerId);

    const customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: markerData.position,
      content: content,
      yAnchor: 1,
      zIndex: 200
    });

    return customOverlay;
  },

  /**
   * 마커 HTML 생성
   */
  generateMarkerHTML(markerData, markerId) {
    const { name, isOpen, rating, categoryIcon, storeData } = markerData;
    const displayName = name.length > 8 ? name.substring(0, 8) + '...' : name;

    // storeData를 안전하게 JSON 변환
    let storeDataString;
    try {
      storeDataString = JSON.stringify(storeData).replace(/"/g, '&quot;');
    } catch (error) {
      console.error('❌ 마커 storeData JSON 변환 실패:', error);
      storeDataString = JSON.stringify({
        id: markerData.id,
        name: name,
        category: markerData.category,
        isOpen: isOpen
      }).replace(/"/g, '&quot;');
    }

    return `
      <div id="${markerId}" class="clean-store-marker ${isOpen ? 'open' : 'closed'}" 
           onclick="(async function(){ 
             try { 
               if(window.renderStore) {
                 await window.renderStore(${storeDataString}); 
               } else {
                 console.error('renderStore not found'); 
               }
             } catch(e) { 
               console.error('renderStore error:', e); 
             } 
           })()">
        <div class="marker-card">
          <div class="marker-icon">
            <span class="icon-emoji">${categoryIcon}</span>
          </div>
          <div class="marker-info">
            <div class="store-name">${displayName}</div>
            <div class="store-details">
              <span class="rating">★ ${rating}</span>
              <span class="status ${isOpen ? 'open' : 'closed'}">${isOpen ? '운영중' : '준비중'}</span>
            </div>
          </div>
        </div>
      </div>
      ${this.getMarkerStyles(isOpen)}
    `;
  },

  /**
   * 마커 스타일 생성
   */
  getMarkerStyles(isOpen) {
    return `
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

        /* 하이라이트 효과 */
        .clean-store-marker.highlighted {
          z-index: 10000 !important;
          transform: scale(1.15);
          animation: markerPulse 2s infinite;
        }

        .clean-store-marker.highlighted .marker-card {
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
          border-color: #667eea;
          border-width: 2px;
        }

        @keyframes markerPulse {
          0%, 100% { transform: scale(1.15); }
          50% { transform: scale(1.2); }
        }
      </style>
    `;
  },

  /**
   * 마커 하이라이트
   */
  highlightMarker(marker) {
    if (!marker || !marker.getContent) return;

    const content = marker.getContent();
    const highlightedContent = content.replace(
      'class="clean-store-marker',
      'class="clean-store-marker highlighted'
    );
    
    marker.setContent(highlightedContent);
    console.log('✨ 마커 하이라이트 적용');
  },

  /**
   * 마커 하이라이트 제거
   */
  removeHighlight(marker) {
    if (!marker || !marker.getContent) return;

    const content = marker.getContent();
    const normalContent = content.replace(
      'class="clean-store-marker highlighted',
      'class="clean-store-marker'
    );
    
    marker.setContent(normalContent);
  },

  /**
   * 클러스터 마커 생성 (향후 구현)
   */
  createClusterMarker(clusterData, map) {
    // 향후 마커 클러스터링 구현시 사용
    console.log('📊 클러스터 마커 생성 (미구현):', clusterData);
    return null;
  },

  /**
   * 마커 애니메이션 효과
   */
  animateMarkerAppearance(marker) {
    if (!marker || !marker.getContent) return;

    const content = marker.getContent();
    const animatedContent = content.replace(
      'class="clean-store-marker',
      'class="clean-store-marker animate-appear'
    );
    
    marker.setContent(animatedContent);

    // 애니메이션 후 클래스 제거
    setTimeout(() => {
      const normalContent = marker.getContent().replace(
        'class="clean-store-marker animate-appear',
        'class="clean-store-marker'
      );
      marker.setContent(normalContent);
    }, 500);
  },

  /**
   * 마커 에러 상태 표시
   */
  showMarkerError(position, errorMessage, map) {
    const errorContent = `
      <div class="error-marker" style="
        background: #fee2e2; 
        border: 2px solid #fecaca; 
        border-radius: 8px; 
        padding: 8px 12px; 
        color: #dc2626; 
        font-size: 12px; 
        font-weight: 600;
        max-width: 200px;
        text-align: center;
      ">
        ❌ ${errorMessage}
      </div>
    `;

    return new kakao.maps.CustomOverlay({
      map: map,
      position: position,
      content: errorContent,
      yAnchor: 1,
      zIndex: 100
    });
  }
};

// 전역 등록 (호환성을 위해)
if (typeof window !== 'undefined') {
  window.mapMarkerView = mapMarkerView;
}
