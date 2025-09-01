
// POS 결제 관리 모듈 - 세션 기반 복합/분할 결제 시스템
import { POSStateManager } from './posStateManager.js';
import { POSOrderManager } from './posOrderManager.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSPaymentManager {
  
  // 🏆 메인 결제 진입점
  static async processPayment(paymentMethod = null) {
    console.log('💳 결제 프로세스 시작:', paymentMethod);
    
    const session = POSStateManager.getCurrentSession();
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    
    if (!session.checkId && pendingItems.length === 0) {
      showPOSNotification('결제할 세션이나 주문이 없습니다.', 'warning');
      return;
    }

    // 임시 주문이 있으면 확정 옵션 제공
    if (pendingItems.length > 0) {
      const shouldConfirm = confirm(
        `임시 주문 ${pendingItems.length}개가 있습니다. 확정하고 결제하시겠습니까?`
      );
      
      if (shouldConfirm) {
        await this.confirmAndPayFlow(paymentMethod);
      } else {
        await this.paySessionOnlyFlow(paymentMethod);
      }
    } else {
      await this.paySessionOnlyFlow(paymentMethod);
    }
  }

  // 🔄 확정 + 결제 플로우
  static async confirmAndPayFlow(paymentMethod) {
    try {
      // 1. 임시 주문 확정
      await POSOrderManager.confirmPendingOrder();
      
      // 2. 잠시 대기 후 결제 진행
      setTimeout(() => {
        this.showPaymentOptions(paymentMethod);
      }, 1000);
      
    } catch (error) {
      console.error('❌ 확정 후 결제 진행 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 💰 세션만 결제 플로우
  static async paySessionOnlyFlow(paymentMethod) {
    const session = POSStateManager.getCurrentSession();
    
    if (!session.checkId) {
      showPOSNotification('결제할 활성 세션이 없습니다.', 'warning');
      return;
    }

    this.showPaymentOptions(paymentMethod);
  }

  // 💳 결제 옵션 모달 표시
  static showPaymentOptions(preselectedMethod = null) {
    const session = POSStateManager.getCurrentSession();
    const remainingAmount = session.remainingAmount || session.totalAmount || 0;

    if (remainingAmount <= 0) {
      showPOSNotification('결제할 금액이 없습니다.', 'info');
      return;
    }

    // 결제 모달 HTML 생성
    const paymentModalHTML = `
      <div class="payment-modal-overlay" id="paymentModalOverlay">
        <div class="payment-modal">
          <div class="payment-header">
            <h3>💳 세션 결제</h3>
            <button onclick="POSPaymentManager.closePaymentModal()" class="close-btn">×</button>
          </div>
          
          <div class="payment-summary">
            <div class="session-info">
              <p><strong>테이블:</strong> ${POSStateManager.getCurrentTable()}번</p>
              <p><strong>세션 총액:</strong> ₩${(session.totalAmount || 0).toLocaleString()}</p>
              <p><strong>기결제액:</strong> ₩${(session.paidAmount || 0).toLocaleString()}</p>
              <p><strong>잔액:</strong> ₩${remainingAmount.toLocaleString()}</p>
            </div>
          </div>

          <div class="payment-amount-section">
            <label>결제 금액:</label>
            <div class="amount-options">
              <button onclick="POSPaymentManager.setPaymentAmount(${remainingAmount})" 
                      class="amount-btn ${!preselectedMethod ? 'selected' : ''}">
                전액 (₩${remainingAmount.toLocaleString()})
              </button>
              <input type="number" id="partialAmount" placeholder="부분 결제 금액" 
                     min="1" max="${remainingAmount}">
            </div>
          </div>

          <div class="payment-methods">
            <button onclick="POSPaymentManager.executePayment('CASH')" 
                    class="payment-method-btn cash ${preselectedMethod === 'CASH' ? 'selected' : ''}">
              💵 현금
            </button>
            <button onclick="POSPaymentManager.executePayment('CARD')" 
                    class="payment-method-btn card ${preselectedMethod === 'CARD' ? 'selected' : ''}">
              💳 카드
            </button>
            <button onclick="POSPaymentManager.showMixedPayment()" 
                    class="payment-method-btn mixed">
              🔄 복합결제
            </button>
            <button onclick="POSPaymentManager.showSplitPayment()" 
                    class="payment-method-btn split">
              👥 분할결제
            </button>
          </div>

          <div class="payment-actions">
            <button onclick="POSPaymentManager.closePaymentModal()" class="cancel-btn">
              취소
            </button>
          </div>
        </div>
      </div>
    `;

    // 모달을 body에 추가
    const existingModal = document.getElementById('paymentModalOverlay');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', paymentModalHTML);
  }

  // 결제 금액 설정
  static setPaymentAmount(amount) {
    const partialInput = document.getElementById('partialAmount');
    if (partialInput) {
      partialInput.value = amount;
    }
  }

  // 💳 실제 결제 실행
  static async executePayment(method) {
    try {
      const partialAmountInput = document.getElementById('partialAmount');
      const partialAmount = partialAmountInput ? parseInt(partialAmountInput.value) : null;
      
      console.log(`💰 결제 실행: ${method}, 금액: ${partialAmount || '전액'}`);

      await POSOrderManager.processSessionPayment(method, partialAmount);
      
      this.closePaymentModal();

    } catch (error) {
      console.error('❌ 결제 실행 실패:', error);
      showPOSNotification('결제 실행 실패: ' + error.message, 'error');
    }
  }

  // 🔄 복합 결제 UI
  static showMixedPayment() {
    const session = POSStateManager.getCurrentSession();
    const remainingAmount = session.remainingAmount || session.totalAmount || 0;

    const mixedPaymentHTML = `
      <div class="mixed-payment-section">
        <h4>🔄 복합 결제</h4>
        <div class="mixed-inputs">
          <div class="payment-split">
            <label>현금:</label>
            <input type="number" id="cashAmount" min="0" max="${remainingAmount}" 
                   onchange="POSPaymentManager.updateMixedTotal()">
          </div>
          <div class="payment-split">
            <label>카드:</label>
            <input type="number" id="cardAmount" min="0" max="${remainingAmount}" 
                   onchange="POSPaymentManager.updateMixedTotal()">
          </div>
          <div class="mixed-total">
            <strong>합계: ₩<span id="mixedTotal">0</span></strong>
          </div>
        </div>
        <button onclick="POSPaymentManager.executeMixedPayment()" class="execute-mixed-btn">
          복합 결제 실행
        </button>
      </div>
    `;

    const methodsSection = document.querySelector('.payment-methods');
    if (methodsSection) {
      methodsSection.innerHTML = mixedPaymentHTML;
    }
  }

  // 복합 결제 총액 업데이트
  static updateMixedTotal() {
    const cashAmount = parseInt(document.getElementById('cashAmount')?.value || 0);
    const cardAmount = parseInt(document.getElementById('cardAmount')?.value || 0);
    const total = cashAmount + cardAmount;
    
    const totalElement = document.getElementById('mixedTotal');
    if (totalElement) {
      totalElement.textContent = total.toLocaleString();
    }
  }

  // 복합 결제 실행
  static async executeMixedPayment() {
    try {
      const cashAmount = parseInt(document.getElementById('cashAmount')?.value || 0);
      const cardAmount = parseInt(document.getElementById('cardAmount')?.value || 0);

      if (cashAmount <= 0 && cardAmount <= 0) {
        showPOSNotification('결제 금액을 입력해주세요.', 'warning');
        return;
      }

      // 현금 결제
      if (cashAmount > 0) {
        await POSOrderManager.processSessionPayment('CASH', cashAmount);
      }

      // 카드 결제
      if (cardAmount > 0) {
        await POSOrderManager.processSessionPayment('CARD', cardAmount);
      }

      this.closePaymentModal();
      showPOSNotification(`복합 결제 완료! 현금: ₩${cashAmount.toLocaleString()}, 카드: ₩${cardAmount.toLocaleString()}`, 'success');

    } catch (error) {
      console.error('❌ 복합 결제 실패:', error);
      showPOSNotification('복합 결제 실패: ' + error.message, 'error');
    }
  }

  // 👥 분할 결제 UI
  static showSplitPayment() {
    const session = POSStateManager.getCurrentSession();
    const remainingAmount = session.remainingAmount || session.totalAmount || 0;

    const splitPaymentHTML = `
      <div class="split-payment-section">
        <h4>👥 분할 결제</h4>
        <div class="split-info">
          <p>잔액: ₩${remainingAmount.toLocaleString()}</p>
          <input type="number" id="splitAmount" placeholder="이번 결제 금액" 
                 min="1" max="${remainingAmount}">
        </div>
        <div class="split-methods">
          <button onclick="POSPaymentManager.executeSplitPayment('CASH')" class="split-method-btn">
            💵 현금으로 분할결제
          </button>
          <button onclick="POSPaymentManager.executeSplitPayment('CARD')" class="split-method-btn">
            💳 카드로 분할결제
          </button>
        </div>
      </div>
    `;

    const methodsSection = document.querySelector('.payment-methods');
    if (methodsSection) {
      methodsSection.innerHTML = splitPaymentHTML;
    }
  }

  // 분할 결제 실행
  static async executeSplitPayment(method) {
    try {
      const splitAmount = parseInt(document.getElementById('splitAmount')?.value || 0);
      const session = POSStateManager.getCurrentSession();
      const maxAmount = session.remainingAmount || session.totalAmount || 0;

      if (splitAmount <= 0) {
        showPOSNotification('결제 금액을 입력해주세요.', 'warning');
        return;
      }

      if (splitAmount > maxAmount) {
        showPOSNotification(`결제 금액이 잔액(₩${maxAmount.toLocaleString()})을 초과합니다.`, 'error');
        return;
      }

      await POSOrderManager.processSessionPayment(method, splitAmount);
      
      this.closePaymentModal();

    } catch (error) {
      console.error('❌ 분할 결제 실패:', error);
      showPOSNotification('분할 결제 실패: ' + error.message, 'error');
    }
  }

  // 결제 모달 닫기
  static closePaymentModal() {
    const modal = document.getElementById('paymentModalOverlay');
    if (modal) {
      modal.remove();
    }
  }

  // 레거시 호환성 유지
  static async handleDirectPayment(paymentMethod) {
    await this.executePayment(paymentMethod);
  }
}

// 전역 노출
window.POSPaymentManager = POSPaymentManager;
