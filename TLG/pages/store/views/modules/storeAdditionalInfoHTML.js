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
          margin-top: 0;
          background: white;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.8);
          position: relative;
          overflow: hidden;
        }

        .store-additional-info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #fafafa 0%, #f8f9fa 100%);
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .info-row:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);
          border-color: #e2e8f0;
          transform: translateX(2px);
        }

        .info-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .info-label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          min-width: 56px;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 14px;
          color: #1e293b;
          flex: 1;
          word-break: keep-all;
          line-height: 1.6;
          font-weight: 500;
        }

        /* 평점 강조 */
        .info-row:has(.info-label:contains('평점')) {
          background: linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%);
          border-color: #fbbf24;
        }

        .info-row:has(.info-label:contains('평점')) .info-value {
          font-weight: 700;
          color: #f59e0b;
        }

        /* 연락처 링크 스타일 */
        .info-row:has(.info-label:contains('연락처')) {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: #3b82f6;
        }

        .info-row:has(.info-label:contains('연락처')) .info-value {
          color: #3b82f6;
          font-weight: 600;
        }

        /* 공지사항 스타일 */
        .store-notices {
          margin-top: 8px;
          padding: 20px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.8);
          position: relative;
          overflow: hidden;
        }

        .store-notices::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #fbbf24 100%);
        }

        .notices-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }

        .notices-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.3px;
        }

        .notices-icon {
          font-size: 20px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .notices-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notice-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border: 1.5px solid #f1f5f9;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .notice-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #e5e7eb;
          transition: all 0.3s ease;
        }

        .notice-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .notice-item.notice-important::before {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
        }

        .notice-item.notice-important {
          border-color: #fecaca;
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
        }

        .notice-item.notice-important:hover {
          border-color: #ef4444;
        }

        .notice-item.notice-event::before {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        }

        .notice-item.notice-event {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
        }

        .notice-item.notice-event:hover {
          border-color: #3b82f6;
        }

        .notice-icon {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .notice-content {
          flex: 1;
          min-width: 0;
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .notice-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.4;
        }

        .notice-new-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 8px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 10px;
          font-weight: 800;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .notice-text {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.6;
          font-weight: 500;
        }

        .notice-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notice-date {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          padding: 2px 8px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .notices-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.3;
          filter: grayscale(100%);
        }

        .empty-text {
          margin: 0;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        @media (max-width: 380px) {
          .store-additional-info-card {
            padding: 16px;
            gap: 14px;
            border-radius: 16px;
          }

          .info-row {
            padding: 10px;
            gap: 10px;
          }

          .info-label {
            font-size: 12px;
            min-width: 52px;
          }

          .info-value {
            font-size: 13px;
          }

          .info-icon {
            font-size: 18px;
          }

          .store-notices {
            padding: 16px;
            border-radius: 16px;
          }

          .notices-title {
            font-size: 16px;
          }

          .notice-item {
            padding: 12px;
            gap: 10px;
          }

          .notice-title {
            font-size: 14px;
          }

          .notice-text {
            font-size: 12px;
          }

          .notice-icon {
            font-size: 20px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (Compact 버전)');