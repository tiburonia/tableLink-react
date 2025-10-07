

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
        ${this.renderWaitingTimes()}
        ${this.renderTableStatus()}
        ${this.renderFacilities(store)}
        ${this.renderMenu(store)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 요일별 대기시간 통계
   */
  renderWaitingTimes() {
    // 요일별 더미 데이터
    const weeklyData = {
      "월": [ { hour:"12시", value:40 }, { hour:"13시", value:30 }, { hour:"14시", value:20 }, { hour:"15시", value:10 } ],
      "화": [ { hour:"12시", value:59 }, { hour:"13시", value:39 }, { hour:"14시", value:31 }, { hour:"15시", value:22 }, { hour:"16시", value:23 }, { hour:"17시", value:18 }, { hour:"18시", value:15 }, { hour:"19시", value:1 }, { hour:"20시", value:0 } ],
      "수": [ { hour:"12시", value:20 }, { hour:"13시", value:10 }, { hour:"14시", value:15 }, { hour:"15시", value:5 } ],
      "목": [ { hour:"12시", value:25 }, { hour:"13시", value:30 }, { hour:"14시", value:18 }, { hour:"15시", value:8 } ],
      "금": [ { hour:"12시", value:50 }, { hour:"13시", value:45 }, { hour:"14시", value:40 }, { hour:"15시", value:35 } ],
      "토": [ { hour:"12시", value:70 }, { hour:"13시", value:60 }, { hour:"14시", value:50 }, { hour:"15시", value:40 } ],
      "일": [ { hour:"12시", value:10 }, { hour:"13시", value:15 }, { hour:"14시", value:20 }, { hour:"15시", value:5 } ],
    };

    // 초기 선택 요일 (화요일)
    const initialDay = "화";
    const maxValue = Math.max(...weeklyData[initialDay].map(d => d.value));

    const barsHTML = weeklyData[initialDay].map(d => {
      const barHeight = (d.value / maxValue) * 120;
      return `
        <div class="waiting-bar">
          <div class="value-label">${d.value}분</div>
          <div class="bar" style="height:${barHeight}px"></div>
          <div class="time-label">${d.hour}</div>
        </div>
      `;
    }).join("");

    // 이벤트 리스너를 DOM 로드 후 설정
    setTimeout(() => {
      this.initWaitingTimesEvents(weeklyData);
    }, 0);

    return `
      <section class="home-section waiting-times-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">⏰</span>
            요일별 대기시간
          </h3>
          <div class="waiting-info">
            <span class="info-badge">실시간 업데이트</span>
          </div>
        </div>

        <!-- 요일 선택 네비게이션 -->
        <nav class="day-nav">
          ${Object.keys(weeklyData).map(day => `
            <button class="day-btn ${day === initialDay ? 'active' : ''}" data-day="${day}">
              <span class="day-text">${day}</span>
            </button>
          `).join("")}
        </nav>

        <!-- 그래프 -->
        <div class="waiting-times-container" style="overflow-x: scroll;">
          <div id="waitingTimesGrid" class="waiting-times-grid">
            ${barsHTML}
          </div>
        </div>

        <!-- 안내 문구 -->
        <div class="waiting-notice">
          <span class="notice-icon">💡</span>
          <span class="waiting-notice-text">시간대별 평균 대기시간입니다</span>
        </div>
      </section>
    `;
  },

  /**
   * 대기시간 이벤트 초기화
   */
  initWaitingTimesEvents(weeklyData) {
    const grid = document.getElementById("waitingTimesGrid");
    const buttons = document.querySelectorAll(".day-btn");

    if (!grid || buttons.length === 0) {
      console.warn('⚠️ 대기시간 요소를 찾을 수 없습니다');
      return;
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        // 모든 버튼 비활성화
        buttons.forEach(b => b.classList.remove("active"));
        
        // 클릭한 버튼 활성화
        btn.classList.add("active");
        
        const day = btn.dataset.day;
        const dayData = weeklyData[day];
        
        if (!dayData) return;

        const maxValue = Math.max(...dayData.map(d => d.value));

        // 애니메이션을 위해 그리드를 비우고 재렌더링
        grid.style.opacity = '0';
        
        setTimeout(() => {
          grid.innerHTML = dayData.map(d => {
            const barHeight = (d.value / maxValue) * 120;
            return `
              <div class="waiting-bar">
                <div class="value-label">${d.value}분</div>
                <div class="bar" style="height:${barHeight}px"></div>
                <div class="time-label">${d.hour}</div>
              </div>
            `;
          }).join("");
          
          grid.style.opacity = '1';
        }, 150);
      });
    });
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
   * 시설정보 섹션
   */
  renderFacilities(store) {
    const amenitiesData = store.amenities || {};

    const amenityConfig = {
      wifi: { icon:
        '<img width="48" height="48" src="https://img.icons8.com/glyph-neue/48/wifi--v1.png" alt="wifi--v1"/>',
             name: 'WiFi' },
      parking: { icon: '<img width="48" height="48" src="https://img.icons8.com/pulsar-line/48/outdoor-parking.png" alt="outdoor-parking"/>', name: '주차' },
      pet_friendly: { icon: '<img width="48" height="48" src="https://img.icons8.com/ios-filled/48/dog--v1.png" alt="dog--v1"/>', name: '반려동물' },
      power_outlet: { icon:  '<img width="48" height="48" src="https://img.icons8.com/external-dreamstale-lineal-dreamstale/48/external-socket-ecology-dreamstale-lineal-dreamstale-1.png" alt="external-socket-ecology-dreamstale-lineal-dreamstale-1"/>', name: '콘센트' },
      smoking_area: { icon:  '<img width="48" height="48" src="https://img.icons8.com/sf-regular/48/smoking.png" alt="smoking"/>', name: '흡연구역' }
    };

    // 객체를 배열로 변환하고 available이 true인 항목만 필터링
    const amenitiesArray = Object.keys(amenityConfig)
      .map(key => ({
        name: amenityConfig[key].name,
        icon: amenityConfig[key].icon,
        available: amenitiesData[key] === true
      }))
      .filter(a => a.available === true);

    // 편의시설이 없는 경우 섹션 숨김
    if (amenitiesArray.length === 0) {
      return '';
    }

    return `
      <section class="home-section facilities-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            편의시설
          </h3>
        </div>
        <div class="facilities-grid">
          ${amenitiesArray.map(a => `
            <div class="facility-item available">
              <span class="facility-icon">${a.icon}</span>
              <span class="facility-name">${a.name}</span>
              <span class="facility-status">✓</span>
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

        /* 요일별 대기시간 스타일 */
        .waiting-times-section {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
        }

        .waiting-times-section .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .waiting-info {
          display: flex;
          gap: 8px;
        }

        .info-badge {
          padding: 4px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .day-nav {
          display: flex;
          gap: 8px;
          margin: 16px 0 24px;
          overflow-x: scroll;
          padding: 4px 0;
          scrollbar-width: none;
        }

        .day-nav::-webkit-scrollbar {
          display: none;
        }

        .day-btn {
          flex: 1;
          min-width: 46px;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #6b7280;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .day-btn:hover {
          border-color: #c7d2fe;
          background: #f5f7ff;
          transform: translateY(-2px);
        }

        .day-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
        }

        .day-text {
          display: block;
        }

        .waiting-times-container {
          position: relative;
          margin: 20px 0;
        }

        .waiting-times-grid {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 180px;
          padding: 20px 12px 12px;
          background: linear-gradient(to top, #f8f9fa 0%, transparent 100%);
          border-radius: 12px;
          transition: opacity 0.3s ease;
        }

        .waiting-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          min-width: 40px;
        }

        .value-label {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          padding: 2px 6px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          white-space: nowrap;
        }

        .bar {
          width: 100%;
          max-width: 32px;
          min-height: 4px;
          border-radius: 8px 8px 4px 4px;
          background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
          transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 4px 8px rgba(96, 165, 250, 0.3);
        }

        .bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
          border-radius: 8px 8px 0 0;
        }

        .time-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-top: 4px;
        }

        .waiting-notice {
          margin-top: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .waiting-notice-icon {
          font-size: 18px;
        }

        .waiting-notice-text {
          font-size: 13px;
          color: #78350f;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .waiting-times-grid {
            gap: 6px;
            padding: 20px 8px 12px;
          }

          .value-label {
            font-size: 11px;
            padding: 2px 4px;
          }

          .time-label {
            font-size: 10px;
          }

          .day-btn {
            min-width: 42px;
            padding: 8px 10px;
            font-size: 14px;
          }
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
