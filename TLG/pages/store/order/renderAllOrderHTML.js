// 전체 주문내역을 모달로 표시하는 함수
async function renderAllOrderHTML(userInfo) {
  try {
    console.log('📋 전체 주문내역 모달 열기');

    // orders 테이블에서 전체 주문 내역 가져오기
    const response = await fetch(`/api/orders/mypage/${userInfo.id}?limit=50`);

    if (!response.ok) throw new Error('주문 내역 조회 실패');
    const data = await response.json();
    const ordersData = data.orders || [];

    let orderHTML = `
      <div class="fixed" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000;">
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 400px; max-height: 80%; overflow: hidden; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee;">
            <h2 style="margin: 0; color: #333;">📦 전체 주문내역 (${ordersData.length}건)</h2>
            <button onclick="this.closest('.fixed').remove()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
              ✕ 닫기
            </button>
          </div>
          <div style="flex: 1; overflow-y: auto; padding: 20px;">
    `;

    if (ordersData.length > 0) {
      ordersData.forEach((order, index) => {
        const orderData = order.order_data || {};
        const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
        const storeName = orderData.store || order.store_name || '매장 정보 없음';
        const hasReview = false; // 실제로는 API 호출로 확인해야 함

        orderHTML += `
          <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e9ecef;">
            <div style="margin-bottom: 10px;">
              <strong style="color: #007bff; font-size: 16px;">${storeName}</strong><br>
              <span style="color: #666; font-size: 14px;">${items}</span><br>
              <span style="color: #28a745; font-weight: bold;">총 ${(order.final_amount || order.total_amount || 0).toLocaleString()}원</span><br>
              <span style="color: #666; font-size: 13px;">📅 ${new Date(order.order_date).toLocaleDateString()}</span><br>
              ${order.table_number ? `<span style="color: #666; font-size: 13px;">🪑 테이블 ${order.table_number}</span><br>` : ''}
            </div>
            <div style="display: flex; justify-content: flex-end;">
              ${hasReview ?
                `<span style="color: #28a745; font-size: 13px; padding: 4px 8px; background: #d4edda; border-radius: 4px;">✅ 리뷰 작성 완료</span>` :
                `<button class="review-btn-modal" data-order-id="${order.id}" data-order-index="${index}" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">📝 리뷰 작성</button>`
              }
            </div>
          </div>
        `;
      });

      // 리뷰 작성 버튼 이벤트 리스너 추가
      orderHTML += `
        <script>
          setTimeout(() => {
            document.querySelectorAll('.review-btn-modal').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const orderIndex = parseInt(e.target.getAttribute('data-order-index'));
                const orderId = e.target.getAttribute('data-order-id');
                const order = ${JSON.stringify(ordersData)}[orderIndex];
                console.log('🔍 모달에서 선택된 주문 정보:', order);
                if (typeof showReviewModalFromOrders === 'function') {
                  showReviewModalFromOrders(order, orderIndex);
                } else {
                  console.error('showReviewModalFromOrders 함수를 찾을 수 없습니다');
                }
              });
            });
          }, 100);
        </script>
      `;
    } else {
      orderHTML += `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p style="font-size: 16px; margin: 0;">주문 내역이 없습니다.</p>
          <p style="font-size: 14px; margin: 10px 0 0 0;">첫 주문을 해보세요! 🍽️</p>
        </div>
      `;
    }

    orderHTML += `
          </div>
        </div>
      </div>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = orderHTML;
    document.body.appendChild(modalDiv);

    console.log('✅ 전체 주문내역 모달 표시 완료');

  } catch (error) {
    console.error('❌ 전체 주문내역 로드 실패:', error);
    alert('주문내역을 불러올 수 없습니다: ' + error.message);
  }
}

// 전역으로 함수 노출
window.renderAllOrderHTML = renderAllOrderHTML;