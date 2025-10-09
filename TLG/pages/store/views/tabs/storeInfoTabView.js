
/**
 * 매장정보 탭 뷰 - UI 렌더링
 */

export const storeInfoTabView = {
  /**
   * 매장정보 탭 렌더링
   */
  render(store, additionalInfo) {
    return `
      <div class="store-info-tab-container">
        ${this.renderBasicInfo(store)}
        ${this.renderDetailInfo(additionalInfo)}
        ${this.renderOperatingHours(additionalInfo?.operatingHours)}
        ${this.renderFacilitiesInfo(additionalInfo?.facilities)}
        ${this.renderPaymentInfo(additionalInfo?.payment)}
        ${this.renderLocationInfo(store)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 기본 정보 렌더링
   */
  renderBasicInfo(store) {
    return `
      <section class="info-section basic-info">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            기본 정보
          </h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">매장명</span>
            <span class="info-value">${store.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">카테고리</span>
            <span class="info-value">${store.category || '일반 음식점'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">운영 상태</span>
            <span class="info-value ${store.isOpen ? 'open' : 'closed'}">
              ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">평점</span>
            <span class="info-value rating">
              ⭐ ${parseFloat(store.ratingAverage || 0).toFixed(1)}
              <span class="review-count">(${store.reviewCount || 0}개)</span>
            </span>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * 상세 정보 렌더링
   */
  renderDetailInfo(additionalInfo) {
    if (!additionalInfo) return '';

    return `
      <section class="info-section detail-info">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📝</span>
            매장 소개
          </h3>
        </div>
        <p class="store-description">${additionalInfo.description || '매장 소개가 준비중입니다.'}</p>
      </section>
    `;
  },

  /**
   * 영업시간 렌더링
   */
  renderOperatingHours(hours) {
    if (!hours) return '';

    return `
      <section class="info-section operating-hours">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🕐</span>
            영업시간
          </h3>
        </div>
        <div class="hours-grid">
          <div class="hours-item">
            <span class="hours-label">평일</span>
            <span class="hours-value">${hours.weekday}</span>
          </div>
          <div class="hours-item">
            <span class="hours-label">주말</span>
            <span class="hours-value">${hours.weekend}</span>
          </div>
          ${hours.holiday ? `
            <div class="hours-item">
              <span class="hours-label">공휴일</span>
              <span class="hours-value">${hours.holiday}</span>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  },

  /**
   * 편의시설 정보 렌더링
   */
  renderFacilitiesInfo(facilities) {
    if (!facilities || facilities.length === 0) return '';

    return `
      <section class="info-section facilities-info">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            편의시설
          </h3>
        </div>
        <div class="facilities-grid">
          ${facilities.map(facility => `
            <div class="facility-badge ${facility.available ? 'available' : 'unavailable'}">
              <span class="facility-icon">${facility.icon || '✓'}</span>
              <span class="facility-name">${facility.name}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 결제 수단 렌더링
   */
  renderPaymentInfo(payment) {
    if (!payment || payment.length === 0) return '';

    return `
      <section class="info-section payment-info">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">💳</span>
            결제 수단
          </h3>
        </div>
        <div class="payment-methods">
          ${payment.map(method => `
            <div class="payment-badge">
              ${this.getPaymentIcon(method)} ${method}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 위치 정보 렌더링
   */
  renderLocationInfo(store) {
    const address = store.address?.replace(/'/g, "\\'") || '주소 정보 없음';
    const lat = store.lat || 37.5665;
    const lng = store.lng || 126.9780;

    // ✅ 네이버 Static Map - Referer 인증용 endpoint 사용
    const mapImageUrl = 
      `https://maps.apigw.ntruss.com/map-static/v2/raster-cors`
      + `?w=570&h=200&center=${lng},${lat}&level=16`
      + `&markers=type:d|size:mid|color:red|pos:${lng}%20${lat}`
      + `&scale=2&maptype=basic&lang=ko`
      + `&X-NCP-APIGW-API-KEY-ID=ejmti6owy5`;

    return `
      <section class="home-section location-info-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📍</span> 위치정보
          </h3>
        </div>

        <div class="location-map-container">
          <div class="naver-map-wrapper">
            <img src="${mapImageUrl}" alt="매장 위치" class="location-map-image" />
            <div class="map-overlay">
              <button class="map-expand-btn"
                onclick="window.open('https://map.naver.com/p/search/${encodeURIComponent(address)}','_blank')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="location-address-section">
          <div class="address-text">${address}</div>
          <button class="address-copy-btn"
            onclick="navigator.clipboard.writeText('${address}').then(() => alert('주소가 복사되었습니다'))">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            주소복사
          </button>
        </div>
      </section>
    `;
  }
,


  /**
   * 결제 아이콘 가져오기
   */
  getPaymentIcon(method) {
    const iconMap = {
      '현금': '💵',
      '카드': '💳',
      '간편결제': '📱',
      '계좌이체': '🏦'
    };
    return iconMap[method] || '💳';
  },

  /**
   * 스타일 정의
   */
  getStyles() {
    return `
      <style>
        .store-info-tab-container {
          padding: 0;
          background: #f8f9fa;
        }

        .info-section {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f3f5;
        }

        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 20px;
        }

        /* 기본 정보 */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .info-value.open {
          color: #10b981;
        }

        .info-value.closed {
          color: #ef4444;
        }

        .info-value.rating {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .review-count {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        /* 상세 정보 */
        .store-description {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
        }

        /* 영업시간 */
        .hours-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hours-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .hours-label {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }

        .hours-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        /* 편의시설 */
        .facilities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .facility-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 10px;
          background: #f8f9fa;
          transition: all 0.2s;
        }

        .facility-badge.available {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        }

        .facility-badge.unavailable {
          opacity: 0.5;
          filter: grayscale(1);
        }

        .facility-icon {
          font-size: 24px;
        }

        .facility-name {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-align: center;
        }

        /* 결제 수단 */
        .payment-methods {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .payment-badge {
          padding: 10px 16px;
          background: #f1f5f9;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 위치 정보 */
         /* 위치정보 섹션 스타일 */
        .location-info-section {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
        }

        .location-map-container {
          margin-bottom: 16px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .naver-map-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          background: #f8f9fa;
        }

        .location-map-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .map-expand-btn {
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .map-expand-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: scale(1.05);
        }

        .map-expand-btn svg {
          color: #64748b;
        }

        .location-address-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .address-text {
          flex: 1;
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.5;
        }

        .address-copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .address-copy-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .address-copy-btn svg {
          color: #64748b;
        }

        @media (max-width: 480px) {
          .location-address-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .address-copy-btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeInfoTabView = storeInfoTabView;

console.log('✅ storeInfoTabView 모듈 로드 완료');
