
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
        <button class="modern-see-more-btn" onclick="renderAllOrderHTML(userInfo)">
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
  const itemsText = items.map(i => `${i.name}(${i.quantity || i.qty || 1}개)`).join(', ') || '메뉴 정보 없음';
  const storeName = order.store_name || orderData.store || '매장 정보 없음';
  const orderDate = new Date(order.order_date).toLocaleDateString();
  
  const originalAmount = order.total_amount || order.original_amount || 0;
  const usedPoint = order.used_point || 0;
  const couponDiscount = order.coupon_discount || 0;
  const finalAmount = order.final_amount || originalAmount;

  let discountInfo = '';
  if (usedPoint > 0 || couponDiscount > 0) {
    const totalDiscount = usedPoint + couponDiscount;
    discountInfo = `
      <div class="order-discount">
        💰 ${totalDiscount.toLocaleString()}원 할인 적용
        ${usedPoint > 0 ? `(포인트 ${usedPoint.toLocaleString()}원` : ''}
        ${usedPoint > 0 && couponDiscount > 0 ? ' + ' : ''}
        ${couponDiscount > 0 ? `쿠폰 ${couponDiscount.toLocaleString()}원)` : usedPoint > 0 ? ')' : ''}
      </div>
    `;
  }

  const reviewButton = order.hasReview
    ? `<div class="review-completed">✅ 리뷰작성 완료</div>`
    : `<button class="review-btn" onclick="renderReviewWrite('${order.id}', '${storeName}')">
         리뷰 작성
       </button>`;

  return `
    <div class="order-item">
      <div class="order-item-header">
        <div>
          <div class="order-store-name">${storeName}</div>
          <div class="order-meta">
            <span>📅 ${orderDate}</span>
          </div>
        </div>
        <div class="order-status">완료</div>
      </div>
      <div class="order-info">
        <strong>주문 내역:</strong> ${itemsText}
        ${discountInfo}
      </div>
      <div class="order-footer">
        <div class="order-amount">${finalAmount.toLocaleString()}원</div>
        ${reviewButton}
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
