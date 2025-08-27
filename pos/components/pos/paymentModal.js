// 결제 모달 관리 모듈

// 결제 처리 기능
async function processPayment() {
  if (!window.currentTable) {
    showPOSNotification('테이블을 먼저 선택해주세요.', 'warning');
    return;
  }

  try {
    // 테이블의 미결제 주문 조회
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/all-orders`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('주문 정보 조회 실패');
    }

    const pendingOrders = data.pendingOrders || [];

    if (pendingOrders.length === 0) {
      showPOSNotification('결제할 주문이 없습니다.', 'warning');
      return;
    }

    showPaymentModal(pendingOrders);

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
  }
}

// 결제 모달 표시
function showPaymentModal(orders) {
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById('paymentModal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentModal(event)">
      <div class="modal-content payment-modal">
        <div class="modal-header">
          <h2>💳 결제 처리 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="payment-orders">
            <div class="section-title">결제할 주문 선택</div>
            <div class="orders-container">
              ${orders.map(order => `
                <div class="payment-order-item" data-order-id="${order.id}">
                  <div class="order-header">
                    <div class="order-info">
                      <span class="customer-name">👤 ${order.customerName}</span>
                      <span class="order-time">${formatOrderTime(order.orderDate)}</span>
                      <span class="source-badge ${order.orderSource?.toLowerCase() || 'pos'}">${getOrderSourceText(order.orderSource || 'POS')}</span>
                    </div>
                    <div class="order-amount">₩${order.finalAmount.toLocaleString()}</div>
                  </div>

                  <div class="order-items">
                    ${order.orderData && order.orderData.items ?
                      order.orderData.items.map(item => `
                        <div class="menu-item">
                          <span class="menu-name">${item.name}</span>
                          <span class="menu-quantity">x${item.quantity || 1}</span>
                          <span class="menu-price">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                        </div>
                      `).join('') :
                      '<div class="no-items">주문 상세 정보 없음</div>'
                    }
                  </div>

                  <div class="order-actions">
                    <label class="payment-checkbox">
                      <input type="checkbox" data-order-id="${order.id}" data-amount="${order.finalAmount}" checked>
                      <span>결제 선택</span>
                    </label>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="payment-summary">
            <div class="section-title">결제 정보</div>

            <!-- 결제 방법 선택 -->
            <div class="payment-method-section">
              <div class="payment-methods">
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="CARD" checked>
                  <span>💳 카드</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="CASH">
                  <span>💵 현금</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="POS">
                  <span>📟 POS 통합</span>
                </label>
              </div>
            </div>

            <!-- 고객 전화번호 입력 (선택사항) -->
            <div class="guest-phone-section">
              <div class="section-subtitle">👤 고객 전화번호 (선택사항)</div>
              <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678" maxlength="13">
              <div class="input-hint">
                전화번호를 입력하면 게스트 고객으로 관리되며, 다음 방문시 고객 정보를 확인할 수 있습니다.
              </div>
            </div>

            <!-- 결제 총계 -->
            <div class="payment-total">
              <div class="total-line">
                <span>선택된 주문:</span>
                <span id="selectedOrderCount">${orders.length}개</span>
              </div>
              <div class="total-line final">
                <span>총 결제 금액:</span>
                <span id="totalPaymentAmount">₩${orders.reduce((sum, order) => sum + order.finalAmount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closePaymentModal()">취소</button>
          <button class="btn btn-primary" onclick="processSelectedPayments()" id="processPaymentBtn">
            결제 처리
          </button>
        </div>
      </div>
    </div>

    <style>
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
      }

      .payment-modal {
        width: 90%;
        max-width: 700px;
        height: 90%;
        max-height: 800px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .section-subtitle {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .orders-container {
        max-height: 300px;
        overflow-y: auto;
      }

      .payment-order-item {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      }

      .payment-order-item.selected {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .order-info {
        flex: 1;
      }

      .customer-name {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-right: 8px;
      }

      .order-time {
        font-size: 12px;
        color: #64748b;
        margin-right: 8px;
      }

      .source-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .source-badge.tll {
        background: #3b82f6;
        color: white;
      }

      .source-badge.pos {
        background: #10b981;
        color: white;
      }

      .order-amount {
        font-size: 18px;
        font-weight: 800;
        color: #059669;
        background: #ecfdf5;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #bbf7d0;
      }

      .order-items {
        background: #f1f5f9;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }

      .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 14px;
      }

      .menu-name {
        flex: 1;
        color: #374151;
        font-weight: 600;
      }

      .menu-quantity {
        color: #6b7280;
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 700;
        margin: 0 8px;
      }

      .menu-price {
        color: #059669;
        font-weight: 700;
        font-size: 14px;
      }

      .payment-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      }

      .payment-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #3b82f6;
      }

      .payment-summary {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
      }

      .payment-methods {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .payment-method-option {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }

      .payment-method-option input[type="radio"] {
        accent-color: #3b82f6;
      }

      .guest-phone-section {
        margin-bottom: 20px;
      }

      #paymentGuestPhone {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      #paymentGuestPhone:focus {
        border-color: #3b82f6;
      }

      .input-hint {
        font-size: 12px;
        color: #6b7280;
        margin-top: 6px;
        line-height: 1.4;
      }

      .payment-total {
        border-top: 2px solid #e2e8f0;
        padding-top: 16px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #475569;
      }

      .total-line.final {
        font-weight: 700;
        font-size: 16px;
        color: #1e293b;
        border-top: 1px solid #cbd5e1;
        padding-top: 8px;
        margin-top: 8px;
      }

      .total-line.final span:last-child {
        color: #059669;
        font-weight: 800;
      }

      .modal-footer {
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #64748b;
        border: 2px solid #e2e8f0;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .no-items {
        text-align: center;
        color: #9ca3af;
        padding: 12px;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;

  document.body.appendChild(modal);

  // 체크박스 이벤트 리스너 추가
  const checkboxes = modal.querySelectorAll('input[type="checkbox"][data-order-id]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updatePaymentSummary);
  });

  // 전화번호 입력 포맷팅 설정
  setupPhoneInputFormatting();

  updatePaymentSummary();
  console.log('💳 결제 모달 표시 완료');
}

// 전화번호 형식 자동 변환
function formatPhoneNumber(input) {
  const value = input.value.replace(/[^0-9]/g, '');
  if (value.length >= 11) {
    input.value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
}

// 전화번호 입력 필드에 이벤트 리스너 추가
function setupPhoneInputFormatting() {
  const phoneInput = document.getElementById('paymentGuestPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      formatPhoneNumber(this);
    });
  }
}

// 결제 요약 정보 업데이트
function updatePaymentSummary() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-order-id]:checked');
  const selectedCount = checkboxes.length;
  const totalAmount = Array.from(checkboxes).reduce((sum, checkbox) => {
    return sum + parseInt(checkbox.dataset.amount);
  }, 0);

  document.getElementById('selectedOrderCount').textContent = `${selectedCount}개`;
  document.getElementById('totalPaymentAmount').textContent = `₩${totalAmount.toLocaleString()}`;

  const processBtn = document.getElementById('processPaymentBtn');
  processBtn.disabled = selectedCount === 0;

  // 선택된 주문 아이템 하이라이트
  document.querySelectorAll('.payment-order-item').forEach(item => {
    const orderId = item.dataset.orderId;
    const checkbox = document.querySelector(`input[type="checkbox"][data-order-id="${orderId}"]`);
    if (checkbox && checkbox.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// 선택된 주문들 결제 처리
async function processSelectedPayments() {
  // 현재 세션 확인
  const currentSession = document.querySelector('.current-session'); // This selector might need adjustment based on actual implementation
  if (!currentSession) {
    showPOSNotification('결제할 활성 세션이 없습니다.', 'warning'); // Use showPOSNotification for consistency
    return;
  }

  // Assuming 'currentSession' will contain the total amount for the session
  const sessionAmountElement = currentSession.querySelector('.session-amount'); // Adjust selector if needed
  if (!sessionAmountElement) {
    showPOSNotification('세션 금액 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  const sessionAmount = sessionAmountElement.textContent.replace(/[₩,]/g, '');
  const totalAmount = parseInt(sessionAmount);


  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();

  // Note: The original code selected individual orders. The new requirement implies paying for the whole session.
  // We need to get the order IDs associated with the current session.
  // This part will heavily depend on how the 'currentSession' element or data is structured.
  // For now, let's assume we can get all checked order IDs to represent the session's items.
  const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"][data-order-id]:checked');
  if (selectedCheckboxes.length === 0) {
    showPOSNotification('결제할 주문을 선택해주세요.', 'warning');
    return;
  }

  // In the new model, we are paying for the session, not individual orders.
  // So, we should ideally send a single order ID representing the session, or a list of items for the session.
  // For now, we'll pass the order IDs that were checked, assuming they represent the session.
  // A more robust implementation would fetch the session's primary order ID.
  const orderIdsForSession = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.orderId));


  const processBtn = document.getElementById('processPaymentBtn');
  processBtn.disabled = true;
  processBtn.textContent = '처리 중...';

  const paymentData = {
    // Assuming we're sending a single orderId for the session, or a representation of the session.
    // If 'orderIdsForSession' represents all items in the current session's order,
    // this might need to be adjusted to send a single 'orderId' that represents the session.
    orderIds: orderIdsForSession, // This might need to be changed to a single session order ID
    totalAmount: totalAmount, // Sending the total amount for the session
    paymentMethod: paymentMethod
  };

  // 전화번호가 입력된 경우 추가
  if (guestPhone) {
    paymentData.guestPhone = guestPhone;
  }

  console.log('💳 결제 처리 요청 (세션 기반):', paymentData);

  // Assuming the API endpoint handles session-based payment processing
  const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });

  const result = await response.json();

  if (result.success) {
    // 결제 성공 후 UI 업데이트
    window.showPOSNotification(
      `테이블 ${window.currentTable} 세션 결제 완료 (총 ₩${totalAmount.toLocaleString()})`,
      'success'
    );

    // 모달 닫기
    closePaymentModal();

    // 테이블 정보 새로고침 (결제 완료로 인한 자동 해제 반영)
    await window.loadTables();
    window.renderTableMap();

    // 현재 선택된 테이블 정보 업데이트 (점유 상태 해제 반영)
    if (window.currentTable) {
      window.updateDetailPanel(window.currentTable);
    }

    console.log(`✅ 결제 완료 - 테이블 ${window.currentTable} 세션 자동 해제 완료`);
    window.showPOSNotification(`테이블 ${window.currentTable}이 자동으로 해제되었습니다.`, 'info');
  } else {
    // alert('결제 처리 실패: ' + result.error); // Use showPOSNotification
    showPOSNotification('결제 처리 실패: ' + result.error, 'error');
  }

  // Re-enable button and reset text
  if (processBtn) {
    processBtn.disabled = false;
    processBtn.textContent = '결제 처리';
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

// 시간 포맷팅 함수
function formatOrderTime(orderDate) {
  const date = new Date(orderDate);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
}

// 주문 소스 텍스트 변환
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL 주문',
    'POS': 'POS 주문',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}

// 전역 함수 등록
window.processPayment = processPayment;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.updatePaymentSummary = updatePaymentSummary;
window.processSelectedPayments = processSelectedPayments;