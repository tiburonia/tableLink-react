
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
    <div class="modal-overlay" onclick="closePaymentModal(event)" style="
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
    ">
      <div class="payment-modal-content" onclick="event.stopPropagation()" style="
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
        overflow: hidden;
      ">
        <div class="modal-header" style="
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        ">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">💳 ${orderData.isTLLOrder ? 'TLL 연동' : '추가'} 주문 결제 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()" style="
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
          ">✕</button>
        </div>

        <div class="modal-body" style="
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        ">
          <!-- 주문 내역 -->
          <div class="order-summary">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">📋 주문 내역</div>

            <div style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
            ">
              <div style="margin-bottom: 12px;">
                <strong style="color: #1e293b;">테이블 ${orderData.tableNumber}</strong>
                ${orderData.isTLLOrder ? `<span style="
                  font-size: 12px;
                  background: #3b82f6;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  margin-left: 8px;
                ">TLL 연동</span>` : ''}
                ${orderData.customerName ? `<span style="
                  font-size: 12px;
                  background: #10b981;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  margin-left: 8px;
                ">${orderData.customerName}</span>` : ''}
              </div>

              ${orderData.items.map(item => `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 4px 0;
                  font-size: 14px;
                ">
                  <span style="color: #374151; font-weight: 600;">${item.name}</span>
                  <span style="
                    color: #6b7280;
                    background: #e2e8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 700;
                    margin: 0 8px;
                  ">x${item.quantity || 1}</span>
                  <span style="color: #059669; font-weight: 700;">₩${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                </div>
              `).join('')}

              <div style="
                border-top: 1px solid #e2e8f0;
                margin-top: 12px;
                padding-top: 12px;
                display: flex;
                justify-content: space-between;
                font-weight: 700;
                font-size: 16px;
                color: #1e293b;
              ">
                <span>총 금액:</span>
                <span style="color: #059669;">₩${orderData.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- 결제 방법 선택 -->
          <div class="payment-method-selection">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">💳 결제 방법</div>

            <div style="
              display: flex;
              gap: 16px;
              margin-bottom: 16px;
              flex-wrap: wrap;
            ">
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="CARD" checked style="accent-color: #3b82f6;">
                <span>💳 카드</span>
              </label>
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="CASH" style="accent-color: #3b82f6;">
                <span>💵 현금</span>
              </label>
              <label style="
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                <input type="radio" name="paymentMethod" value="POS" style="accent-color: #3b82f6;">
                <span>📟 POS</span>
              </label>
            </div>
          </div>

          ${!orderData.isTLLOrder ? `
          <!-- 고객 유형 선택 (일반 POS 주문만) -->
          <div class="customer-type-section">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">👤 고객 유형 선택</div>

            <div class="customer-type-options" style="
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-bottom: 16px;
            ">
              <div class="customer-type-option selected" onclick="selectCustomerType('member')" data-type="member" style="
                display: flex;
                align-items: center;
                padding: 12px;
                border: 2px solid #3b82f6;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #eff6ff;
              ">
                <div class="option-icon" style="font-size: 20px; margin-right: 12px;">👨‍💼</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">회원 고객</div>
                  <div class="option-desc" style="font-size: 12px; color: #64748b;">POS 시스템 회원으로 처리</div>
                </div>
                <div class="option-radio" style="margin-left: 8px;">
                  <input type="radio" name="customerType" value="member" checked style="width: 18px; height: 18px; accent-color: #3b82f6;">
                </div>
              </div>

              <div class="customer-type-option" onclick="selectCustomerType('guest')" data-type="guest" style="
                display: flex;
                align-items: center;
                padding: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
              ">
                <div class="option-icon" style="font-size: 20px; margin-right: 12px;">👤</div>
                <div class="option-content" style="flex: 1;">
                  <div class="option-title" style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">비회원 고객</div>
                  <div class="option-desc" style="font-size: 12px; color: #64748b;">전화번호로 계정 관리 (기존 고객 자동 연결)</div>
                </div>
                <div class="option-radio" style="margin-left: 8px;">
                  <input type="radio" name="customerType" value="guest" style="width: 18px; height: 18px; accent-color: #f59e0b;">
                </div>
              </div>
            </div>

            <!-- 비회원 정보 입력 (초기에는 숨김) -->
            <div id="guestInfoSection" style="display: none;">
              <div style="
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 12px;
                animation: fadeIn 0.3s ease;
              ">
                <div style="margin-bottom: 8px;">
                  <label style="
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 4px;
                  ">전화번호 (권장)</label>
                  <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678" style="
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    font-size: 13px;
                    outline: none;
                  ">
                  <div style="
                    font-size: 10px;
                    color: #92400e;
                    margin-top: 2px;
                    line-height: 1.3;
                  ">💡 전화번호 입력 시 포인트 적립 및 주문 이력 관리가 가능합니다</div>
                </div>
                <div style="margin-bottom: 8px;">
                  <label style="
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 4px;
                  ">고객 이름 (선택사항)</label>
                  <input type="text" id="paymentGuestName" placeholder="고객 이름" style="
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #f59e0b;
                    border-radius: 4px;
                    font-size: 13px;
                    outline: none;
                  ">
                </div>
                <div style="
                  font-size: 11px;
                  color: #92400e;
                  line-height: 1.3;
                ">
                  💡 전화번호를 입력하면 재방문시 고객 정보 확인 가능
                </div>
              </div>
            </div>
          </div>
          ` : `
          <!-- TLL 연동 주문 안내 -->
          <div class="tll-info-section">
            <div style="
              background: #eff6ff;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
            ">
              <div style="font-size: 16px; margin-bottom: 8px;">🔗</div>
              <div style="font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 4px;">TLL 연동 주문</div>
              <div style="font-size: 12px; color: #3730a3;">기존 TLL 주문에 추가된 메뉴입니다.<br>고객 정보는 자동으로 연결됩니다.</div>
            </div>
          </div>
          `}
        </div>

        <div class="modal-footer" style="
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-shrink: 0;
        ">
          <button class="btn btn-secondary" onclick="closePaymentModal()" style="
            padding: 10px 20px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            background: white;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">취소</button>
          <button class="btn btn-primary" onclick="processPendingOrderPayment()" style="
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #3b82f6;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">결제 처리</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .customer-type-option.selected {
        border-color: #3b82f6 !important;
        background: #eff6ff !important;
      }

      .customer-type-option[data-type="guest"].selected {
        border-color: #f59e0b !important;
        background: #fef3c7 !important;
      }

      .btn:hover {
        transform: translateY(-1px);
      }

      .btn-secondary:hover {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
      }

      .btn-primary:hover {
        background: #2563eb !important;
      }
    </style>
  `;

  document.body.appendChild(modal);
  console.log('💳 메모리 주문 결제 모달 표시 완료');
}

// 고객 유형 선택
function selectCustomerType(type) {
  document.querySelectorAll('.customer-type-option').forEach(option => {
    option.classList.remove('selected');
    option.style.borderColor = '#e2e8f0';
    option.style.background = 'white';
  });

  const selectedOption = document.querySelector(`[data-type="${type}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
    if (type === 'member') {
      selectedOption.style.borderColor = '#3b82f6';
      selectedOption.style.background = '#eff6ff';
    } else {
      selectedOption.style.borderColor = '#f59e0b';
      selectedOption.style.background = '#fef3c7';
    }
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

// 메모리 주문 결제 처리
async function processPendingOrderPayment() {
  try {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const processBtn = document.querySelector('.btn-primary');
    if (processBtn) {
      processBtn.disabled = true;
      processBtn.textContent = '처리 중...';
    }

    const paymentData = {
      paymentMethod: paymentMethod
    };

    // 비TLL 주문인 경우에만 고객 유형 처리
    const customerTypeRadio = document.querySelector('input[name="customerType"]:checked');
    if (customerTypeRadio) {
      const customerType = customerTypeRadio.value;
      paymentData.customerType = customerType;

      if (customerType === 'guest') {
        const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();
        const guestName = document.getElementById('paymentGuestName')?.value.trim();

        if (guestPhone) paymentData.guestPhone = guestPhone;
        if (guestName) paymentData.guestName = guestName;
      }
    }

    console.log('💳 메모리 주문 결제 처리 요청:', paymentData);

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      showPOSNotification(`결제가 완료되었습니다!\n주문번호: ${result.orderId}\n결제금액: ₩${result.finalAmount.toLocaleString()}\n고객: ${result.customerName}`, 'success');
      closePaymentModal();
      
      // 테이블 정보 새로고침
      if (window.currentTable) {
        await updateDetailPanel(window.currentTable);
        await refreshTableMap();
      }
    } else {
      showPOSNotification('결제 처리 실패: ' + result.error, 'error');
    }

  } catch (error) {
    console.error('❌ 메모리 주문 결제 처리 실패:', error);
    showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
  } finally {
    const processBtn = document.querySelector('.btn-primary');
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.textContent = '결제 처리';
    }
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

// 전역 함수 등록
window.processPayment = processPayment;
window.selectCustomerType = selectCustomerType;
window.closePaymentModal = closePaymentModal;
window.processPendingOrderPayment = processPendingOrderPayment;
