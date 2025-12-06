
/**
 * 매장 추가 정보 HTML 모듈 (네이티브 앱 스타일)
 */
export const storeAdditionalInfoHTML = {
  /**
   * 매장 추가 정보 섹션 렌더링 (공지사항 포함)
   */
  render(additionalInfo, notices = null, store = null) {
    if (!additionalInfo) return '';

    return `
      <div class="native-store-info-container">
        <!-- 핵심 정보 카드 (테이블링 스타일) -->
        <div class="key-info-cards">
          ${this.renderLocationCard(additionalInfo.address || store?.address)}
          ${this.renderPriceCard(store)}
          ${this.renderHoursCard(additionalInfo.operatingHours)}
        </div>

        <!-- 공지사항 섹션 -->
        ${notices ? this.renderNoticesSection(notices) : ''}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 위치 정보 카드 (테이블링 스타일)
   */
  renderLocationCard(address) {
    if (!address || address === '주소 정보 없음') return '';

    const shortAddress = address.split(' ').slice(0, 3).join(' ');

    return `
      <div class="info-card location-card">
        <div class="info-card-icon">📍</div>
        <div class="info-card-content">
          <div class="info-card-value">${shortAddress}</div>
          <button class="info-card-action" onclick="alert('지도로 이동합니다')">
            <span>위치</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  },

  /**
   * 가격 정보 카드 (테이블링 스타일)
   */
  renderPriceCard(store) {
    // 더미 데이터: 메뉴 기반 평균 가격 범위 계산
    let priceRange = '5,000~15,000원';
    
    if (store?.menu && Array.isArray(store.menu) && store.menu.length > 0) {
      const prices = store.menu.map(item => item.price || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        priceRange = `${(minPrice / 1000).toFixed(1)}~${(maxPrice / 1000).toFixed(1)}만원`;
      }
    }

    return `
      <div class="info-card price-card">
        <div class="info-card-icon">💰</div>
        <div class="info-card-content">
          <div class="info-card-label">점심, 저녁 동일가</div>
          <div class="info-card-value">${priceRange}</div>
        </div>
      </div>
    `;
  },

  /**
   * 영업시간 카드 (테이블링 스타일)
   */
  renderHoursCard(hours) {
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const todayName = dayNames[today.getDay()];
    
    let hoursText = '11:00 ~ 22:00'; // 기본값
    
    if (hours) {
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      hoursText = isWeekend ? (hours.weekend || hours.weekday) : hours.weekday;
    }

    return `
      <div class="info-card hours-card">
        <div class="info-card-icon">⏰</div>
        <div class="info-card-content">
          <div class="info-card-label">오늘 (${todayName})</div>
          <div class="info-card-value">${hoursText}</div>
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
      <div class="notices-section">
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
        <div class="notice-header">
          <div class="notice-title-wrapper">
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
          background: #ffffff;
          padding: 0;
          margin: 0;
        }

        /* 이벤트 뱃지 */
        .store-badge-section {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .event-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          color: white;
          font-size: 12px;
          font-weight: 700;
          border-radius: 4px;
          letter-spacing: -0.3px;
        }

        .event-badge.new {
          background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
        }

        /* 카테고리 경로 (breadcrumb) */
        .store-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #8e8e93;
        }

        .breadcrumb-item {
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: #c7c7cc;
          font-weight: 300;
        }

        /* 매장명 강조 */
        .store-name-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .store-main-title {
          font-size: 24px;
          font-weight: 800;
          color: #000000;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.5px;
          flex: 1;
        }

        .favorite-btn-v2 {
          width: 36px;
          height: 36px;
          border: none;
          background: #f2f2f7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ff3b30;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .favorite-btn-v2:active {
          background: #e5e5ea;
          transform: scale(0.95);
        }

        .favorite-btn-v2.active {
          background: #ff3b30;
          color: white;
        }

        /* 별점 강조 영역 */
        .rating-emphasis-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .rating-display {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .star-icon {
          font-size: 20px;
          line-height: 1;
        }

        .rating-score {
          font-size: 20px;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.5px;
        }

        .rating-divider {
          font-size: 16px;
          color: #c7c7cc;
          font-weight: 300;
          margin: 0 2px;
        }

        .rating-max {
          font-size: 16px;
          color: #8e8e93;
          font-weight: 500;
        }

        .review-count-link {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #007aff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .review-count-link:active {
          background: #f2f2f7;
        }

        .chevron-icon {
          font-size: 18px;
          font-weight: 300;
        }

        /* 한줄 소개 (감성적) */
        .store-catchphrase {
          font-size: 15px;
          color: #3c3c43;
          line-height: 1.5;
          margin-bottom: 20px;
          font-weight: 400;
          letter-spacing: -0.3px;
        }

        /* 핵심 정보 카드 그리드 */
        .key-info-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f2f2f7;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .info-card:active {
          background: #e5e5ea;
        }

        .info-card-icon {
          font-size: 20px;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }

        .info-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-card-label {
          font-size: 13px;
          color: #8e8e93;
          font-weight: 500;
        }

        .info-card-value {
          font-size: 15px;
          color: #000000;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .info-card-action {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #007aff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
          margin-top: 2px;
        }

        .location-card .info-card-content {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }

        /* 반응형 */
        @media (max-width: 380px) {
          .store-main-title {
            font-size: 22px;
          }

          .rating-score {
            font-size: 18px;
          }

          .store-catchphrase {
            font-size: 14px;
          }
        }

        /* 평점 섹션 */
        .info-rating-section {
          padding: 20px;
          background: #ffffff;
          border-bottom: 8px solid #f8fafc;
        }

        .rating-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rating-star {
          font-size: 18px;
          color: #fbbf24;
          filter: drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3));
        }

        .rating-value {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .rating-reviews {
          font-size: 15px;
          color: #6b7280;
          font-weight: 600;
          margin-left: 4px;
        }

        /* 상세 정보 리스트 */
        .info-detail-list {
          background: #ffffff;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 10px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s ease;
        }

        .info-item.clickable:active {
          background: #f8fafc;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .info-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .info-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .distance-badge {
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .primary-text {
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .info-text {
          font-size: 15px;
          color: #374151;
          font-weight: 500;
          letter-spacing: -0.2px;
          line-height: 1.5;
        }

        .info-subtext {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        .info-link-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #3b82f6;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .info-link-btn:active {
          background: #eff6ff;
          transform: scale(0.96);
        }

        .info-link-btn .chevron {
          font-size: 16px;
          font-weight: 600;
        }

        .info-chevron-btn {
          background: none;
          border: none;
          font-size: 18px;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s ease;
        }

        .info-chevron-btn:active {
          color: #6b7280;
        }

        /* 공지사항 섹션 */
        .notices-section {
          background: #ffffff;
          padding-bottom: 10px;
          margin-top: 8px;
          border-top: 2px solid #f8fafc;
        }

        .notices-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .notices-icon {
          font-size: 22px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .notices-title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
        }

        .notices-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* 공지사항 카드 */
        .notice-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px 18px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .notice-card:active {
          background: #f1f5f9;
          transform: scale(0.98);
        }

        .notice-card.notice-important {
          background: linear-gradient(135deg, #fef2f2 0%, #fefefe 100%);
          border-color: #fecaca;
        }

        .notice-card.notice-event {
          background: linear-gradient(135deg, #eff6ff 0%, #fefefe 100%);
          border-color: #bfdbfe;
        }

        .notice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          gap: 12px;
        }

        .notice-title-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .notice-icon {
          font-size: 20px;
          flex-shrink: 0;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .notice-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          line-height: 1.4;
          letter-spacing: -0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .new-badge {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
        }

        .notice-date {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
          flex-shrink: 0;
        }

        .notice-content {
          margin: 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          word-break: keep-all;
          letter-spacing: -0.2px;
        }

        /* 반응형 */
        @media (max-width: 380px) {
          .info-rating-section {
            padding: 16px;
          }

          .info-item {
            padding: 16px;
          }

          .notices-section {
            padding: 20px 16px;
          }

          .notice-card {
            padding: 14px 16px;
          }
        }

        /* 다크모드 대응 (선택사항) */
        @media (prefers-color-scheme: dark) {
          .native-store-info-container {
            background: #1f2937;
          }

          .info-rating-section,
          .info-detail-list,
          .notices-section {
            background: #1f2937;
            border-color: #374151;
          }

          .info-item {
            border-color: #374151;
          }

          .rating-value,
          .primary-text,
          .notices-title,
          .notice-title {
            color: #f9fafb;
          }

          .rating-reviews,
          .info-text {
            color: #d1d5db;
          }

          .info-subtext,
          .notice-date {
            color: #9ca3af;
          }

          .notice-card {
            background: #374151;
            border-color: #4b5563;
          }

          .notice-content {
            color: #d1d5db;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeAdditionalInfoHTML = storeAdditionalInfoHTML;

console.log('✅ storeAdditionalInfoHTML 모듈 로드 완료 (네이티브 앱 스타일)');
