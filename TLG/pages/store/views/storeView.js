
// 매장 뷰 - UI 렌더링 전담 (modules 폴더 의존)
export const storeView = {
  /**
   * 메인 매장 HTML 렌더링
   */
  renderStoreHTML(store) {
    const main = document.getElementById('main');
    const displayRating = store.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';

    // modules의 UI 컴포넌트들을 사용하여 렌더링
    main.innerHTML = `
      <button id="backBtn" class="header-btn" onclick="renderMap().catch(console.error)" aria-label="뒤로가기">
        <span class="header-btn-ico">⬅️</span>
      </button>
      <button id="TLL" class="header-btn" aria-label="QR결제" onclick="TLL().catch(console.error)">
        <span class="header-btn-ico">📱</span>
      </button>
      <header id="storeHeader">
        <div class="imgWrapper">
          <img src="TableLink.png" alt="메뉴이미지" />
          <div class="header-overlay"></div>
        </div>
      </header>
      <div id="storePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="storePanelContainer">
          <div id="storeInfoContainer">
            <div class="storeInfo">
              <div class="store-header-section">
                <div class="store-main-info">
                  <div class="score-row">
                    <div class="rating-container">
                      <span id="reviewStar">★</span>
                      <span id="reviewScore">${displayRating}</span>
                      <span id="reviewLink" class="review-link">리뷰 보기</span>
                    </div>
                    <button id="favoriteBtn" class="favorite-btn">♡</button>
                  </div>
                  <h2 id="storeName">${store.name}</h2>
                  <div class="store-status-container">
                    <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
                      ${store.isOpen ? '🟢 운영중' : '🔴 운영중지'}
                    </span>
                    <span class="store-category-tag">음식점</span>
                  </div>
                </div>
              </div>
            </div>
            ${this.renderModularComponents(store)}
          </div>
          <div id="storeNavBar" class="modern-nav">
            <button class="nav-btn" data-tab="menu">
              <span class="nav-ico">🍽️</span>
              <span class="nav-label">메뉴</span>
            </button>
            <button class="nav-btn" data-tab="review">
              <span class="nav-ico">💬</span>
              <span class="nav-label">리뷰</span>
            </button>
            <button class="nav-btn" data-tab="photo">
              <span class="nav-ico">📸</span>
              <span class="nav-label">사진</span>
            </button>
            <button class="nav-btn" data-tab="info">
              <span class="nav-ico">ℹ️</span>
              <span class="nav-label">정보</span>
            </button>
          </div>
          <div id="storeContent"></div>
        </div>
      </div>
      <nav id="storeBottomBar">
        <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
          <span class="btm-btn-ico">📞</span>
        </button>
        <button id="order" class="btm-btn order-btn">
          <span class="order-text">포장·예약하기</span>
          <span class="order-arrow">→</span>
        </button>
      </nav>
      ${this.getStoreStyles()}
    `;
  },

  /**
   * 모듈식 컴포넌트들 렌더링
   */
  renderModularComponents(store) {
    let components = '';
    
    // 리뷰 프리뷰 컴포넌트
    components += this.renderReviewPreviewHTML();
    
    // 상위 사용자 컴포넌트
    components += this.renderTopUsersHTML(store);
    
    // 단골 레벨 컴포넌트
    components += this.renderLoyaltyLevelHTML();
    
    // 프로모션 컴포넌트
    components += this.renderPromotionCardHTML(store);
    
    // 테이블 상태 컴포넌트 (modules/tableStatusHTML.js 의존)
    components += this.renderTableStatusHTML(store);

    return components;
  },

  /**
   * 평점 표시 업데이트
   */
  updateRatingDisplay(rating) {
    const reviewScoreElement = document.getElementById('reviewScore');
    if (reviewScoreElement) {
      const displayRating = parseFloat(rating).toFixed(1);

      // 기존 텍스트 노드 업데이트
      const textNode = reviewScoreElement.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = displayRating + '\u00A0';
      } else {
        reviewScoreElement.innerHTML = `${displayRating}&nbsp;<span id="reviewLink" class="review-link">리뷰 보기</span>`;

        // 새로 생성된 리뷰 링크에 이벤트 리스너 설정
        const newReviewLink = document.getElementById('reviewLink');
        if (newReviewLink) {
          newReviewLink.addEventListener('click', () => {
            if (typeof renderAllReview === 'function') {
              renderAllReview(window.currentStore);
            }
          });
        }
      }
    }
  },

  /**
   * 프로모션 UI 업데이트
   */
  updatePromotionUI(promotions) {
    const promotionContainer = document.querySelector('.promotion-content');
    if (!promotionContainer) return;

    if (!promotions || promotions.length === 0) {
      promotionContainer.innerHTML = `
        <div class="no-promotion-message">
          <span class="no-promotion-icon">📭</span>
          <div class="no-promotion-text">현재 진행중인 혜택이 없습니다</div>
        </div>
      `;
      return;
    }

    const displayPromotions = promotions.slice(0, 2);
    promotionContainer.innerHTML = `
      ${displayPromotions.map((promotion, index) => `
        <div class="benefit-item-modern ${index === 0 ? 'featured' : ''}">
          <div class="benefit-icon-modern">${this.getBenefitIcon(promotion.type)}</div>
          <div class="benefit-content-modern">
            <div class="benefit-name-modern">${promotion.name}</div>
            <div class="benefit-desc-modern">${promotion.description}</div>
          </div>
          <div class="benefit-value-modern">${this.formatDiscountValue(promotion)}</div>
        </div>
      `).join('')}
      ${promotions.length > 2 ? `
        <div class="benefits-expand-modern">
          <button class="promotion-detail-btn modern-outline-btn">
            <span class="btn-icon">➕</span>
            <span class="btn-text">더 보기 (${promotions.length - 2}개)</span>
          </button>
        </div>
      ` : ''}
    `;
  },

  /**
   * 단골 레벨 UI 업데이트
   */
  updateLoyaltyUI(levelData, store) {
    const loyaltyContainer = document.querySelector('.loyalty-levels-grid');
    if (!loyaltyContainer) return;

    if (!levelData) {
      loyaltyContainer.innerHTML = this.createDefaultLoyaltyHTML(store);
      return;
    }

    loyaltyContainer.innerHTML = this.createLoyaltyCardHTML(levelData, store);
  },

  /**
   * 상위 사용자 UI 업데이트
   */
  updateTopUsersUI(users) {
    const topUsersContainer = document.querySelector('.top-users-content');
    if (!topUsersContainer) return;

    if (!users || users.length === 0) {
      topUsersContainer.innerHTML = `
        <div class="no-top-users-message">
          <span class="no-users-icon">👑</span>
          <div class="no-users-text">아직 단골 고객이 없습니다</div>
        </div>
      `;
      return;
    }

    const displayUsers = users.slice(0, 3);
    topUsersContainer.innerHTML = `
      ${displayUsers.map((user, index) => {
        const rank = index + 1;
        const avatarColor = this.getAvatarColor(user.name || user.user_name);
        const initial = (user.name || user.user_name || '?').charAt(0).toUpperCase();

        return `
          <div class="top-user-item rank-${rank}">
            <div class="rank-badge rank-${rank}">${rank}</div>
            <div class="user-avatar" style="background: ${avatarColor};">
              ${initial}
            </div>
            <div class="user-info">
              <div class="user-name">${user.name || user.user_name || '익명'}</div>
              <div class="user-level">${user.level_name || '브론즈'} 등급</div>
            </div>
            <div class="user-stats">
              <div class="user-stat">
                <span class="stat-icon">🏪</span>
                <span>${user.visit_count || 0}회</span>
              </div>
              <div class="user-stat">
                <span class="stat-icon">💰</span>
                <span>${this.formatCurrency(user.total_spent || 0)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
      ${users.length > 3 ? `
        <div class="users-expand">
          <button class="top-users-detail-btn" onclick="showAllTopUsers(${JSON.stringify(window.currentStore).replace(/"/g, '&quot;')})">
            더 보기 (+${users.length - 3}명)
          </button>
        </div>
      ` : ''}
    `;
  },

  /**
   * 오류 메시지 표시
   */
  showError(message) {
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 매장을 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">${message}</p>
          <button onclick="renderMap()" style="
            padding: 10px 20px;
            background: #297efc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">지도로 돌아가기</button>
        </div>
      `;
    }
  },

  // UI 구성요소들 - modules 의존성
  renderReviewPreviewHTML() {
    // modules/reviewPreviewHTML.js에 의존
    return window.reviewPreviewHTML ? window.reviewPreviewHTML.renderReviewPreviewHTML() : 
           (window.StoreUIManager ? window.StoreUIManager.renderReviewPreviewHTML() : '');
  },

  renderTopUsersHTML(store) {
    // 기존 StoreUIManager 사용 (추후 modules로 분리 가능)
    return window.StoreUIManager ? window.StoreUIManager.renderTopUsersHTML(store) : '';
  },

  renderLoyaltyLevelHTML() {
    // 기존 StoreUIManager 사용 (추후 modules로 분리 가능)
    return window.StoreUIManager ? window.StoreUIManager.renderLoyaltyLevelHTML() : '';
  },

  renderPromotionCardHTML(store) {
    // modules/promotionCardHTML.js에 의존
    return window.promotionCardHTML ? window.promotionCardHTML.renderPromotionCardHTML(store) : 
           (window.StoreUIManager ? window.StoreUIManager.renderPromotionCardHTML(store) : '');
  },

  renderTableStatusHTML(store) {
    // modules/tableStatusHTML.js에 의존
    if (window.tableStatusHTML && typeof window.tableStatusHTML.renderTableStatusHTML === 'function') {
      return window.tableStatusHTML.renderTableStatusHTML(store);
    } else {
      console.warn('⚠️ tableStatusHTML 모듈을 찾을 수 없습니다');
      return '<div class="table-status-placeholder">테이블 현황을 불러오는 중...</div>';
    }
  },

  getStoreStyles() {
    // 기존 StoreUIManager 사용 (추후 modules로 분리 가능)
    return window.StoreUIManager ? window.StoreUIManager.getStoreStyles() : '';
  },

  // 유틸리티 함수들
  getBenefitIcon(type) {
    const iconMap = {
      'discount': '🏷️',
      'point': '⭐',
      'free_delivery': '🚚',
      'new_customer': '🎁',
      'loyalty': '👑'
    };
    return iconMap[type] || '🎉';
  },

  formatDiscountValue(promotion) {
    if (promotion.discount_percent) {
      return `${promotion.discount_percent}%`;
    } else if (promotion.discount_amount) {
      return `${promotion.discount_amount.toLocaleString()}원`;
    } else if (promotion.type === 'point') {
      return `${promotion.point_rate}% 적립`;
    }
    return '혜택';
  },

  getAvatarColor(name) {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];

    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  },

  formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    if (num >= 1000000) {
      return `${Math.floor(num / 1000000)}M원`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 1000)}K원`;
    } else {
      return `${num.toLocaleString()}원`;
    }
  },

  createDefaultLoyaltyHTML(store) {
    return `
      <div class="loyalty-card default">
        <div class="loyalty-header">
          <span class="loyalty-icon">🆕</span>
          <span class="loyalty-title">신규 고객</span>
        </div>
        <div class="loyalty-message">
          ${store.name}에 처음 방문하신 것을 환영합니다!
        </div>
      </div>
    `;
  },

  createLoyaltyCardHTML(levelData, store) {
    // 기존 단골 레벨 카드 HTML 생성 로직
    return `
      <div class="loyalty-card premium">
        <div class="loyalty-header">
          <span class="loyalty-icon">${levelData.level?.icon || '👑'}</span>
          <span class="loyalty-title">${levelData.level?.name || '단골 고객'}</span>
        </div>
        <div class="loyalty-stats">
          <div class="stat">방문: ${levelData.stats?.visitCount || 0}회</div>
          <div class="stat">포인트: ${levelData.stats?.points || 0}P</div>
        </div>
      </div>
    `;
  }
};

// 전역 등록
window.storeView = storeView;
