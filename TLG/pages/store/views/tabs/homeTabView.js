

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
        ${this.renderReservationSection(store)}
        ${this.renderAmenities(store)} <!-- 편의시설 섹션 삭제 예정 -->
        ${this.renderPromotionSection(store)}
        ${this.renderTableStatus()}
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
   * 예약 섹션
   */
  renderReservationSection(store) {
    // 오늘부터 5일간의 날짜 생성
    const today = new Date();
    const availableDates = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = dayNames[date.getDay()];
      
      availableDates.push({
        date: `${month}.${day}`,
        dayOfWeek: `(${dayOfWeek})`,
        fullDate: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }

    // 예약 섹션 렌더링 후 이벤트 리스너 설정
    setTimeout(() => {
      this.initReservationEvents(store);
    }, 0);

    return `
      <section class="home-section reservation-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📅</span>
            예약
          </h3>
        </div>

        <!-- 날짜/인원/시간 선택 -->
        <div class="reservation-selector-container">
          <button class="reservation-selector-btn" id="reservationSelectorBtn">
            <span class="selector-icon">📅</span>
            <span class="selector-text">날짜 · 인원 · 시간</span>
            <span class="selector-arrow">›</span>
          </button>
        </div>

        <!-- 예약 가능 날짜 -->
        <div class="reservation-dates-container">
          ${availableDates.map(dateInfo => `
            <button class="reservation-date-card ${dateInfo.isToday ? 'today' : ''}" 
                    data-date="${dateInfo.fullDate}">
              <div class="date-label">
                <span class="date-day">${dateInfo.isToday ? '오늘' : dateInfo.dayOfWeek.replace(/[()]/g, '')}</span>
                <span class="date-number">${dateInfo.date}</span>
              </div>
              <div class="availability-status">예약 가능</div>
            </button>
          `).join('')}
        </div>

        <!-- 예약 가능 날짜 찾기 버튼 -->
        <button class="find-reservation-btn" id="findReservationBtn">
          예약 가능 날짜 찾기
        </button>
      </section>
    `;
  },

  /**
   * 예약 이벤트 초기화
   */
  initReservationEvents(store) {
    const selectorBtn = document.getElementById('reservationSelectorBtn');
    const findBtn = document.getElementById('findReservationBtn');
    const dateCards = document.querySelectorAll('.reservation-date-card');

    if (selectorBtn) {
      selectorBtn.addEventListener('click', () => {
        console.log('📅 날짜/인원/시간 선택 모달 열기');
        // TODO: 예약 상세 설정 모달 구현
        alert('예약 설정 모달 (구현 예정)');
      });
    }

    if (findBtn) {
      findBtn.addEventListener('click', () => {
        console.log('🔍 예약 가능 날짜 찾기');
        // TODO: 예약 가능 날짜 검색 기능 구현
        alert('예약 가능 날짜 검색 (구현 예정)');
      });
    }

    dateCards.forEach(card => {
      card.addEventListener('click', () => {
        const selectedDate = card.dataset.date;
        console.log('📅 선택된 날짜:', selectedDate);
        
        // 선택 상태 토글
        dateCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        // TODO: 예약 시간 선택 단계로 이동
        alert(`${selectedDate} 예약 시간 선택 (구현 예정)`);
      });
    });
  },

  /**
   * 편의시설 섹션
   */
  renderAmenities(store) {
    const amenitiesData = store.amenities || {};

    // 편의시설 아이콘 매핑
    const amenityConfig = {
      wifi: { 
        icon: '<img width="24" height="24" src="https://img.icons8.com/ios-filled/24/wifi--v1.png" alt="wifi--v1"/>',
        name: '무선 인터넷'
      },
      parking: { 
        icon: '<img width="24" height="24" src="https://img.icons8.com/ios-filled/24/parking.png" alt="parking"/>',
        name: '주차 이용 가능'
      },
      pet_friendly: { 
        icon: '<img width="24" height="24" src="https://img.icons8.com/ios-filled/24/cat-footprint.png" alt="cat-footprint"/>',
        name: '반려 화장실 구비'
      },
      power_outlet: { 
        icon: '<img width="24" height="24" src="https://img.icons8.com/sf-black-filled/24/electrical.png" alt="electrical"/>',
        name: '콘센트 구비'
      },
      smoking_area: { 
        icon: '<img width="24" height="24" src="https://img.icons8.com/forma-bold-filled/24/cigar.png" alt="cigar"/>',
        name: '흡연구역'
      }
    };

    // available이 true인 항목만 필터링
    const availableAmenities = Object.keys(amenityConfig)
      .filter(key => amenitiesData[key] === true)
      .map(key => ({
        icon: amenityConfig[key].icon,
        name: amenityConfig[key].name
      }));

    // 편의시설이 없으면 섹션 숨김
    if (availableAmenities.length === 0) {
      return '';
    }

    return `
      <section class="home-section amenities-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏪</span>
            편의시설
          </h3>
        </div>
        <div class="amenities-grid">
          ${availableAmenities.map(amenity => `
            <div class="amenity-card">
              <div class="amenity-icon">${amenity.icon}</div>
              <div class="amenity-name">${amenity.name}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 프로모션 섹션
   */
  renderPromotionSection(store) {
    // 프로모션 데이터 (쿠폰 + 할인 이벤트)
    const promotions = store.promotions || [];
    
    if (promotions.length === 0) {
      return '';
    }

    // 쿠폰과 할인 이벤트 분류
    const coupons = promotions.filter(p => p.type === '쿠폰');
    const discounts = promotions.filter(p => p.type === '할인');

    // 프로모션 이벤트 리스너 설정
    setTimeout(() => {
      this.initPromotionEvents(store);
    }, 0);

    return `
      <section class="home-section promotion-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🎁</span>
            혜택 & 프로모션
          </h3>
          <button class="view-all-promotions-btn" id="viewAllPromotionsBtn">
            전체보기
          </button>
        </div>

        <!-- 진행중인 쿠폰 -->
        ${coupons.length > 0 ? `
          <div class="promotion-category">
            <div class="category-header">
              <span class="category-icon">🎫</span>
              <h4 class="category-title">발급 가능한 쿠폰</h4>
            </div>
            <div class="coupons-container">
              ${coupons.slice(0, 3).map(coupon => `
                <div class="coupon-card" data-promo-id="${coupon.id}">
                  <div class="coupon-badge">${coupon.discountRate}</div>
                  <div class="coupon-info">
                    <div class="coupon-name">${coupon.name}</div>
                    <div class="coupon-desc">${coupon.description}</div>
                    <div class="coupon-condition">최소 주문 ${coupon.minOrderAmount}</div>
                  </div>
                  <button class="coupon-download-btn">
                    <span>받기</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 진행중인 할인 이벤트 -->
        ${discounts.length > 0 ? `
          <div class="promotion-category">
            <div class="category-header">
              <span class="category-icon">💰</span>
              <h4 class="category-title">할인 이벤트</h4>
            </div>
            <div class="discounts-container">
              ${discounts.slice(0, 3).map(discount => `
                <div class="discount-card" data-promo-id="${discount.id}">
                  <div class="discount-header">
                    <div class="discount-badge">${discount.discountRate}</div>
                    <div class="discount-period">
                      ${new Date(discount.startDate).toLocaleDateString()} ~ ${new Date(discount.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div class="discount-name">${discount.name}</div>
                  <div class="discount-desc">${discount.description}</div>
                  <div class="discount-details">
                    <span class="detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      ${discount.minOrderAmount}
                    </span>
                    <span class="detail-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M2 12h20"></path>
                      </svg>
                      최대 ${discount.maxDiscount}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    `;
  },

  /**
   * 프로모션 이벤트 초기화
   */
  initPromotionEvents(store) {
    const viewAllBtn = document.getElementById('viewAllPromotionsBtn');
    const couponCards = document.querySelectorAll('.coupon-card');
    const discountCards = document.querySelectorAll('.discount-card');

    // 전체보기 버튼
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        console.log('🎁 프로모션 전체보기');
        if (typeof renderPromotionDetail === 'function') {
          renderPromotionDetail(store);
        } else {
          alert('프로모션 상세 페이지를 준비중입니다.');
        }
      });
    }

    // 쿠폰 다운로드 버튼
    couponCards.forEach(card => {
      const downloadBtn = card.querySelector('.coupon-download-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const promoId = card.dataset.promoId;
          console.log('🎫 쿠폰 다운로드:', promoId);
          
          // TODO: 실제 쿠폰 다운로드 API 호출
          downloadBtn.innerHTML = '<span>✓ 발급완료</span>';
          downloadBtn.classList.add('downloaded');
          downloadBtn.disabled = true;
        });
      }
    });

    // 할인 카드 클릭
    discountCards.forEach(card => {
      card.addEventListener('click', () => {
        const promoId = card.dataset.promoId;
        console.log('💰 할인 이벤트 상세:', promoId);
        // TODO: 할인 이벤트 상세 모달
        alert('할인 이벤트 상세 정보 (구현 예정)');
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

        /* 예약 섹션 스타일 */
        .reservation-section {
          padding: 24px 20px;
          background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
        }

        .reservation-selector-container {
          margin: 16px 0 20px;
        }

        .reservation-selector-btn {
          width: 100%;
          padding: 16px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reservation-selector-btn:hover {
          border-color: #667eea;
          background: #f5f7ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .selector-icon {
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 10px;
        }

        .selector-text {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          text-align: left;
        }

        .selector-arrow {
          font-size: 20px;
          color: #9ca3af;
          font-weight: 300;
        }

        .reservation-dates-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 16px;
          scrollbar-width: none;
        }

        .reservation-dates-container::-webkit-scrollbar {
          display: none;
        }

        .reservation-date-card {
          flex-shrink: 0;
          min-width: 85px;
          padding: 14px 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reservation-date-card:hover {
          border-color: #c7d2fe;
          background: #f5f7ff;
          transform: translateY(-2px);
        }

        .reservation-date-card.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
        }

        .reservation-date-card.selected .date-day,
        .reservation-date-card.selected .date-number,
        .reservation-date-card.selected .availability-status {
          color: white;
        }

        .reservation-date-card.today {
          border-color: #fbbf24;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        .date-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .date-day {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .date-number {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
        }

        .availability-status {
          font-size: 11px;
          font-weight: 500;
          color: #10b981;
          text-align: center;
        }

        .find-reservation-btn {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .find-reservation-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .find-reservation-btn:active {
          transform: translateY(0);
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

        /* 프로모션 섹션 스타일 */
        .promotion-section {
          padding: 24px 20px;
          background: white;
        }

        .view-all-promotions-btn {
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-promotions-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #374151;
        }

        .promotion-category {
          margin-bottom: 24px;
        }

        .promotion-category:last-child {
          margin-bottom: 0;
        }

        .category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .category-icon {
          font-size: 18px;
        }

        .category-title {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        /* 쿠폰 카드 */
        .coupons-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .coupon-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px dashed #f59e0b;
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .coupon-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }

        .coupon-badge {
          min-width: 60px;
          padding: 10px 12px;
          background: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 800;
          color: #f59e0b;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .coupon-info {
          flex: 1;
        }

        .coupon-name {
          font-size: 14px;
          font-weight: 700;
          color: #78350f;
          margin-bottom: 4px;
        }

        .coupon-desc {
          font-size: 12px;
          color: #92400e;
          margin-bottom: 4px;
          opacity: 0.9;
        }

        .coupon-condition {
          font-size: 11px;
          color: #b45309;
          font-weight: 600;
        }

        .coupon-download-btn {
          min-width: 60px;
          padding: 8px 16px;
          background: white;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          color: #f59e0b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .coupon-download-btn:hover {
          background: #f59e0b;
          color: white;
        }

        .coupon-download-btn.downloaded {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        /* 할인 카드 */
        .discounts-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .discount-card {
          padding: 16px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .discount-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
        }

        .discount-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .discount-badge {
          padding: 6px 12px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
        }

        .discount-period {
          font-size: 11px;
          color: #075985;
          font-weight: 600;
        }

        .discount-name {
          font-size: 15px;
          font-weight: 700;
          color: #075985;
          margin-bottom: 6px;
        }

        .discount-desc {
          font-size: 12px;
          color: #0c4a6e;
          margin-bottom: 10px;
          opacity: 0.9;
        }

        .discount-details {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #0369a1;
          font-weight: 600;
        }

        .detail-item svg {
          opacity: 0.7;
        }

        /* 편의시설 섹션 스타일 */
        .amenities-section {
          padding: 24px 20px;
          background: white;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        .amenity-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

       

        .amenity-icon {
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
        }

        .amenity-name {
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          text-align: center;
          line-height: 1.3;
        }

        @media (max-width: 480px) {
          .amenities-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .amenity-icon {
            font-size: 24px;
            width: 44px;
            height: 44px;
          }

          .amenity-name {
            font-size: 11px;
          }
        }

        @media (max-width: 360px) {
          .amenities-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .amenity-card {
            padding: 12px 6px;
          }

          .amenity-icon {
            font-size: 22px;
            width: 40px;
            height: 40px;
          }

          .amenity-name {
            font-size: 10px;
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
        }

       
      </style>
    `;
  }
};

// 전역 등록
window.homeTabView = homeTabView;

console.log('✅ homeTabView 모듈 로드 완료');
