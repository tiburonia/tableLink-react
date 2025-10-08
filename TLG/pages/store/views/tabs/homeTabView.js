

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
        <!-- 요일별 대기시간 통계 $ {this.renderWaitingTimes()} -->
        ${this.renderTableStatus()}
        ${this.renderFacilities(store)}
        ${this.renderMenu(store)}
        ${this.renderLocationInfo(store)}
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
   * 시설정보 섹션 - 네이티브 앱 스타일
   */
  renderFacilities(store) {
    const amenitiesData = store.amenities || {};

    const amenityConfig = {
      wifi: { 
        icon: '📶',
        name: 'WiFi',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      parking: { 
        icon: '🅿️',
        name: '주차',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      pet_friendly: { 
        icon: '🐾',
        name: '반려동물',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      power_outlet: { 
        icon: '🔌',
        name: '콘센트',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      },
      smoking_area: { 
        icon: '🚬',
        name: '흡연구역',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      }
    };

    // 객체를 배열로 변환하고 available이 true인 항목만 필터링
    const amenitiesArray = Object.keys(amenityConfig)
      .map(key => ({
        name: amenityConfig[key].name,
        icon: amenityConfig[key].icon,
        color: amenityConfig[key].color,
        available: amenitiesData[key] === true
      }))
      .filter(a => a.available === true);

    // 편의시설이 없는 경우 섹션 숨김
    if (amenitiesArray.length === 0) {
      return '';
    }

    return `
      <section class="home-section facilities-section-native">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            편의시설
          </h3>
          <div class="facilities-count-badge">
            ${amenitiesArray.length}개
          </div>
        </div>
        <div class="facilities-grid-native">
          ${amenitiesArray.map((a, index) => `
            <div class="facility-card-native" style="animation-delay: ${index * 0.1}s;">
              <div class="facility-icon-wrapper" style="background: ${a.color};">
                <span class="facility-icon-native">${a.icon}</span>
              </div>
              <span class="facility-name-native">${a.name}</span>
              <div class="facility-check-badge">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
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
   * 위치정보 섹션 (네이버 지도 스타일)
   */
  renderLocationInfo(store) {
    const address = store.address || '주소 정보 없음';
    const lat = store.latitude || 37.5665;
    const lng = store.longitude || 126.9780;

    // 네이버 지도 Static Map API URL
    const mapImageUrl = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=570&h=200&center=${lng},${lat}&level=16&markers=type:d|size:mid|pos:${lng}%20${lat}&X-NCP-APIGW-API-KEY-ID=ejmti6owy5`;

    return `
      <section class="home-section location-info-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📍</span>
            위치정보
          </h3>
        </div>

        <div class="location-map-container">
          <div class="naver-map-wrapper">
            <img src="${mapImageUrl}" alt="매장 위치" class="location-map-image" />
            <div class="map-overlay">
              <button class="map-expand-btn" onclick="window.open('https://map.naver.com/p/search/${encodeURIComponent(address)}', '_blank')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="location-address-section">
          <div class="address-text">${address}</div>
          <button class="address-copy-btn" onclick="navigator.clipboard.writeText('${address}').then(() => alert('주소가 복사되었습니다'))">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            주소복사
          </button>
        </div>
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
          background: white;
        }

        .home-section {
          background: white;
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 0;
        }

        .home-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .home-section:hover::before {
          opacity: 1;
        }

       

        .section-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          position: relative;
        }

        .section-header::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 2px;
        }

        .section-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.5px;
        }

        .section-icon {
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.1));
        }

        /* 요일별 대기시간 스타일 */
        .waiting-times-section {
          padding: 24px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
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

        /* 네이티브 앱 스타일 편의시설 */
        .facilities-section-native {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
        }

        .facilities-section-native .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
        }

        .facilities-count-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .facilities-grid-native {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 12px;
        }

        .facility-card-native {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: facilityFadeIn 0.5s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes facilityFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .facility-card-native:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: transparent;
        }

        .facility-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        .facility-icon-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
          border-radius: 14px 14px 0 0;
        }

        .facility-icon-native {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          position: relative;
          z-index: 1;
        }

        .facility-name-native {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          text-align: center;
          line-height: 1.2;
          margin-top: 4px;
        }

        .facility-check-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          animation: checkPulse 2s ease-in-out infinite;
        }

        @keyframes checkPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
          }
        }

        /* 레거시 스타일 (하위 호환성) */
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
          color: #22c55e;
        }

        /* 메뉴 섹션 스타일 */
        .empty-menu {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          gap: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }

        .empty-icon {
          font-size: 56px;
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .empty-text {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: -0.3px;
        }

        /* 테이블 상태 및 리뷰 섹션 */
        .table-status-section,
        .review-preview-section {
          padding: 0px;
         
        }

        .table-status-section {
          margin-top: 12px;
        }

        @media (max-width: 480px) {
          .home-section {
            margin: 0 12px 12px 12px;
            padding: 20px 16px;
            border-radius: 16px;
          }

          .section-header {
            margin-bottom: 16px;
            padding-bottom: 12px;
          }

          .section-title {
            font-size: 17px;
          }

          .section-icon {
            font-size: 20px;
            width: 28px;
            height: 28px;
          }

          .facilities-grid-native {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .facility-card-native {
            padding: 14px 10px;
          }

          .facility-icon-wrapper {
            width: 40px;
            height: 40px;
          }

          .facility-icon-native {
            font-size: 20px;
          }

          .facility-name-native {
            font-size: 12px;
          }

          .facility-check-badge {
            width: 18px;
            height: 18px;
          }

          /* 레거시 */
          .facilities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 360px) {
          .home-section {
            margin: 0 8px 10px 8px;
            padding: 18px 14px;
            border-radius: 14px;
          }

          .section-header {
            margin-bottom: 14px;
          }

          .section-title {
            font-size: 16px;
          }

          .section-icon {
            font-size: 18px;
            width: 26px;
            height: 26px;
          }

          .facilities-grid-native {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .facility-card-native {
            padding: 12px 8px;
          }

          .facilities-count-badge {
            font-size: 11px;
            padding: 3px 10px;
          }
        }

        /* 위치정보 섹션 스타일 */
        .location-info-section {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
        }

        .location-map-container {
          margin-bottom: 16px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .naver-map-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          background: #f8f9fa;
        }

        .location-map-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .map-expand-btn {
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .map-expand-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: scale(1.05);
        }

        .map-expand-btn svg {
          color: #64748b;
        }

        .location-address-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .address-text {
          flex: 1;
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.5;
        }

        .address-copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .address-copy-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .address-copy-btn svg {
          color: #64748b;
        }

        @media (max-width: 480px) {
          .location-address-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .address-copy-btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.homeTabView = homeTabView;

console.log('✅ homeTabView 모듈 로드 완료');
