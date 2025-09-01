
// POS 결제 관리 모듈 - 완전 재작성된 통합 결제 시스템
import { POSStateManager } from './posStateManager.js';
import { POSOrderManager } from './posOrderManager.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSPaymentManager {
  
  // 🏆 메인 결제 진입점
  static async processPayment(paymentMethod = null) {
    console.log('💳 새로운 결제 시스템: 결제 시작');
    
    try {
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();
      const session = POSStateManager.getCurrentSession();
      const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

      // 기본 유효성 검증
      if (!currentStore || !currentTable) {
        showPOSNotification('매장과 테이블을 먼저 선택해주세요', 'warning');
        return;
      }

      // 결제할 대상 결정
      if (pendingItems.length > 0 && !session.checkId) {
        // 임시 주문만 있는 경우
        const shouldConfirm = confirm(`임시 주문 ${pendingItems.length}개를 확정하고 즉시 결제하시겠습니까?`);
        if (shouldConfirm) {
          await this.processConfirmAndPay(paymentMethod);
        }
        return;
      }

      if (session.checkId && pendingItems.length > 0) {
        // 세션과 임시 주문 둘 다 있는 경우
        this.showPaymentOptionsModal('both');
        return;
      }

      if (session.checkId) {
        // 세션만 있는 경우
        this.showPaymentOptionsModal('session');
        return;
      }

      showPOSNotification('결제할 주문이 없습니다', 'warning');

    } catch (error) {
      console.error('❌ 결제 시스템 오류:', error);
      showPOSNotification('결제 시스템 오류: ' + error.message, 'error');
    }
  }

  // 🔄 확정 후 즉시 결제
  static async processConfirmAndPay(paymentMethod) {
    try {
      showPOSNotification('임시 주문 확정 중...', 'info');
      
      // 1. 임시 주문 확정
      const confirmResult = await POSOrderManager.confirmPendingOrder();
      if (!confirmResult.success) {
        throw new Error('주문 확정 실패');
      }

      // 2. 세션 정보 새로고침
      await POSOrderManager.refreshSessionData();
      
      // 3. 결제 진행
      setTimeout(() => {
        this.showPaymentOptionsModal('session');
      }, 1000);

    } catch (error) {
      console.error('❌ 확정 후 결제 실패:', error);
      showPOSNotification('확정 후 결제 실패: ' + error.message, 'error');
    }
  }

  // 💳 결제 옵션 모달 표시
  static showPaymentOptionsModal(paymentType) {
    const session = POSStateManager.getCurrentSession();
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const currentTable = POSStateManager.getCurrentTable();

    let totalAmount = 0;
    let description = '';

    if (paymentType === 'session') {
      totalAmount = session.remainingAmount || session.totalAmount || 0;
      description = `테이블 ${currentTable} 세션 결제`;
    } else if (paymentType === 'both') {
      const pendingTotal = pendingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalAmount = (session.remainingAmount || session.totalAmount || 0) + pendingTotal;
      description = `테이블 ${currentTable} 전체 결제 (세션 + 임시주문)`;
    }

    if (totalAmount <= 0) {
      showPOSNotification('결제할 금액이 없습니다', 'info');
      return;
    }

    this.renderPaymentModal(totalAmount, description, paymentType);
  }

  // 🎨 결제 모달 렌더링
  static renderPaymentModal(totalAmount, description, paymentType) {
    const modalHTML = `
      <div class="pos-payment-modal-overlay" id="posPaymentModalOverlay">
        <div class="pos-payment-modal">
          <div class="payment-header">
            <h3>💳 POS 결제</h3>
            <button onclick="POSPaymentManager.closePaymentModal()" class="close-btn">×</button>
          </div>
          
          <div class="payment-info">
            <div class="payment-description">${description}</div>
            <div class="payment-amount">₩${totalAmount.toLocaleString()}</div>
          </div>

          <div class="payment-amount-options">
            <h4>결제 금액</h4>
            <div class="amount-buttons">
              <button onclick="POSPaymentManager.setPaymentAmount(${totalAmount})" 
                      class="amount-btn full-amount selected">
                전액 결제 (₩${totalAmount.toLocaleString()})
              </button>
              <div class="partial-amount-section">
                <input type="number" id="partialPaymentAmount" 
                       placeholder="부분 결제 금액" 
                       min="1" max="${totalAmount}"
                       onchange="POSPaymentManager.updatePartialAmount()">
                <span class="partial-hint">부분 결제 시 입력</span>
              </div>
            </div>
          </div>

          <div class="payment-methods">
            <h4>결제 수단</h4>
            <div class="method-grid">
              <button onclick="POSPaymentManager.executePayment('CASH', '${paymentType}')" 
                      class="payment-method-btn cash">
                💵 현금결제
              </button>
              <button onclick="POSPaymentManager.executePayment('CARD', '${paymentType}')" 
                      class="payment-method-btn card">
                💳 카드결제
              </button>
              <button onclick="POSPaymentManager.showMixedPayment('${paymentType}')" 
                      class="payment-method-btn mixed">
                🔄 복합결제
              </button>
            </div>
          </div>

          <div class="payment-actions">
            <button onclick="POSPaymentManager.closePaymentModal()" class="cancel-btn">
              취소
            </button>
          </div>
        </div>
      </div>

      <style>
        .pos-payment-modal-overlay {
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

        .pos-payment-modal {
          background: white;
          border-radius: 16px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .payment-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .payment-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .payment-info {
          padding: 24px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .payment-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .payment-amount {
          font-size: 32px;
          font-weight: 800;
          color: #059669;
          font-family: 'Courier New', monospace;
        }

        .payment-amount-options {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .payment-amount-options h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .amount-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .amount-btn {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .amount-btn.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          color: #3b82f6;
        }

        .partial-amount-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .partial-amount-section input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
        }

        .partial-amount-section input:focus {
          border-color: #3b82f6;
        }

        .partial-hint {
          font-size: 12px;
          color: #6b7280;
        }

        .payment-methods {
          padding: 20px 24px;
        }

        .payment-methods h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .method-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .payment-method-btn {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .payment-method-btn:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .payment-method-btn.cash:hover {
          border-color: #059669;
          background: #ecfdf5;
        }

        .payment-method-btn.card:hover {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .payment-method-btn.mixed {
          grid-column: 1 / -1;
        }

        .payment-actions {
          padding: 20px 24px;
          display: flex;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 12px 24px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          border-color: #9ca3af;
          background: #f9fafb;
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

    // 기존 모달 제거 후 새 모달 추가
    const existingModal = document.getElementById('posPaymentModalOverlay');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 💰 결제 금액 설정
  static setPaymentAmount(amount) {
    // 전액 결제 버튼 선택
    document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.amount-btn.full-amount').classList.add('selected');
    
    const partialInput = document.getElementById('partialPaymentAmount');
    if (partialInput) partialInput.value = '';
  }

  // 🔢 부분 결제 금액 업데이트
  static updatePartialAmount() {
    const partialInput = document.getElementById('partialPaymentAmount');
    if (partialInput && partialInput.value) {
      document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
    }
  }

  // 💳 실제 결제 실행
  static async executePayment(method, paymentType) {
    try {
      const partialInput = document.getElementById('partialPaymentAmount');
      const partialAmount = partialInput && partialInput.value ? parseInt(partialInput.value) : null;
      
      console.log(`💳 결제 실행: ${method}, 타입: ${paymentType}, 금액: ${partialAmount || '전액'}`);

      if (paymentType === 'both') {
        // 임시 주문 확정 후 결제
        await POSOrderManager.confirmPendingOrder();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 결제 처리
      const result = await POSOrderManager.processSessionPayment(method, partialAmount);
      
      if (result.success) {
        this.closePaymentModal();
        showPOSNotification(`${method} 결제 완료!`, 'success');
        
        // UI 새로고침
        setTimeout(() => {
          POSOrderManager.refreshUI();
        }, 500);
      }

    } catch (error) {
      console.error('❌ 결제 실행 실패:', error);
      showPOSNotification('결제 실행 실패: ' + error.message, 'error');
    }
  }

  // 🔄 복합 결제 UI
  static showMixedPayment(paymentType) {
    const methodGrid = document.querySelector('.method-grid');
    if (!methodGrid) return;

    const totalAmount = parseInt(document.querySelector('.payment-amount').textContent.replace(/[₩,]/g, ''));

    methodGrid.innerHTML = `
      <div class="mixed-payment-section" style="grid-column: 1 / -1;">
        <h4>🔄 복합 결제</h4>
        <div class="mixed-inputs">
          <div class="payment-split">
            <label>💵 현금:</label>
            <input type="number" id="mixedCashAmount" min="0" max="${totalAmount}" 
                   placeholder="현금 금액" onchange="POSPaymentManager.updateMixedTotal()">
          </div>
          <div class="payment-split">
            <label>💳 카드:</label>
            <input type="number" id="mixedCardAmount" min="0" max="${totalAmount}" 
                   placeholder="카드 금액" onchange="POSPaymentManager.updateMixedTotal()">
          </div>
          <div class="mixed-total">
            <strong>합계: ₩<span id="mixedTotal">0</span> / ₩${totalAmount.toLocaleString()}</strong>
          </div>
        </div>
        <button onclick="POSPaymentManager.executeMixedPayment('${paymentType}')" 
                class="execute-mixed-btn">
          복합 결제 실행
        </button>
      </div>

      <style>
        .mixed-payment-section {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
        }

        .mixed-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .payment-split {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .payment-split label {
          width: 60px;
          font-weight: 600;
          font-size: 14px;
        }

        .payment-split input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
        }

        .payment-split input:focus {
          border-color: #3b82f6;
        }

        .mixed-total {
          text-align: center;
          padding: 8px;
          background: white;
          border-radius: 6px;
          font-size: 14px;
        }

        .execute-mixed-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .execute-mixed-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      </style>
    `;
  }

  // 🔢 복합 결제 총액 업데이트
  static updateMixedTotal() {
    const cashAmount = parseInt(document.getElementById('mixedCashAmount')?.value || 0);
    const cardAmount = parseInt(document.getElementById('mixedCardAmount')?.value || 0);
    const total = cashAmount + cardAmount;
    
    const totalElement = document.getElementById('mixedTotal');
    if (totalElement) {
      totalElement.textContent = total.toLocaleString();
    }
  }

  // 🎯 복합 결제 실행
  static async executeMixedPayment(paymentType) {
    try {
      const cashAmount = parseInt(document.getElementById('mixedCashAmount')?.value || 0);
      const cardAmount = parseInt(document.getElementById('mixedCardAmount')?.value || 0);

      if (cashAmount <= 0 && cardAmount <= 0) {
        showPOSNotification('결제 금액을 입력해주세요', 'warning');
        return;
      }

      if (paymentType === 'both') {
        await POSOrderManager.confirmPendingOrder();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const promises = [];
      if (cashAmount > 0) {
        promises.push(POSOrderManager.processSessionPayment('CASH', cashAmount));
      }
      if (cardAmount > 0) {
        promises.push(POSOrderManager.processSessionPayment('CARD', cardAmount));
      }

      await Promise.all(promises);

      this.closePaymentModal();
      showPOSNotification(`복합 결제 완료! 현금: ₩${cashAmount.toLocaleString()}, 카드: ₩${cardAmount.toLocaleString()}`, 'success');

      setTimeout(() => {
        POSOrderManager.refreshUI();
      }, 500);

    } catch (error) {
      console.error('❌ 복합 결제 실패:', error);
      showPOSNotification('복합 결제 실패: ' + error.message, 'error');
    }
  }

  // ❌ 결제 모달 닫기
  static closePaymentModal() {
    const modal = document.getElementById('posPaymentModalOverlay');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => modal.remove(), 200);
    }
  }
}

// 전역 노출
window.POSPaymentManager = POSPaymentManager;
