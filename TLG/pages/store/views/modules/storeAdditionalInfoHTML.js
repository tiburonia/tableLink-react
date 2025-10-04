/**
 * 매장 추가 정보 HTML 모듈 (Compact 버전)
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링 (공지사항 포함)
   */
  render(additionalInfo, notices = null) {
    if (!additionalInfo) return '';

    return `
      <div class="store-additional-info-card">
        ${this.renderInfoRow('📍', '주소', additionalInfo.address)}
        ${this.renderInfoRow('⭐', '평점', `${additionalInfo.rating.average} (${additionalInfo.rating.count.toLocaleString()} 리뷰)`)}
        ${this.renderInfoRow('📝', '소개', additionalInfo.description)}
        ${this.renderOperatingHours(additionalInfo.operatingHours)}
        ${this.renderFacilities(additionalInfo.facilities)}
        ${this.renderPaymentMethods(additionalInfo.payment)}
        ${this.renderInfoRow('📞', '연락처', additionalInfo.contact)}
      </div>
      ${notices ? this.renderNotices(notices) : ''}
      ${this.getStyles()}
    `;
  },

  /**
   * 기본 정보 행 렌더링
   */
  renderInfoRow(icon, label, value) {
    return `
      <div class="info-row">
        <span class="info-icon">${icon}</span>
        <span class="info-label">${label}</span>
        <span class="info-value">${value}</span>
      </div>
    `;
  },

  /**
   * 영업시간 행
   */
  renderOperatingHours(hours) {
    return `
      <div class="info-row">
        <span class="info-icon">🕐</span>
        <span class="info-label">영업시간</span>
        <span class="info-value">
          평일 ${hours.weekday} / 주말 ${hours.weekend}
        </span>
      </div>
    `;
  },

  /**
   * 편의시설 행
   */
  renderFacilities(facilities) {
    if (!facilities || facilities.length === 0) return '';

    const facilitiesText = facilities
      .filter(f => f.available)
      .map(f => f.name)
      .join(', ');

    if (!facilitiesText) return '';

    return `
      <div class="info-row">
        <span class="info-icon">🏪</span>
        <span class="info-label">편의시설</span>
        <span class="info-value">${facilitiesText}</span>
      </div>
    `;
  },

  /**
   * 결제 수단 행
   */
  renderPaymentMethods(payment) {
    if (!payment || payment.length === 0) return '';

    const paymentText = payment.join(', ');

    return `
      <div class="info-row">
        <span class="info-icon">💳</span>
        <span class="info-label">결제</span>
        <span class="info-value">${paymentText}</span>
      </div>
    `;
  },

  /**
   * 공지사항 섹션 렌더링
   */
  renderNotices(notices) {
    if (!notices || notices.length === 0) {
      return this.renderEmptyNotices();
    }

    return `
      <div class="store-notices">
        <div class="notices-header">
          <h3 class="notices-title">
            <span class="notices-icon">📢</span>
            공지사항
          </h3>
        </div>
        <div class="notices-list">
          ${notices.map(notice => this.renderNoticeItem(notice)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 공지사항 항목 렌더링
   */
  renderNoticeItem(notice) {
    const typeClass = notice.type === 'important' ? 'notice-important' : 'notice-event';
    const newBadge = notice.isNew ? '<span class="notice-new-badge">NEW</span>' : '';

    return `
      <div class="notice-item ${typeClass}">
        <div class="notice-icon">${notice.icon}</div>
        <div class="notice-content">
          <div class="notice-header">
            <h4 class="notice-title">${notice.title}</h4>
            ${newBadge}
          </div>
          <p class="notice-text">${notice.content}</p>
          <div class="notice-meta">
            <span class="notice-date">${notice.formattedDate}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 빈 공지사항 렌더링
   */
  renderEmptyNotices() {
    return `
      <div class="store-notices empty">
        <div class="notices-empty">
          <span class="empty-icon">📭</span>
          <p class="empty-text">현재 공지사항이 없습니다</p>
        </div>
      </div>
    `;
  },

  /**
   * 스타일
   */
  getStyles() {
    return `
      <style>
        .store-additional-info-card {
          margin-top: 30px;
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }

        .info-icon {
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          min-width: 52px;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 13px;
          color: #374151;
          flex: 1;
          word-break: keep-all;
          line-height: 1.5;
        }

        /* 평점 강조 */
        .info-row:has(.info-label:contains('평점')) .info-value {
          font-weight: 600;
          color: #f59e0b;
        }

        /* 연락처 링크 스타일 */
        .info-row:has(.info-label:contains('연락처')) .info-value {
          color: #3b82f6;
          font-weight: 500;
        }

        /* 공지사항 스타일 */
        .store-notices {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .notices-header {
          margin-bottom: 12px;
        }

        .notices-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notices-icon {
          font-size: 18px;
        }

        .notices-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notice-item {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .notice-item:hover {
          transform: translateX(2px);
          background: #f3f4f6;
        }

        .notice-item.notice-important {
          border-left-color: #ef4444;
          background: linear-gradient(to right, #fef2f2 0%, #f9fafb 10%);
        }

        .notice-item.notice-event {
          border-left-color: #3b82f6;
          background: linear-gradient(to right, #eff6ff 0%, #f9fafb 10%);
        }

        .notice-icon {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
        }

        .notice-content {
          flex: 1;
          min-width: 0;
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .notice-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
        }

        .notice-new-badge {
          display: inline-block;
          padding: 2px 5px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 9px;
          font-weight: 700;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .notice-text {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.4;
        }

        .notice-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .notice-date {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .notices-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 36px;
          margin-bottom: 8px;
          opacity: 0.4;
        }

        .empty-text {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
        }

        @media (max-width: 380px) {
          .store-additional-info-card {
            padding: 14px;
            gap: 10px;
          }

          .info-label {
            font-size: 11px;
            min-width: 48px;
          }

          .info-value {
            font-size: 12px;
          }

          .info-icon {
            font-size: 15px;
          }

          .store-notices {
            margin-top: 14px;
            padding-top: 14px;
          }

          .notices-title {
            font-size: 15px;
          }

          .notice-item {
            padding: 10px;
            gap: 8px;
          }

          .notice-title {
            font-size: 13px;
          }

          .notice-text {
            font-size: 11px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (Compact 버전)');