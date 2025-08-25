
// 결제 모달 관리 모듈

// 결제 처리 기능
async function processPayment() {
  if (!window.currentTable) {
    showPOSNotification('테이블을 먼저 선택해주세요.', 'warning');
    return;
  }

  try {
    const pendingResponse = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/pending-orders`);
    const pendingData = await pendingResponse.json();

    if (pendingData.success && pendingData.hasPendingOrder) {
      showPaymentModalForPendingOrder(pendingData.orderData);
      return;
    }

    const ordersResponse = await fetch(`/api/orders/stores/${window.currentStore.id}?limit=10`);
    const ordersData = await ordersResponse.json();

    if (!ordersData.success) {
      throw new Error('주문 조회 실패');
    }

    const unpaidOrders = ordersData.orders.filter(order => 
      order.tableNumber == window.currentTable && 
      (order.orderStatus === 'completed' || order.orderStatus === 'pending') &&
      (!order.paymentStatus || order.paymentStatus !== 'completed')
    );

    if (unpaidOrders.length === 0) {
      showPOSNotification(`테이블 ${window.currentTable}에 결제할 주문이 없습니다.`, 'warning');
      return;
    }

    showPaymentModal(unpaidOrders);

  } catch (error) {
    console.error('❌ 결제 처리 준비 실패:', error);
    showPOSNotification('결제 처리 준비에 실패했습니다.', 'error');
  }
}

// 메모리 주문용 결제 모달 표시
function showPaymentModalForPendingOrder(orderData) {
  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentModal(event)">
      <div class="payment-modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>💳 추가 주문 결제 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="order-summary">
            <div class="section-title">📋 주문 내역</div>
            <div class="order-card">
              <div><strong>테이블 ${orderData.tableNumber}</strong>
                ${orderData.isTLLOrder ? '<span class="tll-badge">TLL 연동</span>' : ''}
              </div>
              ${orderData.items.map(item => `
                <div class="menu-item">
                  <span>${item.name}</span>
                  <span>x${item.quantity || 1}</span>
                  <span>₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                </div>
              `).join('')}
              <div class="total-line">
                <span>총 금액:</span>
                <span>₩${orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="payment-method-selection">
            <div class="section-title">💳 결제 방법</div>
            <div class="payment-methods">
              <label><input type="radio" name="paymentMethod" value="CARD" checked> 💳 카드</label>
              <label><input type="radio" name="paymentMethod" value="CASH"> 💵 현금</label>
              <label><input type="radio" name="paymentMethod" value="POS"> 📟 POS</label>
            </div>
          </div>

          <div class="customer-type-section">
            <div class="section-title">👤 고객 유형 선택</div>
            <div class="customer-type-options">
              <div class="customer-type-option selected" onclick="selectCustomerType('member')" data-type="member">
                <div>👨‍💼 회원 고객</div>
                <input type="radio" name="customerType" value="member" checked>
              </div>
              <div class="customer-type-option" onclick="selectCustomerType('guest')" data-type="guest">
                <div>👤 비회원 고객</div>
                <input type="radio" name="customerType" value="guest">
              </div>
            </div>

            <div id="guestInfoSection" style="display: none;">
              <div class="guest-info-card">
                <label>전화번호 (선택사항)
                  <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678">
                </label>
                <label>고객 이름 (선택사항)
                  <input type="text" id="paymentGuestName" placeholder="고객 이름">
                </label>
                <div class="info-text">💡 전화번호를 입력하면 재방문시 고객 정보 확인 가능</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closePaymentModal()">취소</button>
          <button class="btn btn-primary" onclick="processPaymentConfirm()">결제 처리</button>
        </div>
      </div>
    </div>
    ${getPaymentModalStyles()}
  `;

  document.body.appendChild(modal);
}

// 고객 유형 선택
function selectCustomerType(type) {
  document.querySelectorAll('.customer-type-option').forEach(option => {
    option.classList.remove('selected');
  });

  const selectedOption = document.querySelector(`[data-type="${type}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }

  const radioBtn = document.querySelector(`input[name="customerType"][value="${type}"]`);
  if (radioBtn) {
    radioBtn.checked = true;
  }

  const guestSection = document.getElementById('guestInfoSection');
  if (guestSection) {
    guestSection.style.display = type === 'guest' ? 'block' : 'none';
  }
}

// 결제 확인 처리
async function processPaymentConfirm() {
  try {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const customerType = document.querySelector('input[name="customerType"]:checked').value;

    const paymentData = {
      paymentMethod: paymentMethod,
      customerType: customerType
    };

    if (customerType === 'guest') {
      const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();
      const guestName = document.getElementById('paymentGuestName')?.value.trim();

      if (guestPhone) paymentData.guestPhone = guestPhone;
      if (guestName) paymentData.guestName = guestName;
    }

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      showPOSNotification(`결제가 완료되었습니다!\n주문번호: ${result.orderId}\n결제금액: ₩${result.finalAmount.toLocaleString()}\n고객: ${result.customerName}`, 'success');
      closePaymentModal();
      if (window.currentTable) {
        await updateDetailPanel(window.currentTable);
      }
    } else {
      showPOSNotification('결제 처리 실패: ' + result.error, 'error');
    }

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
  }
}

// 결제 모달 닫기
function closePaymentModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.remove();
  }
}

// 결제 모달 스타일
function getPaymentModalStyles() {
  return `
    <style>
      .payment-modal-content {
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
      }

      .order-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 14px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        font-size: 16px;
        color: #1e293b;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        margin-top: 12px;
      }

      .payment-methods {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .payment-methods label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }

      .customer-type-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }

      .customer-type-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
      }

      .customer-type-option.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .customer-type-option[data-type="guest"].selected {
        border-color: #f59e0b;
        background: #fef3c7;
      }

      .guest-info-card {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 8px;
        padding: 12px;
      }

      .guest-info-card label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #92400e;
        margin-bottom: 8px;
      }

      .guest-info-card input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #f59e0b;
        border-radius: 4px;
        font-size: 13px;
        outline: none;
        margin-top: 4px;
      }

      .info-text {
        font-size: 11px;
        color: #92400e;
        line-height: 1.3;
        margin-top: 8px;
      }
    </style>
  `;
}

// 전역 함수 등록
window.processPayment = processPayment;
window.selectCustomerType = selectCustomerType;
window.closePaymentModal = closePaymentModal;
