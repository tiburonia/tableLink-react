
/**
 * 매장 추가 정보 HTML 모듈 (네이티브 앱 스타일)
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링 (공지사항 포함)
   */
  render(additionalInfo, notices = null) {
    if (!additionalInfo) return '';

    return `
      <div class="native-store-info-container">
        <!-- 주요 정보 카드 -->
        <div class="info-main-card">
          <!-- 평점 및 위치 -->
          <div class="info-highlight-row">
            <div class="rating-box">
              <span class="rating-star">⭐</span>
              <span class="rating-value">${additionalInfo.rating.average}</span>
              <span class="rating-reviews">리뷰 ${additionalInfo.rating.count.toLocaleString()}개</span>
            </div>
            <div class="location-badge">
              <span class="location-icon">📍</span>
              <span class="location-text">${this.formatAddress(additionalInfo.address)}</span>
            </div>
          </div>

          <!-- 매장 소개 -->
          ${additionalInfo.description ? `
            <div class="description-section">
              <p class="description-text">${additionalInfo.description}</p>
            </div>
          ` : ''}
        </div>

        <!-- 상세 정보 리스트 -->
        <div class="info-detail-list">
          ${this.renderDetailItem('🏠', '주소', additionalInfo.address, true)}
          ${this.renderOperatingHoursItem(additionalInfo.operatingHours)}
          ${this.renderDetailItem('📞', '전화', additionalInfo.contact, false, `tel:${additionalInfo.contact}`)}
          ${this.renderFacilitiesItem(additionalInfo.facilities)}
          ${this.renderPaymentItem(additionalInfo.payment)}
        </div>

        <!-- 공지사항 섹션 -->
        ${notices ? this.renderNoticesSection(notices) : ''}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 주소 간략화
   */
  formatAddress(address) {
    if (!address) return '주소 정보 없음';
    const parts = address.split(' ');
    if (parts.length > 3) {
      return parts.slice(-3).join(' ');
    }
    return address;
  },

  /**
   * 상세 정보 아이템 렌더링
   */
  renderDetailItem(icon, label, value, multiline = false, link = null) {
    if (!value || value === '정보 없음' || value === '연락처 정보 없음') return '';

    const content = link 
      ? `<a href="${link}" class="detail-value-link">${value}</a>`
      : `<span class="detail-value ${multiline ? 'multiline' : ''}">${value}</span>`;

    return `
      <div class="detail-item">
        <div class="detail-header">
          <span class="detail-icon">${icon}</span>
          <span class="detail-label">${label}</span>
        </div>
        ${content}
      </div>
    `;
  },

  /**
   * 영업시간 아이템 렌더링
   */
  renderOperatingHoursItem(hours) {
    if (!hours || !hours.weekday) return '';

    return `
      <div class="detail-item">
        <div class="detail-header">
          <span class="detail-icon">🕐</span>
          <span class="detail-label">영업시간</span>
        </div>
        <div class="hours-content">
          <div class="hours-row">
            <span class="hours-day">평일</span>
            <span class="hours-time">${hours.weekday}</span>
          </div>
          <div class="hours-row">
            <span class="hours-day">주말</span>
            <span class="hours-time">${hours.weekend}</span>
          </div>
          ${hours.holiday ? `
            <div class="hours-row">
              <span class="hours-day">공휴일</span>
              <span class="hours-time">${hours.holiday}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * 편의시설 아이템 렌더링
   */
  renderFacilitiesItem(facilities) {
    if (!facilities || facilities.length === 0) return '';

    const available = facilities.filter(f => f.available);
    if (available.length === 0) return '';

    return `
      <div class="detail-item">
        <div class="detail-header">
          <span class="detail-icon">🏪</span>
          <span class="detail-label">편의시설</span>
        </div>
        <div class="facilities-tags">
          ${available.map(f => `
            <span class="facility-tag">${f.name}</span>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 결제 수단 아이템 렌더링
   */
  renderPaymentItem(payment) {
    if (!payment || payment.length === 0) return '';

    return `
      <div class="detail-item">
        <div class="detail-header">
          <span class="detail-icon">💳</span>
          <span class="detail-label">결제</span>
        </div>
        <div class="payment-tags">
          ${payment.map(method => `
            <span class="payment-tag">${this.getPaymentIcon(method)} ${method}</span>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 결제 아이콘 반환
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
   * 공지사항 섹션 렌더링
   */
  renderNoticesSection(notices) {
    if (!notices || notices.length === 0) return '';

    return `
      <div class="notices-container">
        <div class="notices-header">
          <span class="notices-icon">📢</span>
          <h3 class="notices-title">공지사항</h3>
        </div>
        <div class="notices-list">
          ${notices.map(notice => this.renderNoticeCard(notice)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 공지사항 카드 렌더링
   */
  renderNoticeCard(notice) {
    const typeClass = notice.type === 'important' ? 'notice-important' : 'notice-event';
    const newBadge = notice.isNew ? '<span class="new-badge">NEW</span>' : '';

    return `
      <div class="notice-card ${typeClass}">
        <div class="notice-top">
          <div class="notice-title-row">
            <span class="notice-icon">${notice.icon}</span>
            <h4 class="notice-title">${notice.title}</h4>
            ${newBadge}
          </div>
          <span class="notice-date">${notice.formattedDate}</span>
        </div>
        <p class="notice-content">${notice.content}</p>
      </div>
    `;
  },

  /**
   * 스타일
   */
  getStyles() {
    return `
      <style>
        .native-store-info-container {
          margin-top: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* 메인 정보 카드 */
        .info-main-card {
          background: white;
          border-radius: 0;
          padding: 20px;
          border-bottom: 8px solid #f8f9fa;
        }

        /* 하이라이트 행 */
        .info-highlight-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rating-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rating-star {
          font-size: 18px;
          color: #fbbf24;
        }

        .rating-value {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .rating-reviews {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .location-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 16px;
          max-width: 180px;
        }

        .location-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .location-text {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 매장 소개 */
        .description-section {
          margin-top: 8px;
        }

        .description-text {
          margin: 0;
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          word-break: keep-all;
        }

        /* 상세 정보 리스트 */
        .info-detail-list {
          background: white;
          border-radius: 0;
          display: flex;
          flex-direction: column;
        }

        .detail-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-icon {
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .detail-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .detail-value {
          font-size: 14px;
          color: #1e293b;
          line-height: 1.5;
          padding-left: 26px;
          font-weight: 500;
        }

        .detail-value.multiline {
          word-break: keep-all;
          line-height: 1.6;
        }

        .detail-value-link {
          font-size: 14px;
          color: #3b82f6;
          text-decoration: none;
          padding-left: 26px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .detail-value-link:hover {
          color: #2563eb;
        }

        /* 영업시간 */
        .hours-content {
          padding-left: 26px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hours-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hours-day {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          min-width: 50px;
        }

        .hours-time {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
        }

        /* 편의시설 태그 */
        .facilities-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-left: 26px;
        }

        .facility-tag {
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        /* 결제 수단 태그 */
        .payment-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding-left: 26px;
        }

        .payment-tag {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1e40af;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 16px;
          border: 1px solid #bfdbfe;
        }

        /* 공지사항 컨테이너 */
        .notices-container {
          background: white;
          border-radius: 0;
          padding: 20px;
          margin-top: 8px;
          border-bottom: 8px solid #f8f9fa;
        }

        .notices-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .notices-icon {
          font-size: 20px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .notices-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.3px;
        }

        .notices-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* 공지사항 카드 */
        .notice-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }

        .notice-card:active {
          background: #f1f5f9;
          transform: scale(0.99);
        }

        .notice-card.notice-important {
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
          border-color: #fecaca;
        }

        .notice-card.notice-event {
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
          border-color: #bfdbfe;
        }

        .notice-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .notice-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .notice-icon {
          font-size: 18px;
          flex-shrink: 0;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .notice-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .new-badge {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 6px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }

        .notice-date {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          flex-shrink: 0;
        }

        .notice-content {
          margin: 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          word-break: keep-all;
        }

        /* 반응형 */
        @media (max-width: 380px) {
          .info-main-card,
          .notices-container {
            padding: 16px;
          }

          .detail-item {
            padding: 14px 16px;
          }

          .info-highlight-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .location-badge {
            max-width: 100%;
          }

          .rating-value {
            font-size: 18px;
          }

          .detail-value,
          .detail-value-link {
            padding-left: 0;
          }

          .hours-content,
          .facilities-tags,
          .payment-tags {
            padding-left: 0;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (네이티브 앱 스타일)');
