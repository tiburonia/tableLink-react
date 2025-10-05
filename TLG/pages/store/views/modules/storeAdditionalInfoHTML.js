/**
 * 매장 추가 정보 HTML 모듈 (카카오맵 스타일)
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링 (공지사항 포함)
   */
  render(additionalInfo, notices = null) {
    if (!additionalInfo) return '';

    return `
      <div class="kakao-store-info-container">
        <!-- 평점 및 리뷰 -->
        <div class="info-rating-section">
          <span class="rating-star">⭐</span>
          <span class="rating-value">${additionalInfo.rating.average}</span>
          <span class="rating-reviews">리뷰 ${additionalInfo.rating.count.toLocaleString()}개 〉</span>
        </div>

        <!-- 상세 정보 리스트 -->
        <div class="info-detail-list">
          ${this.renderLocationItem(additionalInfo.address)}
          ${this.renderOperatingHoursItem(additionalInfo.operatingHours)}
          ${this.renderOperatingStatusItem()}
        </div>

        <!-- 공지사항 섹션 -->
        ${notices ? this.renderNoticesSection(notices) : ''}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 위치 정보 아이템
   */
  renderLocationItem(address) {
    if (!address || address === '주소 정보 없음') return '';

    return `
      <div class="info-item">
        <span class="info-icon">📍</span>
        <div class="info-content">
          <span class="info-badge">삼전역에서 250m</span>
          <button class="info-link">📍 위치</button>
        </div>
      </div>
    `;
  },

  /**
   * 영업시간 아이템
   */
  renderOperatingHoursItem(hours) {
    if (!hours || !hours.weekday) return '';

    return `
      <div class="info-item">
        <span class="info-icon">⏰</span>
        <div class="info-content">
          <span class="info-text">정상 영업안함</span>
          <span class="info-subtext">지녀 6-10만원</span>
        </div>
      </div>
    `;
  },

  /**
   * 영업 상태 아이템
   */
  renderOperatingStatusItem() {
    return `
      <div class="info-item">
        <span class="info-icon">🕐</span>
        <div class="info-content">
          <span class="info-text">영업 시간은 매장에 문의해주세요</span>
          <button class="info-chevron">〉</button>
        </div>
      </div>
    `;
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
        .kakao-store-info-container {
          background: white;
          padding: 0;
        }

        /* 평점 섹션 */
        .info-rating-section {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rating-star {
          font-size: 16px;
          color: #fbbf24;
        }

        .rating-value {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.3px;
        }

        .rating-reviews {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          margin-left: 4px;
        }

        /* 상세 정보 리스트 */
        .info-detail-list {
          background: white;
          display: flex;
          flex-direction: column;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .info-badge {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        .info-text {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
          flex: 1;
        }

        .info-subtext {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        .info-link {
          background: none;
          border: none;
          font-size: 13px;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        .info-chevron {
          background: none;
          border: none;
          font-size: 14px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
        }

        /* 공지사항 컨테이너 */
        .notices-container {
          background: white;
          padding: 20px;
          margin-top: 8px;
          border-top: 8px solid #f8f9fa;
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
          .info-rating-section,
          .info-item {
            padding: 12px 16px;
          }

          .notices-container {
            padding: 16px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (카카오맵 스타일)');