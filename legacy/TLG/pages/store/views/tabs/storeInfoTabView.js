
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
    return `
      <section class="info-section location-info">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📍</span>
            위치
          </h3>
        </div>
        <div class="location-details">
          <p class="address">${store.address || '주소 정보 없음'}</p>
          ${store.phone ? `
            <a href="tel:${store.phone}" class="contact-btn">
              📞 ${store.phone}
            </a>
          ` : ''}
        </div>
      </section>
    `;
  },

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
        .location-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .address {
          margin: 0;
          font-size: 15px;
          line-height: 1.5;
          color: #475569;
        }

        .contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          width: fit-content;
        }

        .contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .info-grid {
            grid-template-columns: 1fr;
          }

          .facilities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeInfoTabView = storeInfoTabView;

console.log('✅ storeInfoTabView 모듈 로드 완료');
