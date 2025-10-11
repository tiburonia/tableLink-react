
/**
 * Order Section Component
 * 주문 섹션 UI 컴포넌트
 */

export function generateOrderSectionHTML(orders) {
  const orderListHTML = orders.length > 0
    ? orders.map(order => generateOrderItemHTML(order)).join('')
    : generateEmptyOrderHTML();

  return `
    <section class="section-card orders-card">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">📦</div>
          <div class="section-text">
            <h3>최근 주문</h3>
            <p class="section-subtitle">나의 주문 내역을 확인하세요</p>
          </div>
        </div>
        <button class="modern-see-more-btn" data-action="view-all-orders">
          <span class="btn-text">전체보기</span>
          <div class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
      <div id="orderList" class="modern-content-list">
        ${orderListHTML}
      </div>
    </section>
  `;
}

function generateOrderItemHTML(order) {
  const orderData = order.order_data || {};
  const items = orderData.items || [];
  const storeName = order.store_name || orderData.store || '매장 정보 없음';
  const orderDate = new Date(order.order_date);
  const dateStr = `${orderDate.getMonth() + 1}. ${orderDate.getDate().toString().padStart(2, '0')}`;
  
  const originalAmount = order.total_amount || order.original_amount || 0;
  const usedPoint = order.used_point || 0;
  const couponDiscount = order.coupon_discount || 0;
  const finalAmount = order.final_amount || originalAmount;

  // 첫 번째 메뉴 이름 (대표 메뉴)
  const firstItem = items[0] || { name: '메뉴 정보 없음', quantity: 0 };
  const itemCount = items.length;
  const menuTitle = itemCount > 1 ? `${firstItem.name} 외 ${itemCount - 1}건` : firstItem.name;

  // 할인 정보
  const hasDiscount = usedPoint > 0 || couponDiscount > 0;
  const payBadge = hasDiscount ? `<span class="pay-badge">네이버페이</span>` : '';

  const reviewButton = order.hasReview
    ? `<div class="review-completed-badge">✓ 리뷰작성완료</div>`
    : `<button class="naver-review-btn" onclick="renderReviewWrite(${JSON.stringify(order).replace(/"/g, '&quot;')})">
         리뷰 작성
       </button>`;

  return `
    <div class="naver-order-card">
      <button class="close-btn" aria-label="닫기">×</button>
      
      <div class="order-header">
        <span class="order-date">${dateStr}. 결제</span>
      </div>

      <div class="order-body">
        <div class="order-thumbnail">
          <img src="/assets/store_default.png" alt="${storeName}" onerror="this.src='/assets/tablelink.png'">
        </div>
        <div class="order-content">
          <h3 class="order-title">${menuTitle}</h3>
          <div class="order-price">
            ${finalAmount.toLocaleString()}원 ${payBadge}
          </div>
          <div class="order-detail-links">
            <a href="#" class="detail-link">주문상세 〉</a>
            <a href="#" class="detail-link">${storeName} 문의 〉</a>
          </div>
        </div>
      </div>

      <div class="order-actions">
        <button class="action-btn secondary" onclick="alert('취소/교환/반품 준비중')">취소요청</button>
        <button class="action-btn secondary" onclick="alert('영수증조회 준비중')">영수증조회</button>
        <button class="action-btn primary" onclick="alert('더보기 준비중')">⋯</button>
      </div>
    </div>
  `;
}

function generateEmptyOrderHTML() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-text">아직 주문 내역이 없습니다</div>
    </div>
  `;
}
