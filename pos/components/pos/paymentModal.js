
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

// 결제 모달 표시 (TLL 연동 전화번호 입력 포함)
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
          <h2>💳 결제 처리 - 테이블 ${window.currentTable}</h2>
          <button class="close-btn" onclick="closePaymentModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- 세션 요약 정보 -->
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

          <!-- 결제 정보 입력 -->
          <div class="payment-section">
            <div class="section-title">결제 정보</div>

            <!-- TLL 연동을 위한 전화번호 입력 -->
            <div class="tll-connection-section">
              <div class="section-subtitle">
                <span class="tll-icon">📱</span>
                TLL 연동 (선택사항)
              </div>
              <div class="phone-input-wrapper">
                <input 
                  type="tel" 
                  id="paymentGuestPhone" 
                  placeholder="010-0000-0000" 
                  maxlength="13"
                  class="phone-input"
                >
                <button id="phoneVerifyBtn" class="verify-btn" onclick="verifyPhoneNumber()">
                  확인
                </button>
              </div>
              <div class="phone-input-hint">
                전화번호를 입력하면 TLL 회원/게스트로 연동되어 포인트 적립 및 주문 이력 관리가 됩니다.
              </div>
              <div id="phoneVerificationResult" class="verification-result"></div>
            </div>

            <!-- 결제 방법 선택 -->
            <div class="payment-method-section">
              <div class="section-subtitle">결제 방법</div>
              <div class="payment-methods">
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="CARD" checked>
                  <span class="method-icon">💳</span>
                  <span>카드결제</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="CASH">
                  <span class="method-icon">💵</span>
                  <span>현금결제</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="TRANSFER">
                  <span class="method-icon">🏦</span>
                  <span>계좌이체</span>
                </label>
              </div>
            </div>

            <!-- 결제 총계 -->
            <div class="payment-total">
              <div class="total-line">
                <span>세션 항목:</span>
                <span id="sessionItemCount">${sessionItems.length}개</span>
              </div>
              <div class="total-line">
                <span>기본 금액:</span>
                <span id="baseAmount">₩${currentSession.totalAmount.toLocaleString()}</span>
              </div>
              <div class="total-line discount-line" id="discountLine" style="display: none;">
                <span>TLL 회원 할인:</span>
                <span id="discountAmount">₩0</span>
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
        max-width: 800px;
        height: 90%;
        max-height: 900px;
        background: white;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
        overflow: hidden;
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
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
        border-radius: 50%;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: #e2e8f0;
      }

      .modal-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-subtitle {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .session-info-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
      }

      .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .customer-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .customer-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .session-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        background: #3b82f6;
        color: white;
      }

      .session-time {
        font-size: 12px;
        color: #64748b;
      }

      .items-header {
        margin-bottom: 12px;
      }

      .items-title {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
      }

      .items-list {
        background: white;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #e2e8f0;
      }

      .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .session-item:last-child {
        border-bottom: none;
      }

      .item-name {
        flex: 1;
        color: #374151;
        font-weight: 600;
      }

      .item-quantity {
        color: #6b7280;
        background: #e2e8f0;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 700;
        margin: 0 8px;
      }

      .item-price {
        color: #059669;
        font-weight: 700;
        font-size: 14px;
        margin-right: 12px;
      }

      .cooking-status {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-cooking {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-completed {
        background: #d1fae5;
        color: #065f46;
      }

      .session-total {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 2px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .total-label {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .total-amount {
        font-size: 20px;
        font-weight: 800;
        color: #059669;
      }

      .tll-connection-section {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .tll-icon {
        font-size: 16px;
      }

      .phone-input-wrapper {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }

      .phone-input {
        flex: 1;
        padding: 10px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .phone-input:focus {
        border-color: #3b82f6;
      }

      .verify-btn {
        padding: 10px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .verify-btn:hover {
        background: #2563eb;
      }

      .verify-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .phone-input-hint {
        font-size: 12px;
        color: #475569;
        line-height: 1.4;
      }

      .verification-result {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: none;
      }

      .verification-result.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #bbf7d0;
        display: block;
      }

      .verification-result.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
        display: block;
      }

      .verification-result.member {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fed7aa;
        display: block;
      }

      .payment-method-section {
        margin-bottom: 20px;
      }

      .payment-methods {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }

      .payment-method-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }

      .payment-method-option:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .payment-method-option input[type="radio"] {
        display: none;
      }

      .payment-method-option input[type="radio"]:checked + .method-icon + span {
        color: #3b82f6;
        font-weight: 700;
      }

      .payment-method-option input[type="radio"]:checked ~ * {
        color: #3b82f6;
      }

      .payment-method-option:has(input[type="radio"]:checked) {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .method-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .payment-total {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e2e8f0;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #475569;
      }

      .total-line.discount-line {
        color: #dc2626;
        font-weight: 600;
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
        font-size: 18px;
      }

      .modal-footer {
        padding: 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background: #f8fafc;
      }

      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
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
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .btn-primary:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      }

      .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @media (max-width: 768px) {
        .payment-modal {
          width: 95%;
          height: 95%;
        }

        .payment-methods {
          grid-template-columns: 1fr;
        }

        .session-item {
          flex-wrap: wrap;
          gap: 4px;
        }

        .phone-input-wrapper {
          flex-direction: column;
        }
      }
    </style>
  `;

  document.body.appendChild(modal);

  // 전화번호 입력 포맷팅 설정
  setupPhoneInputFormatting();

  console.log('💳 결제 모달 표시 완료');
}

// 전화번호 확인 함수
async function verifyPhoneNumber() {
  const phoneInput = document.getElementById('paymentGuestPhone');
  const verifyBtn = document.getElementById('phoneVerifyBtn');
  const resultDiv = document.getElementById('phoneVerificationResult');
  
  const phone = phoneInput.value.trim();
  
  if (!phone) {
    showPhoneVerificationResult('전화번호를 입력해주세요.', 'error');
    return;
  }

  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    showPhoneVerificationResult('올바른 전화번호 형식이 아닙니다. (010-0000-0000)', 'error');
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = '확인 중...';

  try {
    // 전화번호로 사용자 확인
    const response = await fetch('/api/auth/users/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    const data = await response.json();

    if (data.success) {
      if (!data.available) {
        // 기존 회원
        showPhoneVerificationResult('🎉 TLL 회원으로 확인되었습니다! 포인트 적립이 가능합니다.', 'member');
        applyMemberDiscount();
      } else {
        // 신규 게스트
        showPhoneVerificationResult('✅ 게스트로 등록됩니다. 다음 방문 시 주문 이력을 확인할 수 있습니다.', 'success');
      }
    }

  } catch (error) {
    console.error('❌ 전화번호 확인 실패:', error);
    showPhoneVerificationResult('전화번호 확인 중 오류가 발생했습니다.', 'error');
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = '확인';
  }
}

// 전화번호 확인 결과 표시
function showPhoneVerificationResult(message, type) {
  const resultDiv = document.getElementById('phoneVerificationResult');
  resultDiv.textContent = message;
  resultDiv.className = `verification-result ${type}`;
}

// 회원 할인 적용
function applyMemberDiscount() {
  const baseAmountElement = document.getElementById('baseAmount');
  const discountLineElement = document.getElementById('discountLine');
  const discountAmountElement = document.getElementById('discountAmount');
  const totalAmountElement = document.getElementById('totalPaymentAmount');

  const baseAmount = parseInt(baseAmountElement.textContent.replace(/[₩,]/g, ''));
  const discount = Math.floor(baseAmount * 0.05); // 5% 할인
  const finalAmount = baseAmount - discount;

  discountAmountElement.textContent = `₩${discount.toLocaleString()}`;
  totalAmountElement.textContent = `₩${finalAmount.toLocaleString()}`;
  discountLineElement.style.display = 'flex';
}

// 전화번호 형식 자동 변환
function formatPhoneNumber(input) {
  const value = input.value.replace(/[^0-9]/g, '');
  if (value.length >= 11) {
    input.value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (value.length >= 7) {
    input.value = value.replace(/(\d{3})(\d{4})/, '$1-$2');
  } else if (value.length >= 3) {
    input.value = value.replace(/(\d{3})/, '$1-');
  }
}

// 전화번호 입력 필드에 이벤트 리스너 추가
function setupPhoneInputFormatting() {
  const phoneInput = document.getElementById('paymentGuestPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      formatPhoneNumber(this);
    });

    phoneInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        verifyPhoneNumber();
      }
    });
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
  processBtn.textContent = '결제 처리 중...';

  const paymentData = {
    paymentMethod: paymentMethod
  };

  // 전화번호가 입력된 경우 추가
  if (guestPhone && /^010-\d{4}-\d{4}$/.test(guestPhone)) {
    paymentData.guestPhone = guestPhone;
  }

  console.log('💳 세션 결제 처리 요청:', paymentData);

  try {
    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 결제 성공 - UI 업데이트 시작');
      
      // 결제 성공 후 UI 업데이트
      window.showPOSNotification(
        `테이블 ${window.currentTable} 세션 결제 완료 (총 ₩${totalAmount.toLocaleString()})`,
        'success'
      );

      // 모달 닫기
      closePaymentModal();

      // 테이블 정보 새로고침
      await window.loadTables();
      window.renderTableMap();

      // 현재 선택된 테이블 정보 업데이트
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

// 전역 함수 등록
window.processPayment = processPayment;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.processSelectedPayments = processSelectedPayments;
window.verifyPhoneNumber = verifyPhoneNumber;
