
/**
 * 단골혜택 탭 뷰 - UI 렌더링
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
        ${this.renderTopUsersSection(store)}
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
      <div class="my-benefits-card">
        <div class="benefits-header" style="background: ${levelColor}">
          <div class="benefits-header-content">
            <div class="level-badge-large">
              <span class="level-icon-large">${levelIcon}</span>
            </div>
            <div class="level-info-header">
              <p class="current-level-label">현재 등급</p>
              <h2 class="current-level-name">${levelName}</h2>
            </div>
          </div>
        </div>

        <div class="benefits-body">
          <div class="section-title-with-action">
            <h3 class="benefits-section-title">
              <span class="section-icon">🎁</span>
              내 혜택
            </h3>
            <button class="detail-btn" onclick="regularTabView.showBenefitDetail('${levelName}', ${JSON.stringify(benefits).replace(/"/g, '&quot;')})">
              자세히 보기
              <span class="arrow-icon">→</span>
            </button>
          </div>

          <div class="benefits-grid">
            <div class="benefit-item">
              <div class="benefit-icon">⭐</div>
              <div class="benefit-content">
                <p class="benefit-label">포인트 적립률</p>
                <p class="benefit-value">${benefits.points}%</p>
              </div>
            </div>

            <div class="benefit-item">
              <div class="benefit-icon">💰</div>
              <div class="benefit-content">
                <p class="benefit-label">할인 혜택</p>
                <p class="benefit-value">${benefits.discount}%</p>
              </div>
            </div>
          </div>

          ${this.renderProgressToNextLevel(store, user)}
        </div>
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
    
    // 등급 순서 정의
    const levelOrder = ['브론즈', '실버', '골드', '플래티넘'];
    const currentIndex = levelOrder.indexOf(currentLevelName);
    
    // 이미 최고 등급인 경우
    if (currentIndex === levelOrder.length - 1) {
      return `
        <div class="next-level-progress">
          <div class="max-level-badge">
            <span class="max-level-icon">👑</span>
            <p class="max-level-text">최고 등급 달성!</p>
          </div>
        </div>
      `;
    }

    // 다음 등급 찾기
    const nextLevelName = levelOrder[currentIndex + 1];
    const nextLevel = promotions.find(p => p.level === nextLevelName);
    
    if (!nextLevel) return '';

    // 더미 데이터로 진행률 계산 (실제로는 서버에서 받아야 함)
    const currentOrders = 3; // 더미
    const currentSpent = 35000; // 더미
    const ordersProgress = Math.min((currentOrders / nextLevel.min_orders) * 100, 100);
    const spentProgress = Math.min((currentSpent / nextLevel.min_spent) * 100, 100);

    return `
      <div class="next-level-progress">
        <div class="progress-header">
          <p class="progress-title">
            <span class="next-level-icon">${this.getLevelIcon(nextLevelName)}</span>
            ${nextLevelName} 등급까지
          </p>
        </div>

        <div class="progress-items">
          <div class="progress-item">
            <div class="progress-label">
              <span class="label-text">주문 횟수</span>
              <span class="label-value">${currentOrders} / ${nextLevel.min_orders}회</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${ordersProgress}%"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-label">
              <span class="label-text">누적 금액</span>
              <span class="label-value">${currentSpent.toLocaleString()} / ${nextLevel.min_spent.toLocaleString()}원</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${spentProgress}%"></div>
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
    
    // 등급 순서대로 정렬
    const levelOrder = ['브론즈', '실버', '골드', '플래티넘'];
    const sortedPromotions = promotions.sort((a, b) => 
      levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
    );

    return `
      <section class="regular-section loyalty-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📊</span>
            단골 등급 안내
          </h3>
          <p class="section-description">주문 횟수와 누적 금액에 따라 등급이 올라갑니다</p>
        </div>
        <div class="loyalty-levels-container">
          ${sortedPromotions.map((promo, index) => this.renderLevelCard(promo, index)).join('')}
        </div>
      </section>
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
      <div class="loyalty-level-card" style="animation-delay: ${index * 0.1}s">
        <div class="level-badge" style="background: ${color}">
          <span class="level-icon">${icon}</span>
        </div>
        <div class="level-info">
          <h4 class="level-name">${promo.level}</h4>
          <p class="level-requirement">
            주문 ${promo.min_orders}회 이상 · ${promo.min_spent.toLocaleString()}원 이상
          </p>
          <div class="level-benefits">
            ${benefits.map(benefit => `
              <div class="benefit-tag">✓ ${benefit}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 상위 사용자 랭킹 섹션 렌더링 (더미 데이터)
   */
  renderTopUsersSection(store) {
    const topUsers = [
      { rank: 1, name: '김민수', orders: 45, spent: 550000, level: '플래티넘' },
      { rank: 2, name: '이영희', orders: 38, spent: 480000, level: '플래티넘' },
      { rank: 3, name: '박지훈', orders: 32, spent: 420000, level: '골드' },
      { rank: 4, name: '최서연', orders: 28, spent: 380000, level: '골드' },
      { rank: 5, name: '정우진', orders: 24, spent: 320000, level: '골드' },
      { rank: 6, name: '강혜진', orders: 19, spent: 260000, level: '실버' },
      { rank: 7, name: '윤지우', orders: 16, spent: 220000, level: '실버' },
      { rank: 8, name: '임수빈', orders: 12, spent: 180000, level: '실버' },
    ];

    return `
      <section class="regular-section top-users-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">🏆</span>
            이달의 단골 Top 8
          </h3>
          <p class="section-description">${store.name}을 가장 많이 이용한 고객님들입니다</p>
        </div>

        <div class="top-users-list">
          ${topUsers.map(user => this.renderTopUserCard(user)).join('')}
        </div>
      </section>
    `;
  },

  /**
   * 상위 사용자 카드 렌더링
   */
  renderTopUserCard(user) {
    const medalIcon = user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `${user.rank}위`;
    const levelIcon = this.getLevelIcon(user.level);
    const isTopThree = user.rank <= 3;

    return `
      <div class="top-user-card ${isTopThree ? 'top-three' : ''}">
        <div class="user-rank ${isTopThree ? 'medal-rank' : ''}">
          ${medalIcon}
        </div>
        <div class="user-info">
          <div class="user-name-level">
            <span class="user-name">${user.name}</span>
            <span class="user-level-badge" title="${user.level}">
              ${levelIcon}
            </span>
          </div>
          <div class="user-stats">
            <span class="stat-item">주문 ${user.orders}회</span>
            <span class="stat-divider">·</span>
            <span class="stat-item">${user.spent.toLocaleString()}원</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 혜택 상세보기 모달 (이벤트 핸들러)
   */
  showBenefitDetail(levelName, benefits) {
    const detailHTML = `
      <div class="benefit-detail-modal" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>${levelName} 등급 혜택</h3>
            <button class="close-btn" onclick="this.closest('.benefit-detail-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-benefit-item">
              <div class="detail-icon">⭐</div>
              <div>
                <p class="detail-title">포인트 적립</p>
                <p class="detail-desc">결제 금액의 ${benefits.points}%를 포인트로 적립해드립니다</p>
              </div>
            </div>
            <div class="detail-benefit-item">
              <div class="detail-icon">💰</div>
              <div>
                <p class="detail-title">할인 혜택</p>
                <p class="detail-desc">모든 메뉴 ${benefits.discount}% 할인 혜택을 받으실 수 있습니다</p>
              </div>
            </div>
            <div class="detail-benefit-item">
              <div class="detail-icon">🎉</div>
              <div>
                <p class="detail-title">특별 이벤트</p>
                <p class="detail-desc">단골 고객 전용 이벤트에 우선 참여 가능합니다</p>
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
      '브론즈': 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)',
      '실버': 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)',
      '골드': 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
      '플래티넘': 'linear-gradient(135deg, #e5e4e2 0%, #b0b0b0 100%)'
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
   * 스타일 정의
   */
  getStyles() {
    return `
      <style>
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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

        .regular-tab-container {
          padding: 0;
          background: #f8f9fa;
          min-height: 100vh;
        }

        /* 내 혜택 카드 */
        .my-benefits-card {
          margin-bottom: 12px;
          background: white;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .benefits-header {
          padding: 24px 16px;
          color: white;
        }

        .benefits-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .level-badge-large {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .level-icon-large {
          font-size: 36px;
        }

        .level-info-header {
          flex: 1;
        }

        .current-level-label {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .current-level-name {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        .benefits-body {
          padding: 20px 16px;
        }

        .section-title-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .benefits-section-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .detail-btn:hover {
          background: #eff6ff;
        }

        .arrow-icon {
          font-size: 14px;
          transition: transform 0.2s;
        }

        .detail-btn:hover .arrow-icon {
          transform: translateX(4px);
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .benefit-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .benefit-content {
          flex: 1;
        }

        .benefit-label {
          margin: 0 0 4px 0;
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .benefit-value {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        /* 다음 레벨 진행상황 */
        .next-level-progress {
          padding: 16px;
          background: #f1f5f9;
          border-radius: 12px;
        }

        .progress-header {
          margin-bottom: 12px;
        }

        .progress-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .next-level-icon {
          font-size: 16px;
        }

        .progress-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .progress-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-text {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .label-value {
          font-size: 13px;
          color: #1e293b;
          font-weight: 600;
        }

        .progress-bar-container {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 4px;
          transition: width 0.6s ease-out;
        }

        .max-level-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 12px;
          color: white;
        }

        .max-level-icon {
          font-size: 24px;
        }

        .max-level-text {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        /* 섹션 */
        .regular-section {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-title {
          margin: 0 0 4px 0;
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

        .section-description {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        /* 단골 레벨 카드 */
        .loyalty-levels-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .loyalty-level-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .loyalty-level-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .level-badge {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .level-icon {
          font-size: 32px;
        }

        .level-info {
          flex: 1;
        }

        .level-name {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .level-requirement {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .level-benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .benefit-tag {
          padding: 4px 10px;
          background: #f1f5f9;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        /* 상위 사용자 섹션 */
        .top-users-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .top-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .top-user-card:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .top-user-card.top-three {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #fbbf24;
        }

        .top-user-card.top-three:hover {
          background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
        }

        .user-rank {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          flex-shrink: 0;
        }

        .user-rank.medal-rank {
          background: transparent;
          font-size: 24px;
        }

        .user-info {
          flex: 1;
        }

        .user-name-level {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .user-name {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .user-level-badge {
          font-size: 16px;
        }

        .user-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        .stat-item {
          font-weight: 500;
        }

        .stat-divider {
          color: #cbd5e1;
        }

        /* 모달 */
        .benefit-detail-modal {
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

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow: auto;
          animation: slideInUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 50%;
          font-size: 18px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .modal-body {
          padding: 20px;
        }

        .detail-benefit-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .detail-benefit-item:last-child {
          margin-bottom: 0;
        }

        .detail-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .detail-title {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .detail-desc {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .benefits-header {
            padding: 20px 12px;
          }

          .level-badge-large {
            width: 56px;
            height: 56px;
          }

          .level-icon-large {
            font-size: 32px;
          }

          .current-level-name {
            font-size: 24px;
          }

          .benefits-body {
            padding: 16px 12px;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .loyalty-level-card {
            padding: 12px;
          }

          .level-badge {
            width: 50px;
            height: 50px;
          }

          .level-icon {
            font-size: 28px;
          }
        }
      </style>
    `;
  }
};

// 전역 등록
window.regularTabView = regularTabView;

console.log('✅ regularTabView 모듈 로드 완료');
