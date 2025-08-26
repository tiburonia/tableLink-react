
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
          <!-- 고객 정보 입력 (일반 POS 주문만) -->
          <div class="customer-info-section">
            <div class="section-title" style="
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f1f5f9;
            ">👤 고객 정보 (선택사항)</div>

            <div style="
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
            ">
              <div style="margin-bottom: 12px;">
                <label style="
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  color: #374151;
                  margin-bottom: 6px;
                ">📞 전화번호 (선택사항)</label>
                <input type="tel" id="paymentGuestPhone" placeholder="010-1234-5678 (입력 시 회원 혜택)" style="
                  width: 100%;
                  padding: 10px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                  transition: border-color 0.2s ease;
                " onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#d1d5db'">
                <div style="
                  font-size: 12px;
                  color: #6b7280;
                  margin-top: 4px;
                  line-height: 1.4;
                ">
                  💡 전화번호 입력 시:
                  <br>• 기존 회원인 경우 자동으로 포인트 적립 및 회원명으로 관리
                  <br>• 신규 고객인 경우 게스트로 등록하여 방문 이력 관리
                </div>
              </div>

              <div style="
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 0;
              ">
                <div style="
                  font-size: 12px;
                  color: #1e40af;
                  font-weight: 600;
                  margin-bottom: 4px;
                ">📋 정보 입력 안내</div>
                <div style="
                  font-size: 11px;
                  color: #3730a3;
                  line-height: 1.4;
                ">
                  • 전화번호를 입력하지 않아도 결제 가능합니다
                  <br>• 전화번호 입력 시 회원/게스트 구분 없이 자동으로 최적의 방식으로 처리됩니다
                  <br>• 기존 회원이면 회원명과 포인트 혜택이, 신규 고객이면 게스트 방문 이력 관리가 적용됩니다
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
  
  // 전화번호 입력 포맷팅 설정
  setupPhoneInputFormatting();
  
  console.log('💳 메모리 주문 결제 모달 표시 완료');
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

    // 전화번호 수집 (선택사항)
    const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();

    // 전화번호가 입력된 경우 형식 검증
    if (guestPhone) {
      const phoneRegex = /^010-?\d{4}-?\d{4}$/;
      if (!phoneRegex.test(guestPhone)) {
        showPOSNotification('올바른 전화번호 형식을 입력해주세요. (010-1234-5678)', 'warning');
        return;
      }
      paymentData.guestPhone = guestPhone.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }

    console.log('💳 메모리 주문 결제 처리 요청:', paymentData);

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      const customerInfo = result.customerName || '고객';
      showPOSNotification(`결제가 완료되었습니다!\n주문번호: ${result.orderId}\n결제금액: ₩${result.finalAmount.toLocaleString()}\n고객: ${customerInfo}`, 'success');
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
window.closePaymentModal = closePaymentModal;
window.processPendingOrderPayment = processPendingOrderPayment;
