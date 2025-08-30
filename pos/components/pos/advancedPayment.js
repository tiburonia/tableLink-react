
// POS 고급 결제 처리 모듈

const PaymentProcessor = {
  // 결제 상태 관리
  state: {
    isProcessing: false,
    currentPayment: null,
    retryCount: 0,
    maxRetries: 3
  },

  // 복합 결제 처리
  async processComboPayment(sessionData) {
    try {
      console.log('🔄 복합 결제 처리 시작:', sessionData);

      const modal = this.createComboPaymentModal(sessionData);
      document.body.appendChild(modal);

      return new Promise((resolve, reject) => {
        window.resolveComboPayment = (result) => {
          modal.remove();
          delete window.resolveComboPayment;
          
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        };
      });

    } catch (error) {
      console.error('❌ 복합 결제 실패:', error);
      throw error;
    }
  },

  // 복합 결제 모달 생성
  createComboPaymentModal(sessionData) {
    const modal = document.createElement('div');
    modal.className = 'combo-payment-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>🔄 복합 결제</h3>
            <button class="close-btn" onclick="resolveComboPayment({success: false, error: '취소됨'})">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="payment-split-section">
              <h4>결제 금액 분할</h4>
              <div class="total-amount-display">
                총 결제금액: <span class="total-amount">₩${sessionData.totalAmount.toLocaleString()}</span>
              </div>
              
              <div class="payment-methods-split">
                <div class="payment-method-item">
                  <label>💳 카드 결제</label>
                  <input type="number" id="cardAmount" placeholder="0" min="0" max="${sessionData.totalAmount}">
                  <span class="currency">원</span>
                </div>
                
                <div class="payment-method-item">
                  <label>💵 현금 결제</label>
                  <input type="number" id="cashAmount" placeholder="0" min="0" max="${sessionData.totalAmount}">
                  <span class="currency">원</span>
                </div>
                
                <div class="payment-method-item">
                  <label>📱 간편결제</label>
                  <input type="number" id="mobileAmount" placeholder="0" min="0" max="${sessionData.totalAmount}">
                  <span class="currency">원</span>
                </div>
                
                <div class="payment-method-item">
                  <label>🎫 포인트 사용</label>
                  <input type="number" id="pointAmount" placeholder="0" min="0" max="${Math.min(sessionData.totalAmount, 50000)}">
                  <span class="currency">원</span>
                </div>
              </div>
              
              <div class="amount-summary">
                <div class="summary-row">
                  <span>입력 금액 합계:</span>
                  <span id="inputTotal">₩0</span>
                </div>
                <div class="summary-row">
                  <span>잔여 금액:</span>
                  <span id="remainingAmount">₩${sessionData.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="quick-split-buttons">
              <h4>빠른 분할</h4>
              <div class="quick-buttons">
                <button onclick="setQuickSplit('half')">반반 분할</button>
                <button onclick="setQuickSplit('card70')">카드 70% + 현금 30%</button>
                <button onclick="setQuickSplit('cardMain')">카드 주 + 현금 잔돈</button>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="resolveComboPayment({success: false, error: '취소됨'})">취소</button>
            <button class="btn btn-primary" onclick="executeComboPayment()" id="executeComboBtn" disabled>
              복합 결제 실행
            </button>
          </div>
        </div>
      </div>
      
      <style>
        .combo-payment-modal .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        }
        
        .combo-payment-modal .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .payment-methods-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 20px 0;
        }
        
        .payment-method-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
        }
        
        .payment-method-item label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .payment-method-item input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          text-align: right;
        }
        
        .currency {
          font-size: 12px;
          color: #6b7280;
          text-align: right;
        }
        
        .amount-summary {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 16px;
          margin-top: 20px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .summary-row:last-child {
          margin-bottom: 0;
          font-weight: 700;
          font-size: 16px;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
        
        .quick-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .quick-buttons button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .quick-buttons button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
      </style>
    `;

    // 이벤트 리스너 설정
    setTimeout(() => {
      this.setupComboPaymentEvents(sessionData);
    }, 100);

    return modal;
  },

  // 복합 결제 이벤트 설정
  setupComboPaymentEvents(sessionData) {
    const inputs = ['cardAmount', 'cashAmount', 'mobileAmount', 'pointAmount'];
    
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => this.updateComboPaymentSummary(sessionData.totalAmount));
      }
    });

    // 빠른 분할 함수 등록
    window.setQuickSplit = (type) => this.setQuickSplit(type, sessionData.totalAmount);
    window.executeComboPayment = () => this.executeComboPayment(sessionData);
  },

  // 복합 결제 요약 업데이트
  updateComboPaymentSummary(totalAmount) {
    const cardAmount = parseInt(document.getElementById('cardAmount').value) || 0;
    const cashAmount = parseInt(document.getElementById('cashAmount').value) || 0;
    const mobileAmount = parseInt(document.getElementById('mobileAmount').value) || 0;
    const pointAmount = parseInt(document.getElementById('pointAmount').value) || 0;

    const inputTotal = cardAmount + cashAmount + mobileAmount + pointAmount;
    const remaining = totalAmount - inputTotal;

    document.getElementById('inputTotal').textContent = `₩${inputTotal.toLocaleString()}`;
    document.getElementById('remainingAmount').textContent = `₩${remaining.toLocaleString()}`;

    // 실행 버튼 활성화/비활성화
    const executeBtn = document.getElementById('executeComboBtn');
    executeBtn.disabled = remaining !== 0;
    
    if (remaining > 0) {
      executeBtn.textContent = `₩${remaining.toLocaleString()} 부족`;
    } else if (remaining < 0) {
      executeBtn.textContent = `₩${Math.abs(remaining).toLocaleString()} 초과`;
    } else {
      executeBtn.textContent = '복합 결제 실행';
    }
  },

  // 빠른 분할 설정
  setQuickSplit(type, totalAmount) {
    const cardInput = document.getElementById('cardAmount');
    const cashInput = document.getElementById('cashAmount');
    const mobileInput = document.getElementById('mobileAmount');
    const pointInput = document.getElementById('pointAmount');

    // 모든 입력 초기화
    [cardInput, cashInput, mobileInput, pointInput].forEach(input => {
      if (input) input.value = '';
    });

    switch (type) {
      case 'half':
        const halfAmount = Math.floor(totalAmount / 2);
        cardInput.value = halfAmount;
        cashInput.value = totalAmount - halfAmount;
        break;
        
      case 'card70':
        const card70 = Math.floor(totalAmount * 0.7);
        cardInput.value = card70;
        cashInput.value = totalAmount - card70;
        break;
        
      case 'cardMain':
        const roundedCash = totalAmount % 1000; // 1000원 단위 미만
        const cardMain = totalAmount - roundedCash;
        cardInput.value = cardMain;
        if (roundedCash > 0) {
          cashInput.value = roundedCash;
        }
        break;
    }

    this.updateComboPaymentSummary(totalAmount);
  },

  // 복합 결제 실행
  async executeComboPayment(sessionData) {
    try {
      const paymentMethods = [];

      const cardAmount = parseInt(document.getElementById('cardAmount').value) || 0;
      const cashAmount = parseInt(document.getElementById('cashAmount').value) || 0;
      const mobileAmount = parseInt(document.getElementById('mobileAmount').value) || 0;
      const pointAmount = parseInt(document.getElementById('pointAmount').value) || 0;

      if (cardAmount > 0) paymentMethods.push({ method: 'CARD', amount: cardAmount });
      if (cashAmount > 0) paymentMethods.push({ method: 'CASH', amount: cashAmount });
      if (mobileAmount > 0) paymentMethods.push({ method: 'MOBILE', amount: mobileAmount });
      if (pointAmount > 0) paymentMethods.push({ method: 'POINT', amount: pointAmount });

      console.log('💳 복합 결제 실행:', paymentMethods);

      // 각 결제 수단별 순차 처리
      const results = [];
      for (const payment of paymentMethods) {
        const result = await this.processSinglePayment(payment, sessionData);
        results.push(result);
        
        if (!result.success) {
          throw new Error(`${payment.method} 결제 실패: ${result.error}`);
        }
      }

      window.resolveComboPayment({
        success: true,
        results: results,
        totalAmount: sessionData.totalAmount
      });

    } catch (error) {
      console.error('❌ 복합 결제 실행 실패:', error);
      window.resolveComboPayment({
        success: false,
        error: error.message
      });
    }
  },

  // 개별 결제 처리
  async processSinglePayment(payment, sessionData) {
    try {
      const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment-partial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: payment.method,
          amount: payment.amount,
          sessionId: sessionData.sessionId,
          isPartialPayment: true
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${payment.method} 결제 성공: ₩${payment.amount.toLocaleString()}`);
        
        // 성공 시 사운드 재생
        playNotificationSound('paymentComplete');
      }

      return result;

    } catch (error) {
      console.error(`❌ ${payment.method} 결제 실패:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 할부 결제 처리
  async processInstallmentPayment(sessionData, installmentInfo) {
    try {
      console.log('💳 할부 결제 처리:', installmentInfo);

      const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/payment-installment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          totalAmount: sessionData.totalAmount,
          installmentMonths: installmentInfo.months,
          cardNumber: installmentInfo.cardNumber,
          isInstallment: true
        })
      });

      const result = await response.json();

      if (result.success) {
        showPOSNotification(
          `할부 결제 완료 (${installmentInfo.months}개월)\n월 ₩${Math.ceil(sessionData.totalAmount / installmentInfo.months).toLocaleString()}`,
          'success'
        );
      }

      return result;

    } catch (error) {
      console.error('❌ 할부 결제 실패:', error);
      throw error;
    }
  },

  // 결제 재시도 로직
  async retryPayment(originalPaymentData) {
    if (this.state.retryCount >= this.state.maxRetries) {
      throw new Error('최대 재시도 횟수를 초과했습니다.');
    }

    this.state.retryCount++;
    console.log(`🔄 결제 재시도 ${this.state.retryCount}/${this.state.maxRetries}`);

    try {
      // 재시도 전 딜레이
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await this.processPayment(originalPaymentData);
      
      if (result.success) {
        this.state.retryCount = 0; // 성공 시 카운터 리셋
      }

      return result;

    } catch (error) {
      console.error(`❌ 결제 재시도 ${this.state.retryCount} 실패:`, error);
      
      if (this.state.retryCount < this.state.maxRetries) {
        return await this.retryPayment(originalPaymentData);
      } else {
        throw error;
      }
    }
  },

  // 결제 취소/환불 처리
  async processRefund(paymentId, refundAmount, reason) {
    try {
      console.log(`💸 결제 환불 처리: ${paymentId}, ₩${refundAmount.toLocaleString()}`);

      const response = await fetch(`/api/pos/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundAmount: refundAmount,
          reason: reason,
          requestedBy: 'pos-user'
        })
      });

      const result = await response.json();

      if (result.success) {
        showPOSNotification(
          `환불 처리 완료\n환불금액: ₩${refundAmount.toLocaleString()}\n사유: ${reason}`,
          'success'
        );

        // 환불 성공 시 관련 UI 업데이트
        if (typeof updateTableMap === 'function') {
          updateTableMap();
        }
      }

      return result;

    } catch (error) {
      console.error('❌ 환불 처리 실패:', error);
      throw error;
    }
  },

  // 결제 상태 모니터링
  startPaymentMonitoring() {
    setInterval(async () => {
      if (this.state.currentPayment && this.state.isProcessing) {
        await this.checkPaymentStatus(this.state.currentPayment.id);
      }
    }, 5000); // 5초마다 상태 확인
  },

  // 결제 상태 확인
  async checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(`/api/pos/payments/${paymentId}/status`);
      const data = await response.json();

      if (data.success && data.status === 'completed') {
        this.state.isProcessing = false;
        this.state.currentPayment = null;
        
        console.log(`✅ 결제 ${paymentId} 완료 확인`);
        
        // 결제 완료 후 후처리
        await this.handlePaymentCompletion(data.payment);
      }

    } catch (error) {
      console.error('❌ 결제 상태 확인 실패:', error);
    }
  },

  // 결제 완료 후처리
  async handlePaymentCompletion(paymentData) {
    try {
      console.log('🎉 결제 완료 후처리 시작:', paymentData);

      // 1. 세션 정리
      if (window.currentTable) {
        cleanupSession(window.currentTable);
      }

      // 2. 영수증 자동 출력 (설정에 따라)
      if (window.currentStore?.settings?.autoPrintReceipt) {
        await this.printReceipt(paymentData);
      }

      // 3. 주방 자동 전송 (설정에 따라)
      if (window.currentStore?.settings?.autoSendToKitchen) {
        await this.sendToKitchen(paymentData.orderId);
      }

      // 4. 테이블 자동 해제
      stopTableTimer(window.currentTable);

      // 5. 성공 알림 및 화면 전환
      setTimeout(() => {
        returnToTableMap();
      }, 3000);

    } catch (error) {
      console.error('❌ 결제 완료 후처리 실패:', error);
    }
  },

  // 영수증 출력
  async printReceipt(paymentData) {
    try {
      console.log('🖨️ 영수증 출력 요청');

      const response = await fetch(`/api/pos/receipts/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentData.id,
          storeId: window.currentStore.id,
          tableNumber: window.currentTable
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 영수증 출력 완료');
      }

    } catch (error) {
      console.error('❌ 영수증 출력 실패:', error);
    }
  },

  // 주방 전송
  async sendToKitchen(orderId) {
    try {
      console.log('🍳 주방 전송 요청');

      const response = await fetch(`/api/pos/orders/${orderId}/send-to-kitchen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 주방 전송 완료');
        showPOSNotification('주문이 주방으로 전송되었습니다.', 'success');
      }

    } catch (error) {
      console.error('❌ 주방 전송 실패:', error);
    }
  }
};

