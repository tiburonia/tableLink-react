
/**
 * 단골혜택 탭 뷰 - UI 렌더링 (네이티브 앱 스타일)
 */

export const regularTabView = {
  /**
   * 단골혜택 탭 렌더링
   */
  render(store, user) {
    return `
      <div class="regular-tab-container">
        ${this.renderMyBenefitsCard(store, user)}
        ${this.renderLoyaltyLevelSection(store)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 내 혜택 및 등급 카드 렌더링
   */
  renderMyBenefitsCard(store, user) {
    const userLevel = user?.Level || {};
    const levelName = userLevel.levelName || '브론즈';
    const benefits = userLevel.benefits || { points: 1, discount: 0 };
    const levelIcon = this.getLevelIcon(levelName);
    const levelColor = this.getLevelColor(levelName);

    return `
      <div class="my-benefits-wrapper">
        <div class="my-benefits-card" style="background: ${levelColor}">
          <div class="benefits-card-inner">
            <div class="level-badge-container">
              <div class="level-badge-large">
                <span class="level-icon-large">${levelIcon}</span>
              </div>
              <div class="level-info-main">
                <p class="current-level-label">현재 등급</p>
                <h2 class="current-level-name">${levelName}</h2>
              </div>
            </div>

            <div class="benefits-stats-grid">
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                  <p class="stat-label">포인트 적립</p>
                  <p class="stat-value">${benefits.points}%</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                  <p class="stat-label">할인 혜택</p>
                  <p class="stat-value">${benefits.discount}%</p>
                </div>
              </div>
            </div>

            <button class="detail-button" onclick="regularTabView.showBenefitDetail('${levelName}', ${JSON.stringify(benefits).replace(/"/g, '&quot;')})">
              <span>혜택 자세히 보기</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        ${this.renderProgressToNextLevel(store, user)}
      </div>
    `;
  },

  /**
   * 다음 레벨까지 진행상황 렌더링
   */
  renderProgressToNextLevel(store, user) {
    const userLevel = user?.Level || {};
    const currentLevelName = userLevel.levelName || '브론즈';
    const promotions = store.promotions || [];
    
    const levelOrder = ['브론즈', '실버', '골드', '플래티넘'];
    const currentIndex = levelOrder.indexOf(currentLevelName);
    
    if (currentIndex === levelOrder.length - 1) {
      return `
        <div class="progress-card max-level-card">
          <div class="max-level-content">
            <div class="max-level-icon">👑</div>
            <div class="max-level-text">
              <h3>최고 등급 달성!</h3>
              <p>플래티넘 등급의 모든 혜택을 누리고 계십니다</p>
            </div>
          </div>
        </div>
      `;
    }

    const nextLevelName = levelOrder[currentIndex + 1];
    const nextLevel = promotions.find(p => p.level === nextLevelName);
    
    if (!nextLevel) return '';

    const currentOrders = 3;
    const currentSpent = 35000;
    const ordersProgress = Math.min((currentOrders / nextLevel.min_orders) * 100, 100);
    const spentProgress = Math.min((currentSpent / nextLevel.min_spent) * 100, 100);

    return `
      <div class="progress-card">
        <div class="progress-header">
          <div class="progress-title">
            <span class="next-level-icon">${this.getLevelIcon(nextLevelName)}</span>
            <span>${nextLevelName} 등급까지</span>
          </div>
        </div>

        <div class="progress-items">
          <div class="progress-item">
            <div class="progress-label">
              <span class="label-text">주문 횟수</span>
              <span class="label-value">${currentOrders}/${nextLevel.min_orders}회</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${ordersProgress}%"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-label">
              <span class="label-text">누적 금액</span>
              <span class="label-value">${currentSpent.toLocaleString()}/${nextLevel.min_spent.toLocaleString()}원</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${spentProgress}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 단골 레벨 시스템 섹션 렌더링
   */
  renderLoyaltyLevelSection(store) {
    const promotions = store.promotions || [];
    
    const levelOrder = ['브론즈', '실버', '골드', '플래티넘'];
    const sortedPromotions = promotions.sort((a, b) => 
      levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
    );

    return `
      <div class="section-wrapper">
        <div class="section-header-native">
          <h3 class="section-title-native">
            <span class="section-icon-native">📊</span>
            등급 안내
          </h3>
          <p class="section-subtitle-native">주문 횟수와 누적 금액에 따라 등급이 올라갑니다</p>
        </div>

        <div class="level-cards-container">
          ${sortedPromotions.length > 0 
            ? sortedPromotions.map((promo, index) => this.renderLevelCard(promo, index)).join('')
            : `
              <div class="empty-level-state">
                <div class="empty-level-icon">🏆</div>
                <p class="empty-level-text">등록된 단골 레벨이 없습니다</p>
              </div>
            `
          }
        </div>
      </div>
    `;
  },

  /**
   * 레벨 카드 렌더링
   */
  renderLevelCard(promo, index) {
    const icon = this.getLevelIcon(promo.level);
    const color = this.getLevelColor(promo.level);
    const benefits = this.getLevelBenefits(promo.level);

    return `
      <div class="level-card-native" style="animation-delay: ${index * 0.08}s">
        <div class="level-card-header">
          <div class="level-icon-badge" style="background: ${color}">
            ${icon}
          </div>
          <div class="level-card-info">
            <h4 class="level-card-title">${promo.level}</h4>
            <p class="level-card-requirement">
              ${promo.min_orders}회 이상 · ${promo.min_spent.toLocaleString()}원 이상
            </p>
          </div>
        </div>
        <div class="level-card-benefits">
          ${benefits.map(benefit => `
            <div class="benefit-chip">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>${benefit}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /*
   * 혜택 상세보기 모달
   */
  showBenefitDetail(levelName, benefits) {
    const detailHTML = `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header-native">
            <h3>${levelName} 등급 혜택</h3>
            <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body-native">
            <div class="benefit-detail-card">
              <div class="benefit-detail-icon">⭐</div>
              <div class="benefit-detail-content">
                <h4>포인트 적립</h4>
                <p>결제 금액의 ${benefits.points}%를 포인트로 적립해드립니다</p>
              </div>
            </div>
            <div class="benefit-detail-card">
              <div class="benefit-detail-icon">💰</div>
              <div class="benefit-detail-content">
                <h4>할인 혜택</h4>
                <p>모든 메뉴 ${benefits.discount}% 할인 혜택을 받으실 수 있습니다</p>
              </div>
            </div>
            <div class="benefit-detail-card">
              <div class="benefit-detail-icon">🎉</div>
              <div class="benefit-detail-content">
                <h4>특별 이벤트</h4>
                <p>단골 고객 전용 이벤트에 우선 참여 가능합니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', detailHTML);
  },

  /**
   * 레벨별 아이콘 반환
   */
  getLevelIcon(levelName) {
    const icons = {
      '브론즈': '🥉',
      '실버': '🥈',
      '골드': '🥇',
      '플래티넘': '💎'
    };
    return icons[levelName] || '🏅';
  },

  /**
   * 레벨별 색상 반환
   */
  getLevelColor(levelName) {
    const colors = {
      '브론즈': 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)',
      '실버': 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)',
      '골드': 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
      '플래티넘': 'linear-gradient(135deg, #e5e4e2 0%, #c0c0c0 100%)'
    };
    return colors[levelName] || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  },

  /**
   * 레벨별 혜택 설명 반환
   */
  getLevelBenefits(levelName) {
    const benefits = {
      '브론즈': ['기본 포인트 적립', '신규 고객 쿠폰'],
      '실버': ['포인트 2배 적립', '생일 쿠폰', '우선 예약'],
      '골드': ['포인트 3배 적립', '무료 음료', 'VIP 메뉴'],
      '플래티넘': ['포인트 5배 적립', '전체 10% 할인', '무료 배달', '전용 라운지']
    };
    return benefits[levelName] || ['기본 혜택'];
  },

  /**
   * 스타일 정의 (네이티브 앱 스타일)
   */
  getStyles() {
    return `
      <style>
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .regular-tab-container {
          padding: 0;
          background: #f5f5f7;
          min-height: 100vh;
        }

        /* 내 혜택 카드 */
        .my-benefits-wrapper {
          padding-bottom: 8px;
        }

        .my-benefits-card {
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          margin-bottom: 12px;
          animation: scaleIn 0.5s ease-out;
        }

        .benefits-card-inner {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .level-badge-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .level-badge-large {
          width: 72px;
          height: 72px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .level-info-main {
          flex: 1;
        }

        .current-level-label {
          margin: 0 0 6px 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .current-level-name {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
        }

        .benefits-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .stat-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .stat-value {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: white;
        }

        .detail-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 14px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .detail-button:active {
          transform: scale(0.97);
          background: rgba(255, 255, 255, 0.3);
        }

        /* 진행상황 카드 */
        .progress-card {
          background: white;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .progress-header {
          margin-bottom: 16px;
        }

        .progress-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .next-level-icon {
          font-size: 20px;
        }

        .progress-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .progress-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-text {
          font-size: 14px;
          color: #86868b;
          font-weight: 600;
        }

        .label-value {
          font-size: 14px;
          color: #1d1d1f;
          font-weight: 700;
        }

        .progress-track {
          height: 10px;
          background: #f5f5f7;
          border-radius: 5px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #007aff 0%, #0051d5 100%);
          border-radius: 5px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .max-level-card {
          background: linear-gradient(135deg, #ffd60a 0%, #ffc107 100%);
          border: none;
        }

        .max-level-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .max-level-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .max-level-text h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
          color: #1d1d1f;
        }

        .max-level-text p {
          margin: 0;
          font-size: 14px;
          color: rgba(29, 29, 31, 0.8);
          font-weight: 600;
        }

        /* 섹션 */
        .section-wrapper {
          padding-top: 8px;
        }

        .section-header-native {
          margin-bottom: 16px;
        }

        .section-title-native {
          margin: 0 0 6px 0;
          font-size: 22px;
          font-weight: 800;
          color: #1d1d1f;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.3px;
        }

        .section-icon-native {
          font-size: 24px;
        }

        .section-subtitle-native {
          margin: 0;
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
        }

        /* 레벨 카드 */
        .level-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .level-card-native {
          background: white;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.3s;
          animation: slideUp 0.5s ease-out forwards;
        }

        .level-card-native:active {
          transform: scale(0.98);
        }

        .level-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .level-icon-badge {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .level-card-info {
          flex: 1;
        }

        .level-card-title {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -0.2px;
        }

        .level-card-requirement {
          margin: 0;
          font-size: 13px;
          color: #86868b;
          font-weight: 600;
        }

        .level-card-benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .benefit-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f5f5f7;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .benefit-chip svg {
          color: #34c759;
        }

       

        /* 모달 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow: auto;
          animation: scaleIn 0.3s ease-out;
        }

        .modal-header-native {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #f5f5f7;
        }

        .modal-header-native h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1d1d1f;
          letter-spacing: -0.3px;
        }

        .modal-close-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f5f7;
          border-radius: 50%;
          color: #86868b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close-btn:active {
          transform: scale(0.9);
          background: #e5e5e7;
        }

        .modal-body-native {
          padding: 20px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .benefit-detail-card {
          display: flex;
          gap: 14px;
          padding: 18px;
          background: #f5f5f7;
          border-radius: 16px;
        }

        .benefit-detail-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .benefit-detail-content h4 {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .benefit-detail-content p {
          margin: 0;
          font-size: 14px;
          color: #86868b;
          line-height: 1.5;
          font-weight: 500;
        }

        /* 빈 상태 */
        .empty-level-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .empty-level-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-level-text {
          margin: 0;
          font-size: 14px;
          color: #86868b;
          font-weight: 500;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .my-benefits-wrapper {
            padding: 12px;
          }

          .my-benefits-card {
            padding: 20px;
            border-radius: 20px;
          }

          .level-badge-large {
            width: 64px;
            height: 64px;
            font-size: 36px;
          }

          .current-level-name {
            font-size: 28px;
          }

          .section-wrapper {
            padding: 12px;
          }

          .section-title-native {
            font-size: 20px;
          }
        }

        /* iOS 스타일 스크롤 */
        .modal-container {
          -webkit-overflow-scrolling: touch;
        }

        /* 터치 피드백 최적화 */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      </style>
    `;
  }
};

// 전역 등록
window.regularTabView = regularTabView;

console.log('✅ regularTabView 모듈 로드 완료 (네이티브 앱 스타일)');
