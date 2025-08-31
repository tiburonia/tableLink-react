
// POS 결제 관리 모듈
import { POSStateManager } from './posStateManager.js';
import { POSOrderManager } from './posOrderManager.js';
import { showPOSNotification } from '../../../utils/posNotification.js';

export class POSPaymentManager {
  // 결제 처리
  static processPayment(paymentMethod) {
    console.log('💳 결제 버튼 클릭:', paymentMethod);
    
    const currentOrder = POSStateManager.getCurrentOrder();
    
    if (!currentOrder || currentOrder.length === 0) {
      showPOSNotification('결제할 주문이 없습니다.', 'warning');
      return;
    }

    // 임시 주문이 있으면 먼저 확정하고 결제 진행
    const pendingItems = currentOrder.filter(item => item.isPending && !item.isConfirmed);
    
    if (pendingItems.length > 0) {
      if (confirm('임시 주문을 먼저 확정하고 결제를 진행하시겠습니까?')) {
        this.confirmOrderAndPay(paymentMethod);
      }
    } else {
      if (typeof window.processPayment === 'function' && paymentMethod === undefined) {
        window.processPayment();
      } else {
        this.handleDirectPayment(paymentMethod);
      }
    }
  }

  // 주문 확정 후 결제 진행
  static async confirmOrderAndPay(paymentMethod) {
    try {
      await POSOrderManager.confirmOrder();
      
      setTimeout(() => {
        if (paymentMethod) {
          this.handleDirectPayment(paymentMethod);
        } else if (typeof window.processPayment === 'function') {
          window.processPayment();
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ 주문 확정 후 결제 진행 실패:', error);
      showPOSNotification('주문 확정 실패: ' + error.message, 'error');
    }
  }

  // 직접 결제 처리
  static async handleDirectPayment(paymentMethod) {
    const currentOrder = POSStateManager.getCurrentOrder();
    
    if (currentOrder.length === 0) {
      showPOSNotification('결제할 주문이 없습니다.', 'warning');
      return;
    }

    let phoneNumber = null;
    let actualPaymentMethod = paymentMethod;

    // TLL 연동을 위한 전화번호 입력
    if (paymentMethod === 'TLL') {
      phoneNumber = prompt('TLL 연동을 위한 전화번호를 입력해주세요:');
      if (!phoneNumber) {
        showPOSNotification('전화번호가 입력되지 않아 결제를 취소합니다.', 'warning');
        return;
      }
      actualPaymentMethod = 'CARD';
    }

    try {
      const currentStore = POSStateManager.getCurrentStore();
      const currentTable = POSStateManager.getCurrentTable();
      const totalAmount = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const response = await fetch(`/api/pos/stores/${currentStore.id}/table/${currentTable}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: actualPaymentMethod, guestPhone: phoneNumber })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '결제 처리 실패');
      }

      showPOSNotification(`${actualPaymentMethod} 결제 완료! ₩${totalAmount.toLocaleString()}`, 'success');

      // 결제 완료 후 초기화
      POSStateManager.setCurrentOrder([]);
      POSStateManager.setSelectedItems([]);

      // UI 업데이트는 다른 모듈에서 처리
      const { POSUIRenderer } = await import('./posUIRenderer.js');
      POSUIRenderer.renderOrderItems();
      POSUIRenderer.renderPaymentSummary();

      setTimeout(() => {
        if (typeof window.returnToTableMap === 'function') {
          window.returnToTableMap();
        }
      }, 2000);

    } catch (error) {
      console.error('❌ 결제 처리 실패:', error);
      showPOSNotification(`결제 실패: ${error.message}`, 'error');
    }
  }
}
