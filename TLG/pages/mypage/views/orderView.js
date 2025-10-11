
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
        ${this.renderStats(stats)}
        ${this.renderOrderList(orders, userInfo)}
      </div>
    `;
  },

  /**
   * 통계 카드 렌더링
   */
  renderStats(stats) {
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${stats.totalOrders}건</div>
          <div class="stat-label">총 주문</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">${stats.thisMonthOrders}건</div>
          <div class="stat-label">이번 달</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${stats.totalAmount.toLocaleString()}원</div>
          <div class="stat-label">총 금액</div>
        </div>
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
   * 주문 카드 렌더링
   */
  renderOrderCard(order, index) {
    const orderData = order.order_data || {};
    const items = orderData.items || [];
    const itemsText = items.map(i => `${i.name}(${i.qty || i.quantity || 1}개)`).join(', ') || '메뉴 정보 없음';
    const storeName = order.store_name || orderData.store || '매장 정보 없음';
    const orderDate = new Date(order.order_date);
    const finalAmount = order.final_amount || order.total_amount || 0;

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-card-header">
          <div class="store-info">
            <h3 class="store-name">${storeName}</h3>
            <div class="order-meta">
              <span class="order-date">${orderDate.toLocaleDateString()}</span>
              ${order.table_number ? `<span class="table-badge">테이블 ${order.table_number}</span>` : ''}
            </div>
          </div>
          <div class="status-badge completed">완료</div>
        </div>

        <div class="order-card-body">
          <p class="order-items">${itemsText}</p>
          
          <div class="order-card-footer">
            <div class="amount-info">
              <span class="amount-label">결제금액</span>
              <span class="amount-value">${finalAmount.toLocaleString()}원</span>
            </div>

            <div class="action-buttons">
              ${order.hasReview ? 
                `<span class="review-done">✅ 리뷰 완료</span>` :
                `<button class="review-btn" data-order-index="${index}">
                  <span>📝</span>
                  리뷰 작성
                </button>`
              }
              <button class="reorder-btn" onclick="handleReorder('${order.id}')">
                <span>🔄</span>
                재주문
              </button>
            </div>
          </div>
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
          top: 0;
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

        .order-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .order-card:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .store-name {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .order-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-date {
          font-size: 12px;
          color: #64748b;
        }

        .table-badge {
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .order-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-items {
          margin: 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
        }

        .order-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .amount-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .amount-label {
          font-size: 11px;
          color: #64748b;
        }

        .amount-value {
          font-size: 16px;
          font-weight: 700;
          color: #3b82f6;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .review-btn,
        .reorder-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .review-btn {
          background: #3b82f6;
          color: white;
        }

        .review-btn:active {
          transform: scale(0.95);
          background: #2563eb;
        }

        .reorder-btn {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .reorder-btn:active {
          transform: scale(0.95);
          background: #f8fafc;
        }

        .review-done {
          color: #166534;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          background: #dcfce7;
          border-radius: 8px;
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
