
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
  const storeId = order.store_id;
  const orderDate = new Date(order.order_date);
  const dateStr = `${orderDate.getMonth() + 1}. ${orderDate.getDate().toString().padStart(2, '0')}`;
  
  const originalAmount = order.total_amount || order.original_amount || 0;
  const usedPoint = order.used_point || 0;
  const couponDiscount = order.coupon_discount || 0;
  const finalAmount = order.final_amount || originalAmount;

  // 주문 상태 (기본: 완료)
  const orderStatus = order.status || 'COMPLETED';
  const statusConfig = {
    'PENDING': { label: '상품준비중', color: '#FF9500', icon: '🟡' },
    'PREPARING': { label: '상품준비중', color: '#FF9500', icon: '🟡' },
    'COMPLETED': { label: '배송완료', color: '#34C759', icon: '✅' },
    'CANCELLED': { label: '주문취소', color: '#FF3B30', icon: '❌' },
    'DELIVERED': { label: '배송완료', color: '#34C759', icon: '✅' }
  };
  const status = statusConfig[orderStatus] || statusConfig['COMPLETED'];

  // 첫 번째 메뉴 이름 (대표 메뉴)
  const firstItem = items[0] || { name: '메뉴 정보 없음', quantity: 0 };
  const itemCount = items.length;
  const menuTitle = itemCount > 1 ? `${firstItem.name} 외 ${itemCount - 1}건` : firstItem.name;

  // 할인 정보
  const hasDiscount = usedPoint > 0 || couponDiscount > 0;
  const payBadge = hasDiscount ? `<span class="pay-badge">NPay</span>` : '';

  // 리뷰 버튼
  const reviewButton = order.hasReview
    ? `<span class="review-completed-badge">${status.icon} 리뷰작성완료</span>`
    : `<button class="naver-review-btn" onclick="renderReviewWrite(${JSON.stringify(order).replace(/"/g, '&quot;')})">
         리뷰 작성
       </button>`;

  return `
    <div class="naver-order-card">
      <!-- 상단 상태 영역 -->
      <div class="order-status-header">
        <span class="order-status-badge" style="color: ${status.color}">
          ${status.icon} ${status.label}
        </span>
        <button class="close-btn" aria-label="닫기">×</button>
      </div>

      <!-- 날짜 + 결제수단 정보 -->
      <div class="order-date-section">
        <span class="order-date">${dateStr}. 결제</span>
      </div>

      <!-- 상품 요약 영역 (메인 콘텐츠) -->
      <div class="order-main-section">
        <div class="order-thumbnail">
          <img src="/assets/store_default.png" alt="${storeName}" onerror="this.src='/assets/tablelink.png'">
        </div>
        <div class="order-info">
          <h3 class="order-title">${menuTitle}</h3>
          <div class="order-price">
            ${finalAmount.toLocaleString()}원 ${payBadge}
          </div>
          <a href="#" class="order-detail-link" onclick="event.preventDefault(); alert('주문 상세 준비중')">
            주문상세 〉
          </a>
        </div>
      </div>

      <!-- 매장명 및 문의 영역 -->
      <div class="order-store-section">
        <a href="#" class="store-inquiry-link" onclick="event.preventDefault(); ${storeId ? `renderStore(${storeId})` : `alert('매장 정보 준비중')`}">
          ${storeName} 문의 〉
        </a>
      </div>

      <!-- 버튼 영역 (하단 CTA) -->
      <div class="order-actions-footer">
        <button class="action-btn-outline" onclick="alert('취소/교환/반품 준비중')">취소요청</button>
        <button class="action-btn-outline" onclick="alert('영수증조회 준비중')">영수증조회</button>
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
