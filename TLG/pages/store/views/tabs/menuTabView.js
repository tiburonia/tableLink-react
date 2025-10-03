
/**
 * 홈 탭 뷰 - UI 렌더링
 */

export const homeTabView = {
  /**
   * 홈 탭 렌더링
   */
  render(store) {
    return `
      <div class="home-tab-container">
        ${this.renderStoreHours()}
        ${this.renderTableStatus()}
        ${this.renderFacilities()}
        ${this.renderMenu(store)}
        ${this.renderReviewPreview()}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 영업시간 섹션 (더미 데이터)
   */
  renderStoreHours() {
    const hours = [
      { day: '월요일', time: '10:00 - 22:00', isToday: false },
      { day: '화요일', time: '10:00 - 22:00', isToday: false },
      { day: '수요일', time: '10:00 - 22:00', isToday: true },
      { day: '목요일', time: '10:00 - 22:00', isToday: false },
      { day: '금요일', time: '10:00 - 23:00', isToday: false },
      { day: '토요일', time: '10:00 - 23:00', isToday: false },
      { day: '일요일', time: '11:00 - 21:00', isToday: false }
    ];

    return `
      <section class="home-section store-hours-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🕐</span>
            영업시간
          </h3>
        </div>
        <div class="hours-list">
          ${hours.map(h => `
            <div class="hour-item ${h.isToday ? 'today' : ''}">
              <span class="day-label">${h.day}</span>
              <span class="time-label">${h.time}</span>
            </div>
          `).join('')}
        </div>
        <div class="hours-notice">
          <span class="notice-icon">ℹ️</span>
          <span class="notice-text">공휴일은 영업시간이 변경될 수 있습니다</span>
        </div>
      </section>
    `;
  },

  /**
   * 테이블 상태 섹션 (기존 모듈 활용)
   */
  renderTableStatus() {
    return `
      <section class="home-section table-status-section" id="home-table-status">
        <!-- tableStatusHTML 모듈이 여기에 삽입됩니다 -->
      </section>
    `;
  },

  /**
   * 시설정보 섹션 (더미 데이터)
   */
  renderFacilities() {
    const facilities = [
      { icon: '🅿️', name: '주차', available: true },
      { icon: '🚻', name: '화장실', available: true },
      { icon: '♿', name: '장애인 편의', available: true },
      { icon: '🍼', name: '유아시설', available: false },
      { icon: '📶', name: 'WiFi', available: true },
      { icon: '🔌', name: '콘센트', available: true }
    ];

    return `
      <section class="home-section facilities-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            편의시설
          </h3>
        </div>
        <div class="facilities-grid">
          ${facilities.map(f => `
            <div class="facility-item ${f.available ? 'available' : 'unavailable'}">
              <span class="facility-icon">${f.icon}</span>
              <span class="facility-name">${f.name}</span>
              <span class="facility-status">${f.available ? '✓' : '✗'}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 메뉴 섹션 (실제 데이터)
   */
  renderMenu(store) {
    if (!store.menu || store.menu.length === 0) {
      return `
        <section class="home-section menu-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">🍽️</span>
              메뉴
            </h3>
          </div>
          <div class="empty-menu">
            <span class="empty-icon">📋</span>
            <p class="empty-text">등록된 메뉴가 없습니다</p>
          </div>
        </section>
      `;
    }

    return `
      <section class="home-section menu-section" id="home-menu-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🍽️</span>
            메뉴
          </h3>
        </div>
        <!-- menuHTML 모듈이 여기에 삽입됩니다 -->
      </section>
    `;
  },

  /**
   * 리뷰 프리뷰 섹션
   */
  renderReviewPreview() {
    return `
      <section class="home-section review-preview-section" id="home-review-preview">
        <!-- reviewPreviewHTML 모듈이 여기에 삽입됩니다 -->
      </section>
    `;
  },

  /**
   * 스타일 정의
   */
  getStyles() {
    return `
      <style>
        .home-tab-container {
          padding: 0;
          background: #f8f9fa;
        }

        .home-section {
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

        /* 영업시간 스타일 */
        .hours-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hour-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          transition: background 0.2s;
        }

        .hour-item.today {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
        }

        .day-label {
          font-size: 14px;
          font-weight: 500;
        }

        .time-label {
          font-size: 14px;
          font-weight: 600;
        }

        .hours-notice {
          margin-top: 12px;
          padding: 10px;
          background: #fff3cd;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notice-icon {
          font-size: 16px;
        }

        .notice-text {
          font-size: 12px;
          color: #856404;
        }

        /* 시설정보 스타일 */
        .facilities-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .facility-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 8px;
          border-radius: 12px;
          background: #f8f9fa;
          transition: all 0.2s;
        }

        .facility-item.available {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        }

        .facility-item.unavailable {
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

        .facility-status {
          font-size: 14px;
          font-weight: 700;
        }

        .facility-item.available .facility-status {
          color: #22c55e;
        }

        .facility-item.unavailable .facility-status {
          color: #ef4444;
        }

        /* 메뉴 섹션 스타일 */
        .empty-menu {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .empty-text {
          margin: 0;
          font-size: 14px;
          color: #94a3b8;
        }

        /* 테이블 상태 및 리뷰 섹션은 기존 모듈의 스타일 사용 */
        .table-status-section,
        .review-preview-section {
          padding: 0;
          background: transparent;
          box-shadow: none;
        }

        @media (max-width: 480px) {
          .facilities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.homeTabView = homeTabView;

console.log('✅ homeTabView 모듈 로드 완료');
