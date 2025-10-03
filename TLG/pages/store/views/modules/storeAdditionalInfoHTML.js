/**
 * 매장 추가 정보 HTML 모듈 (Compact 버전)
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링
   */
  render(additionalInfo) {
    if (!additionalInfo) return '';

    return `
      <div class="store-additional-info-card">
        ${this.renderInfoRow('📍', '주소', additionalInfo.address)}
        ${this.renderInfoRow('⭐', '평점', `${additionalInfo.rating.average} (${additionalInfo.rating.count.toLocaleString()} 리뷰)`)}
        ${this.renderInfoRow('📝', '소개', additionalInfo.description)}
        ${this.renderFacilities(additionalInfo.facilities)}
        ${this.renderPaymentMethods(additionalInfo.payment)}
        ${this.renderInfoRow('📞', '연락처', additionalInfo.contact)}
      </div>
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
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (Compact 버전)');