// 카드 결제 세부 처리 (VAN사 연동 강화)
async function processAdvancedCardPayment(sessionData) {
  const modal = document.createElement('div');
  modal.className = 'card-payment-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>💳 카드 결제</h3>
          <button class="close-btn" onclick="closeAdvancedCardModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="payment-amount-display">
            <div class="amount-label">결제 금액</div>
            <div class="amount-value">₩${sessionData.totalAmount.toLocaleString()}</div>
          </div>
          
          <div class="card-input-section">
            <div class="input-group">
              <label>카드 번호</label>
              <input type="text" id="cardNumber" placeholder="1234-5678-9012-3456" maxlength="19">
            </div>
            
            <div class="input-row">
              <div class="input-group">
                <label>만료일</label>
                <input type="text" id="expiryDate" placeholder="MM/YY" maxlength="5">
              </div>
              <div class="input-group">
                <label>CVC</label>
                <input type="text" id="cvcNumber" placeholder="123" maxlength="4">
              </div>
            </div>
            
            <div class="installment-section">
              <label>할부 개월</label>
              <select id="installmentMonths">
                <option value="0">일시불</option>
                <option value="3">3개월</option>
                <option value="6">6개월</option>
                <option value="12">12개월</option>
                <option value="24">24개월</option>
              </select>
            </div>
          </div>
          
          <div class="test-cards-section">
            <h4>테스트 카드 번호</h4>
            <div class="test-cards-grid">
              <button class="test-card-btn" onclick="useTestCard('4111111111111111')">
                VISA 승인 (4111-1111-1111-1111)
              </button>
              <button class="test-card-btn" onclick="useTestCard('5555555555554444')">
                MASTER 승인 (5555-5555-5555-4444)
              </button>
              <button class="test-card-btn" onclick="useTestCard('4000000000000002')">
                VISA 거절 (4000-0000-0000-0002)
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeAdvancedCardModal()">취소</button>
          <button class="btn btn-primary" onclick="executeCardPayment()" id="executeCardBtn">
            결제 실행
          </button>
        </div>
      </div>
    </div>
    
    <style>
      .card-payment-modal .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
      }
      
      .card-input-section {
        margin: 20px 0;
      }
      
      .input-group {
        margin-bottom: 16px;
      }
      
      .input-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
      
      .input-group input, .input-group select {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 16px;
      }
      
      .input-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .test-cards-grid {
        display: grid;
        gap: 8px;
      }
      
      .test-card-btn {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        background: #f8fafc;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
        transition: all 0.2s;
      }
      
      .test-card-btn:hover {
        background: #e2e8f0;
        border-color: #9ca3af;
      }
      
      .amount-display {
        text-align: center;
        padding: 20px;
        background: #f0f9ff;
        border-radius: 12px;
        margin-bottom: 20px;
      }
      
      .amount-label {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 8px;
      }
      
      .amount-value {
        font-size: 28px;
        font-weight: 800;
        color: #0369a1;
      }
    </style>
  `;

  document.body.appendChild(modal);

  // 카드 번호 자동 포맷팅
  setupCardInputFormatting();

  // 전역 함수들 등록
  window.closeAdvancedCardModal = () => modal.remove();
  window.useTestCard = (cardNumber) => setTestCardData(cardNumber);
  window.executeCardPayment = () => executeAdvancedCardPayment(sessionData);

  return modal;
}

// 카드 입력 포맷팅 설정
function setupCardInputFormatting() {
  const cardNumberInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('expiryDate');

  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1-');
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
    });
  }
}

// 테스트 카드 데이터 설정
function setTestCardData(cardNumber) {
  document.getElementById('cardNumber').value = cardNumber.replace(/(\d{4})(?=\d)/g, '$1-');
  document.getElementById('expiryDate').value = '12/25';
  document.getElementById('cvcNumber').value = '123';
}

// 고급 카드 결제 실행
async function executeAdvancedCardPayment(sessionData) {
  try {
    const cardNumber = document.getElementById('cardNumber').value.replace(/-/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvc = document.getElementById('cvcNumber').value;
    const installmentMonths = parseInt(document.getElementById('installmentMonths').value);

    if (!cardNumber || !expiryDate || !cvc) {
      throw new Error('카드 정보를 모두 입력해주세요.');
    }

    const executeBtn = document.getElementById('executeCardBtn');
    executeBtn.disabled = true;
    executeBtn.textContent = 'VAN사 처리 중...';

    const paymentData = {
      cardNumber: cardNumber,
      expiryDate: expiryDate,
      cvc: cvc,
      amount: sessionData.totalAmount,
      installmentMonths: installmentMonths
    };

    const response = await fetch(`/api/pos/stores/${window.currentStore.id}/table/${window.currentTable}/van-card-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (result.success) {
      showPOSNotification(
        `카드 결제 완료\n승인번호: ${result.vanResponse.approvalNumber}\n카드사: ${result.vanResponse.cardCompany}`,
        'success'
      );

      document.querySelector('.card-payment-modal').remove();
      
      // 결제 완료 후 화면 전환
      setTimeout(() => {
        returnToTableMap();
      }, 2000);
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ 고급 카드 결제 실패:', error);
    showPOSNotification(`카드 결제 실패: ${error.message}`, 'error');

    const executeBtn = document.getElementById('executeCardBtn');
    executeBtn.disabled = false;
    executeBtn.textContent = '결제 실행';
  }
}

// 전역 함수 등록
window.PaymentProcessor = PaymentProcessor;
window.processAdvancedCardPayment = processAdvancedCardPayment;
window.setupCardInputFormatting = setupCardInputFormatting;

// 모듈 초기화
PaymentProcessor.startPaymentMonitoring();

console.log('✅ POS 고급 결제 처리 모듈 로드 완료');
