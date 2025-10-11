
/**
 * Order View
 * 주문 내역 UI 렌더링
 */

export const orderView = {
  /**
   * 전체 주문 내역 HTML 생성
   */
  renderHTML(data, userInfo) {
    const { orders, stats } = data;

    return `
      <div class="order-history-container">
        ${this.renderHeader()}
        ${this.renderContent(orders, stats, userInfo)}
      </div>
      ${this.renderStyles()}
    `;
  },

  /**
   * 헤더 렌더링
   */
  renderHeader() {
    return `
      <header class="order-header">
        <button class="header-back-btn" onclick="renderMyPage()">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="header-info">
          <h1>📦 주문 내역</h1>
          <p>나의 모든 주문을 확인하세요</p>
        </div>
      </header>
    `;
  },

  /**
   * 컨텐츠 렌더링
   */
  renderContent(orders, stats, userInfo) {
    return `
      <div class="order-content">
        ${this.renderOrderList(orders, userInfo)}
      </div>
    `;
  },

  

  /**
   * 주문 목록 렌더링
   */
  renderOrderList(orders, userInfo) {
    if (orders.length === 0) {
      return this.renderEmptyState();
    }

    return `
      <div class="order-section">
        <div class="section-header">
          <h2>주문 목록</h2>
          <span class="order-badge">${orders.length}건</span>
        </div>
        <div class="order-list">
          ${orders.map((order, index) => this.renderOrderCard(order, index)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * 주문 카드 렌더링 (네이버 쇼핑 스타일)
   */
  renderOrderCard(order, index) {
    const orderData = order.order_data || {};
    const items = orderData.items || [];
    const itemsText = items.length > 1 
      ? `${items[0].name} 외 ${items.length - 1}건`
      : items[0]?.name || '메뉴 정보 없음';
    const storeName = order.store_name || orderData.store || '매장 정보 없음';
    const orderDate = new Date(order.order_date);
    const dateStr = `${orderDate.getMonth() + 1}.${orderDate.getDate()}`;
    const finalAmount = order.final_amount || order.total_amount || 0;

    return `
      <div class="naver-order-card" data-order-id="${order.id}">
        <!-- 1. 상태 영역 (상단) -->
        <div class="order-status-header">
          <span class="order-status-badge" style="color: #10b981;">
            ✅ 완료
          </span>
          <button class="close-btn" aria-label="닫기">×</button>
        </div>

        <!-- 2. 날짜 + 결제수단 정보 영역 -->
        <div class="order-date-section">
          <span class="order-date">${dateStr}. 결제</span>
        </div>

        <!-- 3. 상품 요약 영역 (메인 콘텐츠) -->
        <div class="order-main-section">
          <div class="order-thumbnail">
            <img src="/assets/store_default.png" alt="${storeName}" onerror="this.src='/TableLink.png'">
          </div>
          <div class="order-info">
            <h3 class="order-title">${itemsText}</h3>
            <p class="order-price">${finalAmount.toLocaleString()}원</p>
            <a href="#" class="order-detail-link" onclick="alert('주문 상세 페이지는 준비중입니다.')" >주문상세 ></a>
          </div>
        </div>

        <!-- 4. 매장명 및 문의 영역 -->
        <div class="order-store-section">
          <a href="#" class="store-inquiry-link" onclick="event.preventDefault()">${storeName} 문의 ></a>
        </div>

        <!-- 5. 버튼 영역 (하단 CTA) -->
        <div class="order-actions-footer">
          ${order.hasReview ? 
            `<span class="review-completed-badge">✅ 리뷰작성완료</span>` :
            `<button class="naver-review-btn" data-order-index="${index}">리뷰 작성</button>`
          }
          <button class="action-btn-outline" onclick="handleReorder('${order.id}')">재주문</button>
        </div>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>아직 주문 내역이 없어요</h3>
        <p>첫 주문을 해보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span>🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
  },

  /**
   * 스타일 생성
   */
  renderStyles() {
    return `
      <style>
        .order-history-container {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 430px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          overflow: hidden;
        }

        .order-header {
          background: white;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }

        .header-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-back-btn:active {
          background: #e2e8f0;
          transform: scale(0.95);
        }

        .header-info h1 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .header-info p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .order-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .order-section {
          background: white;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .order-badge {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* 네이버 쇼핑 스타일 주문 카드 */
        .naver-order-card {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 12px;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .naver-order-card:active {
          background: #fafafa;
          transform: translateY(1px);
        }

        /* 1. 상태 영역 (상단) */
        .order-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .order-status-badge {
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #aaa;
          cursor: pointer;
          padding: 4px;
          width: 24px;
          height: 24px;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #666;
        }

        /* 2. 날짜 + 결제수단 정보 영역 */
        .order-date-section {
          margin-bottom: 12px;
        }

        .order-date {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }

        /* 3. 상품 요약 영역 (메인 콘텐츠) */
        .order-main-section {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .order-thumbnail {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .order-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .order-title {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .order-price {
          font-size: 16px;
          font-weight: 700;
          color: #000;
          margin-bottom: 6px;
        }

        .order-detail-link {
          font-size: 13px;
          color: #00BFA5;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .order-detail-link:active {
          color: #00897B;
        }

        /* 4. 매장명 및 문의 영역 */
        .order-store-section {
          margin-bottom: 12px;
        }

        .store-inquiry-link {
          font-size: 13px;
          color: #00BFA5;
          text-decoration: none;
          font-weight: 500;
          display: inline-block;
          transition: color 0.2s;
        }

        .store-inquiry-link:active {
          color: #00897B;
        }

        /* 5. 버튼 영역 (하단 CTA) */
        .order-actions-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .action-btn-outline {
          flex: 1;
          min-width: 100px;
          height: 40px;
          border: 1px solid #ccc;
          background: white;
          color: #333;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .action-btn-outline:active {
          background: #f5f5f5;
          transform: scale(0.98);
        }

        .review-completed-badge {
          flex: 1;
          background: #f0f0f0;
          color: #666;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 40px;
        }

        .naver-review-btn {
          flex: 1;
          background: #03c75a;
          color: white;
          border: none;
          padding: 0 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 40px;
          min-width: 100px;
        }

        .naver-review-btn:active {
          background: #02b350;
          transform: scale(0.98);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .empty-state p {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #64748b;
        }

        .primary-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          background: #3b82f6;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .primary-btn:active {
          transform: scale(0.95);
          background: #2563eb;
        }
      </style>
    `;
  }
};
