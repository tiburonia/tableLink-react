
/**
 * 단골혜택 탭 뷰 - UI 렌더링
 */

export const regularTabView = {
  /**
   * 단골혜택 탭 렌더링
   */
  render(store, promotions) {
    return `
      <div class="regular-tab-container">
        ${this.renderHeader(store)}
        ${this.renderPromotionSection(promotions)}
        ${this.renderLoyaltyLevelSection(store)}
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 헤더 렌더링
   */
  renderHeader(store) {
    return `
      <div class="regular-header">
        <div class="header-content">
          <div class="header-icon-badge">
            👑
          </div>
          <div class="header-info">
            <h2 class="header-title">단골 혜택</h2>
            <p class="header-subtitle">${store.name}의 특별한 혜택을 만나보세요</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 프로모션 섹션 렌더링
   */
  renderPromotionSection(promotions) {
    return `
      <section class="regular-section promotion-section" id="promotionSection">
        <!-- promotionCardHTML 모듈이 여기에 삽입됩니다 -->
      </section>
    `;
  },

  /**
   * 단골 레벨 섹션 렌더링
   */
  renderLoyaltyLevelSection(store) {
    return `
      <section class="regular-section loyalty-section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="section-icon">📊</span>
            단골 등급 혜택
          </h3>
        </div>
        <div class="loyalty-levels-container" id="loyaltyLevelsContainer">
          ${this.renderLoyaltyLevels()}
        </div>
      </section>
    `;
  },

  /**
   * 단골 레벨 카드 렌더링 (더미)
   */
  renderLoyaltyLevels() {
    const levels = [
      {
        name: '브론즈',
        icon: '🥉',
        requirement: '방문 1회 이상',
        benefits: ['기본 포인트 적립', '신규 고객 쿠폰'],
        color: '#cd7f32'
      },
      {
        name: '실버',
        icon: '🥈',
        requirement: '방문 5회 이상',
        benefits: ['포인트 2배 적립', '생일 쿠폰', '우선 예약'],
        color: '#c0c0c0'
      },
      {
        name: '골드',
        icon: '🥇',
        requirement: '방문 10회 이상',
        benefits: ['포인트 3배 적립', '무료 음료', 'VIP 메뉴', '전용 고객센터'],
        color: '#ffd700'
      },
      {
        name: '플래티넘',
        icon: '💎',
        requirement: '방문 20회 이상',
        benefits: ['포인트 5배 적립', '전체 10% 할인', '무료 배달', '전용 라운지'],
        color: '#e5e4e2'
      }
    ];

    return levels.map((level, index) => `
      <div class="loyalty-level-card" style="animation-delay: ${index * 0.1}s">
        <div class="level-badge" style="background: ${level.color}">
          <span class="level-icon">${level.icon}</span>
        </div>
        <div class="level-info">
          <h4 class="level-name">${level.name}</h4>
          <p class="level-requirement">${level.requirement}</p>
          <div class="level-benefits">
            ${level.benefits.map(benefit => `
              <div class="benefit-tag">✓ ${benefit}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
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

        .regular-tab-container {
          padding: 0;
          background: #f8f9fa;
          min-height: 100vh;
        }

        /* 헤더 */
        .regular-header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          padding: 24px 16px;
          color: white;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon-badge {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .header-info {
          flex: 1;
        }

        .header-title {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .header-subtitle {
          margin: 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        /* 섹션 */
        .regular-section {
          background: white;
          margin-bottom: 12px;
          padding: 20px 16px;
        }

        .promotion-section {
          padding: 0;
          background: transparent;
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
          transition: all 0.3s;
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .loyalty-level-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }

        .level-badge {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

        /* 반응형 */
        @media (max-width: 480px) {
          .regular-header {
            padding: 20px 12px;
          }

          .header-icon-badge {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .header-title {
            font-size: 20px;
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
