
/**
 * 매장 추가 정보 HTML 모듈
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링
   */
  render(additionalInfo) {
    if (!additionalInfo) return '';

    return `
      <div class="store-additional-info">
        ${this.renderAddressSection(additionalInfo.address)}
        ${this.renderRatingSection(additionalInfo.rating)}
        ${this.renderDescriptionSection(additionalInfo.description)}
        ${this.renderOperatingHours(additionalInfo.operatingHours)}
        ${this.renderFacilities(additionalInfo.facilities)}
        ${this.renderPaymentMethods(additionalInfo.payment)}
        ${this.renderContact(additionalInfo.contact)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 주소 섹션
   */
  renderAddressSection(address) {
    return `
      <div class="info-item address-item">
        <div class="info-icon">📍</div>
        <div class="info-content">
          <div class="info-label">주소</div>
          <div class="info-value">${address}</div>
        </div>
      </div>
    `;
  },

  /**
   * 평점 섹션
   */
  renderRatingSection(rating) {
    return `
      <div class="info-item rating-item">
        <div class="info-icon">⭐</div>
        <div class="info-content">
          <div class="info-label">고객 평가</div>
          <div class="info-value">
            <span class="rating-score">${rating.average}</span>
            <span class="rating-count">(${rating.count.toLocaleString()}개의 리뷰)</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 설명 섹션
   */
  renderDescriptionSection(description) {
    return `
      <div class="info-item description-item">
        <div class="info-icon">📝</div>
        <div class="info-content">
          <div class="info-label">매장 소개</div>
          <div class="info-value description-text">${description}</div>
        </div>
      </div>
    `;
  },

  /**
   * 영업시간
   */
  renderOperatingHours(hours) {
    return `
      <div class="info-item hours-item">
        <div class="info-icon">🕐</div>
        <div class="info-content">
          <div class="info-label">영업시간</div>
          <div class="info-value hours-list">
            <div class="hours-row">
              <span class="hours-day">평일</span>
              <span class="hours-time">${hours.weekday}</span>
            </div>
            <div class="hours-row">
              <span class="hours-day">주말</span>
              <span class="hours-time">${hours.weekend}</span>
            </div>
            <div class="hours-row">
              <span class="hours-day">공휴일</span>
              <span class="hours-time">${hours.holiday}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 편의시설
   */
  renderFacilities(facilities) {
    if (!facilities || facilities.length === 0) return '';

    return `
      <div class="info-item facilities-item">
        <div class="info-icon">🏪</div>
        <div class="info-content">
          <div class="info-label">편의시설</div>
          <div class="info-value facilities-grid">
            ${facilities.map(f => `
              <div class="facility-tag ${f.available ? 'available' : 'unavailable'}">
                <span class="facility-icon">${f.icon}</span>
                <span class="facility-name">${f.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 결제 수단
   */
  renderPaymentMethods(payment) {
    if (!payment || payment.length === 0) return '';

    return `
      <div class="info-item payment-item">
        <div class="info-icon">💳</div>
        <div class="info-content">
          <div class="info-label">결제 수단</div>
          <div class="info-value payment-list">
            ${payment.map(p => `<span class="payment-tag">${p}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 연락처
   */
  renderContact(contact) {
    return `
      <div class="info-item contact-item">
        <div class="info-icon">📞</div>
        <div class="info-content">
          <div class="info-label">연락처</div>
          <div class="info-value contact-text">${contact}</div>
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
        .store-additional-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 0;
        }

        .info-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          background: #e9ecef;
        }

        .info-icon {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
          min-width: 0;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #1f2937;
          line-height: 1.5;
        }

        .rating-score {
          font-size: 18px;
          font-weight: 700;
          color: #f59e0b;
          margin-right: 6px;
        }

        .rating-count {
          font-size: 13px;
          color: #6b7280;
        }

        .description-text {
          line-height: 1.6;
        }

        .hours-list {
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
          font-weight: 600;
          color: #4b5563;
        }

        .hours-time {
          color: #1f2937;
        }

        .facilities-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .facility-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #e5e7eb;
        }

        .facility-tag.available {
          color: #059669;
          border-color: #d1fae5;
          background: #ecfdf5;
        }

        .facility-tag.unavailable {
          color: #9ca3af;
          opacity: 0.6;
        }

        .payment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .payment-tag {
          display: inline-block;
          padding: 4px 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
        }

        .contact-text {
          font-weight: 600;
          color: #3b82f6;
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료');
