// 결제 모달 관리 모듈

// 결제 처리 기능 (세션 기반)
async function processPayment() {
  console.log('💳 processPayment 함수 호출됨');
  
  if (!window.currentTable) {
    showPOSNotification('테이블을 먼저 선택해주세요.', 'warning');
    return;
  }

  try {
    console.log('🔍 세션 정보 조회 중...');
    // 테이블의 현재 세션 조회
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/all-orders`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('세션 정보 조회 실패');
    }

    const currentSession = data.currentSession;

    if (!currentSession) {
      showPOSNotification('결제할 활성 세션이 없습니다.', 'warning');
      return;
    }

    console.log('💳 결제 모달 표시 - 현재 세션:', currentSession);
    showPaymentModal(currentSession);

  } catch (error) {
    console.error('❌ 결제 처리 실패:', error);
    showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
  }
}

// 결제 모달 표시 (세션 기반)
function showPaymentModal(currentSession) {
  // 기존 모달이 있다면 제거
  const existingModal = document.getElementById('paymentModal');
  if (existingModal) {
    existingModal.remove();
  }

  const sessionItems = currentSession.items || [];

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentModal(event)">
      <div class="modal-content payment-modal">
        <div class="modal-header">
          <h2>💳 세션 결제 처리 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="session-summary">
            <div class="section-title">결제할 세션 정보</div>
            
            <div class="session-info-card">
              <div class="session-header">
                <div class="customer-info">
                  <span class="customer-icon">👤</span>
                  <span class="customer-name">${currentSession.customerName}</span>
                  <span class="session-badge">세션</span>
                </div>
                <div class="session-time">
                  시작: ${new Date(currentSession.sessionStarted).toLocaleTimeString()}
                </div>
              </div>

              <div class="session-items">
                <div class="items-header">
                  <span class="items-title">주문 내역 (${sessionItems.length}개)</span>
                </div>
                <div class="items-list">
                  ${sessionItems.map(item => `
                    <div class="session-item">
                      <span class="item-name">${item.menuName}</span>
                      <span class="item-quantity">×${item.quantity}</span>
                      <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
                      <span class="cooking-status status-${item.cookingStatus.toLowerCase()}">${getCookingStatusText(item.cookingStatus)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="session-total">
                <div class="total-label">세션 총 금액</div>
                <div class="total-amount">₩${currentSession.totalAmount.toLocaleString()}</div>
              </div>
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
                <span>세션 항목:</span>
                <span id="sessionItemCount">${sessionItems.length}개</span>
              </div>
              <div class="total-line final">
                <span>총 결제 금액:</span>
                <span id="totalPaymentAmount">₩${currentSession.totalAmount.toLocaleString()}</span>
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

  // 전화번호 입력 포맷팅 설정
  setupPhoneInputFormatting();

  // 세션 기반 결제이므로 결제 버튼 활성화
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

// 결제 요약 정보 업데이트 (세션 기반)
function updatePaymentSummary() {
  console.log('🔄 updatePaymentSummary 호출됨');
  // 세션 기반 결제에서는 별도의 업데이트가 필요하지 않음
  // 결제 버튼은 항상 활성화 상태 (세션이 있는 경우)
  const processBtn = document.getElementById('processPaymentBtn');
  if (processBtn) {
    processBtn.disabled = false;
    console.log('✅ 결제 버튼 활성화됨');
  }
}

// 세션 결제 처리
async function processSelectedPayments() {
  console.log('💳 processSelectedPayments 함수 호출됨');
  
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const guestPhone = document.getElementById('paymentGuestPhone')?.value.trim();
  const totalAmountText = document.getElementById('totalPaymentAmount').textContent;
  const totalAmount = parseInt(totalAmountText.replace(/[₩,]/g, ''));

  const processBtn = document.getElementById('processPaymentBtn');
  processBtn.disabled = true;
  processBtn.textContent = '처리 중...';

  const paymentData = {
    paymentMethod: paymentMethod
  };

  // 전화번호가 입력된 경우 추가
  if (guestPhone) {
    paymentData.guestPhone = guestPhone;
  }

  console.log('💳 세션 결제 처리 요청:', paymentData);
  console.log('🔗 요청 URL:', `/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`);

  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 결제 API 응답 상태:', response.status);
    const result = await response.json();
    console.log('📊 결제 API 응답 데이터:', result);

    if (result.success) {
      console.log('✅ 결제 성공 - UI 업데이트 시작');
      
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
      if (window.currentTable && typeof window.renderTableDetailPanel === 'function') {
        window.renderTableDetailPanel(window.currentTable);
      }

      console.log(`✅ 결제 완료 - 테이블 ${window.currentTable} 세션 자동 해제 완료`);
      window.showPOSNotification(`테이블 ${window.currentTable}이 자동으로 해제되었습니다.`, 'info');
    } else {
      console.log('❌ 결제 실패:', result.error);
      window.showPOSNotification('결제 처리 실패: ' + result.error, 'error');
    }
  } catch (error) {
    console.error('❌ 결제 처리 중 오류:', error);
    window.showPOSNotification('결제 처리 중 오류가 발생했습니다.', 'error');
  } finally {
    // Re-enable button and reset text
    console.log('🔄 결제 버튼 상태 복원');
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

// 조리 상태 텍스트 변환
function getCookingStatusText(status) {
  const statusMap = {
    'PENDING': '대기중',
    'COOKING': '조리중', 
    'COMPLETED': '완료',
    'SERVED': '서빙완료'
  };
  return statusMap[status] || status;
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
// POS 결제 모달 - TLG 연동 및 고급 결제 기능

let paymentModalState = {
  isOpen: false,
  selectedMethod: null,
  customerInfo: null,
  calculatedAmount: 0,
  discountAmount: 0
};

// 결제 모달 표시
function showPaymentModal() {
  // 결제 가능 여부 확인
  if (!window.confirmedOrder || window.confirmedOrder.length === 0) {
    showPOSNotification('결제할 확정된 주문이 없습니다.', 'warning');
    return;
  }

  if (window.hasUnconfirmedChanges || (window.pendingOrder && window.pendingOrder.length > 0)) {
    showPOSNotification('미확정 주문이 있습니다. 먼저 주문을 확정해주세요.', 'warning');
    return;
  }

  // 금액 계산
  const totalAmount = window.confirmedOrder.reduce((sum, item) => 
    sum + (parseInt(item.price) * parseInt(item.quantity)), 0);
  const totalDiscount = window.confirmedOrder.reduce((sum, item) => 
    sum + (parseInt(item.discount) || 0), 0);
  const finalAmount = totalAmount - totalDiscount;

  paymentModalState.calculatedAmount = finalAmount;
  paymentModalState.discountAmount = totalDiscount;
  paymentModalState.isOpen = true;

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.className = 'payment-modal-overlay';
  modal.innerHTML = `
    <div class="payment-modal-content">
      <div class="payment-modal-header">
        <h2>💳 결제 처리</h2>
        <button class="modal-close-btn" onclick="closePaymentModal()">✕</button>
      </div>

      <div class="payment-modal-body">
        <!-- 주문 요약 -->
        <div class="payment-order-summary">
          <h3>📋 주문 내역</h3>
          <div class="payment-summary-details">
            <div class="summary-row">
              <span>총 상품 금액:</span>
              <span>₩${totalAmount.toLocaleString()}</span>
            </div>
            ${totalDiscount > 0 ? `
            <div class="summary-row discount">
              <span>할인 금액:</span>
              <span>-₩${totalDiscount.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>최종 결제 금액:</span>
              <span class="final-amount">₩${finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- TLG 연동 섹션 -->
        <div class="tlg-integration-section">
          <h3>📱 TLG 연동 (선택사항)</h3>
          <div class="customer-info-input">
            <label for="customerPhone">고객 전화번호:</label>
            <input type="tel" id="customerPhone" placeholder="010-0000-0000" 
                   onInput="formatPhoneNumber(this)" maxlength="13">
            <button type="button" onclick="checkCustomerInfo()" class="check-customer-btn">
              고객 확인
            </button>
          </div>
          <div id="customerInfoDisplay" class="customer-info-display" style="display: none;">
            <!-- 고객 정보가 여기에 표시됩니다 -->
          </div>
        </div>

        <!-- 결제 방법 선택 -->
        <div class="payment-methods-section">
          <h3>💳 결제 방법 선택</h3>
          <div class="payment-methods-grid">
            <button class="payment-method-btn" data-method="CARD" onclick="selectPaymentMethod('CARD')">
              <div class="payment-icon">💳</div>
              <div class="payment-name">신용카드</div>
              <div class="payment-desc">VAN 카드 결제</div>
            </button>
            <button class="payment-method-btn" data-method="CASH" onclick="selectPaymentMethod('CASH')">
              <div class="payment-icon">💵</div>
              <div class="payment-name">현금</div>
              <div class="payment-desc">현금 결제</div>
            </button>
            <button class="payment-method-btn" data-method="MOBILE" onclick="selectPaymentMethod('MOBILE')">
              <div class="payment-icon">📱</div>
              <div class="payment-name">간편결제</div>
              <div class="payment-desc">모바일 결제</div>
            </button>
            <button class="payment-method-btn" data-method="TL_PAY" onclick="selectPaymentMethod('TL_PAY')">
              <div class="payment-icon">🎁</div>
              <div class="payment-name">TL Pay</div>
              <div class="payment-desc">포인트 + 카드</div>
            </button>
          </div>
        </div>

        <!-- 추가 할인 옵션 -->
        <div class="additional-discount-section">
          <h3>🎯 추가 할인</h3>
          <div class="discount-options">
            <div class="discount-input-group">
              <label for="additionalDiscount">추가 할인 금액:</label>
              <input type="number" id="additionalDiscount" placeholder="0" min="0" 
                     onInput="updatePaymentAmount()">
              <span>원</span>
            </div>
            <div class="discount-buttons">
              <button onclick="applyQuickDiscount(1000)">1천원</button>
              <button onclick="applyQuickDiscount(5000)">5천원</button>
              <button onclick="applyQuickDiscount(10000)">1만원</button>
              <button onclick="applyPercentDiscount(10)">10%</button>
            </div>
          </div>
        </div>
      </div>

      <div class="payment-modal-footer">
        <button class="modal-cancel-btn" onclick="closePaymentModal()">취소</button>
        <button class="modal-confirm-btn" id="confirmPaymentBtn" onclick="confirmModalPayment()" disabled>
          결제 진행
        </button>
      </div>
    </div>

    <style>
      .payment-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      .payment-modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.3s ease;
      }

      .payment-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border-radius: 16px 16px 0 0;
      }

      .payment-modal-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .modal-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .modal-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .payment-modal-body {
        padding: 24px;
      }

      .payment-order-summary,
      .tlg-integration-section,
      .payment-methods-section,
      .additional-discount-section {
        margin-bottom: 24px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      }

      .payment-order-summary h3,
      .tlg-integration-section h3,
      .payment-methods-section h3,
      .additional-discount-section h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .payment-summary-details {
        background: #f9fafb;
        padding: 16px;
        border-radius: 8px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .summary-row.total {
        font-weight: 600;
        font-size: 16px;
        color: #1f2937;
        border-top: 1px solid #d1d5db;
        padding-top: 8px;
        margin-top: 8px;
      }

      .summary-row.discount {
        color: #dc2626;
      }

      .customer-info-input {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 12px;
      }

      .customer-info-input label {
        font-weight: 500;
        color: #374151;
        min-width: 100px;
      }

      .customer-info-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }

      .check-customer-btn {
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .check-customer-btn:hover {
        background: #2563eb;
      }

      .customer-info-display {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 12px;
        font-size: 14px;
      }

      .payment-methods-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .payment-method-btn {
        padding: 16px;
        border: 2px solid #e5e7eb;
        background: white;
        border-radius: 12px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
        position: relative;
      }

      .payment-method-btn:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }

      .payment-method-btn.selected {
        border-color: #3b82f6;
        background: #eff6ff;
        box-shadow: 0 0 0 1px #3b82f6;
      }

      .payment-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .payment-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .payment-desc {
        font-size: 12px;
        color: #6b7280;
      }

      .discount-input-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      .discount-input-group label {
        font-weight: 500;
        color: #374151;
        min-width: 120px;
      }

      .discount-input-group input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        text-align: right;
      }

      .discount-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .discount-buttons button {
        padding: 6px 12px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .discount-buttons button:hover {
        background: #e5e7eb;
        border-color: #9ca3af;
      }

      .payment-modal-footer {
        padding: 20px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: #f9fafb;
        border-radius: 0 0 16px 16px;
      }

      .modal-cancel-btn,
      .modal-confirm-btn {
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .modal-cancel-btn {
        background: white;
        border: 2px solid #d1d5db;
        color: #374151;
      }

      .modal-cancel-btn:hover {
        border-color: #9ca3af;
        background: #f9fafb;
      }

      .modal-confirm-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        color: white;
        min-width: 120px;
      }

      .modal-confirm-btn:enabled:hover {
        background: linear-gradient(135deg, #059669, #047857);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .modal-confirm-btn:disabled {
        background: #d1d5db;
        color: #9ca3af;
        cursor: not-allowed;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .customer-info-card {
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
      }

      .customer-name {
        font-weight: 600;
        color: #0c4a6e;
        font-size: 16px;
        margin-bottom: 8px;
      }

      .customer-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        font-size: 14px;
        color: #075985;
      }

      .customer-detail-item {
        display: flex;
        justify-content: space-between;
      }

      .tl-member-badge {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    </style>
  `;

  document.body.appendChild(modal);
  
  // 모달 외부 클릭시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePaymentModal();
    }
  });

  console.log(`💳 결제 모달 표시 - 총 금액: ₩${finalAmount.toLocaleString()}`);
}

// 전화번호 포맷팅
function formatPhoneNumber(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value.length >= 3) {
    if (value.length >= 7) {
      value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else {
      value = value.replace(/(\d{3})(\d{4})/, '$1-$2');
    }
  }
  
  input.value = value;
}

// 고객 정보 확인
async function checkCustomerInfo() {
  const phoneInput = document.getElementById('customerPhone');
  const phone = phoneInput.value.trim();

  if (!phone) {
    showPOSNotification('전화번호를 입력해주세요.', 'warning');
    return;
  }

  // 전화번호 유효성 검사
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    showPOSNotification('올바른 전화번호 형식이 아닙니다. (010-0000-0000)', 'warning');
    return;
  }

  try {
    console.log(`🔍 고객 정보 조회: ${phone}`);

    // 회원 정보 확인
    const response = await fetch(`/api/auth/check-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone })
    });

    const data = await response.json();

    const customerDisplay = document.getElementById('customerInfoDisplay');
    
    if (data.success && data.customer) {
      // 기존 회원
      const customer = data.customer;
      paymentModalState.customerInfo = {
        type: 'member',
        userId: customer.id,
        name: customer.name,
        phone: phone,
        points: customer.points || 0,
        level: customer.level || 'BRONZE'
      };

      customerDisplay.innerHTML = `
        <div class="customer-info-card">
          <div class="customer-name">
            ${customer.name} 님 <span class="tl-member-badge">TL 회원</span>
          </div>
          <div class="customer-details">
            <div class="customer-detail-item">
              <span>보유 포인트:</span>
              <span class="customer-points">${(customer.points || 0).toLocaleString()}P</span>
            </div>
            <div class="customer-detail-item">
              <span>회원 등급:</span>
              <span class="customer-level">${customer.level || 'BRONZE'}</span>
            </div>
            <div class="customer-detail-item">
              <span>전화번호:</span>
              <span>${phone}</span>
            </div>
            <div class="customer-detail-item">
              <span>가입일:</span>
              <span>${new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `;
      customerDisplay.style.display = 'block';

      showPOSNotification(`✅ TL 회원 확인: ${customer.name}님`, 'success');

    } else {
      // 게스트 또는 신규
      paymentModalState.customerInfo = {
        type: 'guest',
        userId: null,
        name: '게스트',
        phone: phone,
        points: 0,
        level: null
      };

      customerDisplay.innerHTML = `
        <div class="customer-info-card">
          <div class="customer-name">게스트 고객</div>
          <div class="customer-details">
            <div class="customer-detail-item">
              <span>전화번호:</span>
              <span>${phone}</span>
            </div>
            <div class="customer-detail-item">
              <span>포인트 적립:</span>
              <span class="earn-points">+${Math.floor(paymentModalState.calculatedAmount * 0.01).toLocaleString()}P 적립 예정</span>
            </div>
          </div>
        </div>
      `;
      customerDisplay.style.display = 'block';

      showPOSNotification(`📱 게스트로 결제 진행 (포인트 적립 예정)`, 'info');
    }

  } catch (error) {
    console.error('❌ 고객 정보 조회 실패:', error);
    showPOSNotification('고객 정보 조회 중 오류가 발생했습니다.', 'error');
  }
}

// 결제 방법 선택
function selectPaymentMethod(method) {
  paymentModalState.selectedMethod = method;

  // 모든 버튼에서 selected 클래스 제거
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  // 선택된 버튼에 selected 클래스 추가
  const selectedBtn = document.querySelector(`[data-method="${method}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }

  // 확인 버튼 활성화
  const confirmBtn = document.getElementById('confirmPaymentBtn');
  if (confirmBtn) {
    confirmBtn.disabled = false;
  }

  console.log(`💳 결제 방법 선택: ${method}`);
}

// 빠른 할인 적용
function applyQuickDiscount(amount) {
  const discountInput = document.getElementById('additionalDiscount');
  if (discountInput) {
    discountInput.value = amount;
    updatePaymentAmount();
  }
}

// 퍼센트 할인 적용
function applyPercentDiscount(percent) {
  const baseAmount = paymentModalState.calculatedAmount;
  const discountAmount = Math.floor(baseAmount * (percent / 100));
  
  const discountInput = document.getElementById('additionalDiscount');
  if (discountInput) {
    discountInput.value = discountAmount;
    updatePaymentAmount();
  }
}

// 결제 금액 업데이트
function updatePaymentAmount() {
  const discountInput = document.getElementById('additionalDiscount');
  const additionalDiscount = parseInt(discountInput.value) || 0;
  
  const baseAmount = paymentModalState.calculatedAmount;
  const totalDiscount = paymentModalState.discountAmount + additionalDiscount;
  const finalAmount = Math.max(0, baseAmount - additionalDiscount);

  // 최종 금액 표시 업데이트
  const finalAmountElement = document.querySelector('.final-amount');
  if (finalAmountElement) {
    finalAmountElement.textContent = `₩${finalAmount.toLocaleString()}`;
  }

  // 할인이 너무 큰 경우 경고
  if (additionalDiscount > baseAmount) {
    showPOSNotification('할인 금액이 상품 금액보다 클 수 없습니다.', 'warning');
    discountInput.value = baseAmount;
    return;
  }

  console.log(`💰 결제 금액 업데이트: ₩${finalAmount.toLocaleString()} (추가할인: ₩${additionalDiscount.toLocaleString()})`);
}

// 모달 결제 확정
async function confirmModalPayment() {
  if (!paymentModalState.selectedMethod) {
    showPOSNotification('결제 방법을 선택해주세요.', 'warning');
    return;
  }

  try {
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '결제 처리 중...';
    }

    // 추가 할인 적용
    const additionalDiscount = parseInt(document.getElementById('additionalDiscount').value) || 0;
    if (additionalDiscount > 0) {
      await applyAdditionalDiscount(additionalDiscount);
    }

    // 결제 처리
    await processPayment(paymentModalState.selectedMethod, paymentModalState.customerInfo);

    closePaymentModal();

  } catch (error) {
    console.error('❌ 모달 결제 처리 실패:', error);
    showPOSNotification(`결제 처리 실패: ${error.message}`, 'error');
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '결제 진행';
    }
  }
}

// 추가 할인 적용
async function applyAdditionalDiscount(discountAmount) {
  if (discountAmount <= 0) return;

  console.log(`🎯 추가 할인 적용: ₩${discountAmount.toLocaleString()}`);

  // 전체 주문에 균등하게 할인 분배
  const totalItems = window.confirmedOrder.reduce((sum, item) => sum + item.quantity, 0);
  const discountPerItem = Math.floor(discountAmount / totalItems);

  window.confirmedOrder.forEach(item => {
    item.discount = (item.discount || 0) + discountPerItem;
  });

  // 나머지 할인을 첫 번째 아이템에 추가
  const remainingDiscount = discountAmount - (discountPerItem * totalItems);
  if (remainingDiscount > 0 && window.confirmedOrder.length > 0) {
    window.confirmedOrder[0].discount = (window.confirmedOrder[0].discount || 0) + remainingDiscount;
  }

  // UI 업데이트
  renderOrderItems();
  renderPaymentSummary();
}

// 결제 모달 닫기
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.remove();
  }

  // 상태 초기화
  paymentModalState.isOpen = false;
  paymentModalState.selectedMethod = null;
  paymentModalState.customerInfo = null;

  console.log('💳 결제 모달 닫기');
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && paymentModalState.isOpen) {
    closePaymentModal();
  }
});

// 전역 함수 등록
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.selectPaymentMethod = selectPaymentMethod;
window.checkCustomerInfo = checkCustomerInfo;
window.formatPhoneNumber = formatPhoneNumber;
window.confirmModalPayment = confirmModalPayment;
window.applyQuickDiscount = applyQuickDiscount;
window.applyPercentDiscount = applyPercentDiscount;
window.updatePaymentAmount = updatePaymentAmount;

console.log('✅ POS 결제 모달 로드 완료 - TLG 연동 지원');
