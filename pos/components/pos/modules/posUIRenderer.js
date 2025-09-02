// POS UI 렌더링 모듈 - 새 시스템 전용
import { POSStateManager } from './posStateManager.js';

export class POSUIRenderer {

  // 🎨 주문 목록 렌더링
  static renderOrderItems() {
    console.log('🎨 새 시스템: 주문 목록 렌더링 시작');

    // DOM 요소 확인
    const container = document.getElementById('orderItems');

    if (!container) {
      console.error('❌ orderItems 컨테이너를 찾을 수 없습니다');
      return;
    }

    console.log('✅ orderItems 컨테이너 확인됨');

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const selectedItems = POSStateManager.getSelectedItems();

    console.log(`📊 렌더링 데이터: 임시 ${pendingItems.length}개, 확정 ${confirmedItems.length}개`);

    if (pendingItems.length === 0 && confirmedItems.length === 0) {
      container.innerHTML = '<div class="empty-order">주문된 메뉴가 없습니다</div>';
      return;
    }

    let html = '';

    // 📝 임시 주문 섹션
    if (pendingItems.length > 0) {
      html += `
        <div class="order-section pending-section">
          <div class="section-header">
            <h4>📝 임시 주문 (${pendingItems.length}개)</h4>
            <span class="status-badge pending">확정 필요</span>
          </div>
          <div class="items-list">
      `;

      pendingItems.forEach(item => {
        const isSelected = selectedItems.includes(item.id);
        const finalPrice = item.price - (item.discount || 0);

        html += `
          <div class="order-item pending ${isSelected ? 'selected' : ''}" 
               data-item-id="${item.id}" 
               onclick="toggleItemSelection('${item.id}')">
            <div class="item-main">
              <div class="item-name">${item.name}</div>
              <div class="item-price">
                ₩${item.price.toLocaleString()}
                ${item.discount > 0 ? `<span class="discount">-₩${item.discount.toLocaleString()}</span>` : ''}
                <span class="final-price">₩${finalPrice.toLocaleString()}</span>
              </div>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="event.stopPropagation(); changeQuantity('${item.id}', 1)">+</button>
              </div>
              <div class="item-status">임시</div>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    }

    // ✅ 확정된 주문 섹션 (같은 메뉴 통합 표시)
    if (confirmedItems.length > 0) {
      // 같은 메뉴명과 가격의 아이템들을 통합
      const consolidatedConfirmed = {};
      confirmedItems.forEach(item => {
        const key = `${item.name}_${item.price}`;

        if (consolidatedConfirmed[key]) {
          consolidatedConfirmed[key].quantity += item.quantity;
          consolidatedConfirmed[key].ids.push(item.id);
        } else {
          consolidatedConfirmed[key] = {
            ...item,
            ids: [item.id],
            originalCount: 1
          };
        }
      });

      const consolidatedArray = Object.values(consolidatedConfirmed);

      html += `
        <div class="order-section confirmed-section">
          <div class="section-header">
            <h4>✅ 확정된 주문 (${consolidatedArray.length}개 메뉴)</h4>
            <span class="status-badge confirmed">주방 전송됨</span>
          </div>
          <div class="items-list">
      `;

      consolidatedArray.forEach(item => {
        const isSelected = item.ids.some(id => selectedItems.includes(id));
        const finalPrice = item.price - (item.discount || 0);

        // 임시 변경사항 확인
        const originalItem = confirmedItems.find(ci => item.ids.includes(ci.id));
        const hasPendingChanges = originalItem?.pendingChanges?.isModified;
        const pendingQuantity = originalItem?.pendingChanges?.newQuantity;
        const isMarkedForDeletion = originalItem?.pendingChanges?.isDeleted;

        html += `
          <div class="order-item confirmed ${isSelected ? 'selected' : ''} ${hasPendingChanges ? 'has-pending-changes' : ''} ${isMarkedForDeletion ? 'marked-for-deletion' : ''}" 
               data-item-id="${item.ids[0]}" 
               onclick="toggleConfirmedItemSelection('${item.ids[0]}')"
               title="클릭하여 선택 후 주문 수정 패널에서 수량 조절 가능">
            <div class="item-main">
              <div class="item-name">
                ${item.name}
                ${hasPendingChanges ? '<span class="change-indicator">📝</span>' : ''}
                ${isMarkedForDeletion ? '<span class="delete-indicator">🗑️</span>' : ''}
              </div>
              <div class="item-price">
                ₩${item.price.toLocaleString()}
                ${item.discount > 0 ? `<span class="discount">-₩${item.discount.toLocaleString()}</span>` : ''}
                <span class="final-price">₩${finalPrice.toLocaleString()}</span>
              </div>
            </div>
            <div class="item-controls">
              <div class="quantity-display">
                ${isMarkedForDeletion ? 
                  '<span class="deleted-qty">삭제예정</span>' :
                  (hasPendingChanges ? 
                    `<span class="original-qty">${item.quantity}</span> → <span class="pending-qty">${pendingQuantity}</span>개` :
                    `${item.quantity}개`
                  )
                }
              </div>
              <div class="item-status confirmed-status">
                ${isMarkedForDeletion ? '삭제예정' : (hasPendingChanges ? '변경예정' : '확정됨')}
                <small>클릭 선택 후 수정</small>
              </div>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    }

    // DOM 업데이트
    container.innerHTML = html;
    container.offsetHeight; // 강제 리플로우

    // ordercontrol 패널 업데이트
    this.renderOrderControls();

    console.log(`✅ 새 시스템: 주문 목록 렌더링 완료 (DOM 요소: ${container.children.length}개)`);
  }

  // 💰 결제 요약 렌더링
  static renderPaymentSummary() {
    const container = document.getElementById('paymentSummary');
    if (!container) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);
    const confirmedItems = POSStateManager.getConfirmedItems();
    const session = POSStateManager.getCurrentSession();

    // 임시 주문 총액 계산
    const pendingTotal = pendingItems.reduce((sum, item) => {
      const finalPrice = item.price - (item.discount || 0);
      return sum + (finalPrice * item.quantity);
    }, 0);

    // 확정된 주문 총액 계산 (통합된 수량 반영)
    const consolidatedConfirmed = {};
    confirmedItems.forEach(item => {
      const key = `${item.name}_${item.price}`;
      if (consolidatedConfirmed[key]) {
        consolidatedConfirmed[key].quantity += item.quantity;
      } else {
        consolidatedConfirmed[key] = { ...item };
      }
    });

    const confirmedTotal = Object.values(consolidatedConfirmed).reduce((sum, item) => {
      const finalPrice = item.price - (item.discount || 0);
      return sum + (finalPrice * item.quantity);
    }, 0);

    const grandTotal = pendingTotal + confirmedTotal;
    const paidAmount = session.paidAmount || 0;
    const remainingAmount = grandTotal - paidAmount;
    const totalItems = pendingItems.length + Object.keys(consolidatedConfirmed).length;

    // 상태에 따른 스타일링
    const hasOrders = totalItems > 0;
    const hasPendingItems = pendingItems.length > 0;
    const hasConfirmedItems = confirmedItems.length > 0;
    const hasPayments = paidAmount > 0;

    let html = `
      <div class="enhanced-payment-summary ${!hasOrders ? 'empty-state' : ''}">
        <div class="summary-header">
          <div class="summary-title">
            <div class="title-icon">💰</div>
            <h4>결제 요약</h4>
            ${hasOrders ? `<span class="item-count">${totalItems}개</span>` : ''}
          </div>
          ${hasOrders ? `
            <div class="grand-total">
              <span class="total-label">총 금액</span>
              <span class="total-amount">₩${grandTotal.toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <div class="summary-body">
          ${!hasOrders ? `
            <div class="empty-summary">
              <div class="empty-icon">🛒</div>
              <p>주문된 메뉴가 없습니다</p>
              <small>메뉴를 선택해주세요</small>
            </div>
          ` : ''}

          ${hasPendingItems ? `
            <div class="summary-section pending-section">
              <div class="section-header">
                <span class="section-icon">📝</span>
                <span class="section-title">임시 주문</span>
                <span class="section-count">${pendingItems.length}개</span>
              </div>
              <div class="section-amount">₩${pendingTotal.toLocaleString()}</div>
            </div>
          ` : ''}

          ${hasConfirmedItems ? `
            <div class="summary-section confirmed-section">
              <div class="section-header">
                <span class="section-icon">✅</span>
                <span class="section-title">확정 주문</span>
                <span class="section-count">${Object.keys(consolidatedConfirmed).length}개</span>
              </div>
              <div class="section-amount">₩${confirmedTotal.toLocaleString()}</div>
            </div>
          ` : ''}

          ${hasPayments ? `
            <div class="payment-section">
              <div class="divider"></div>
              <div class="summary-section paid-section">
                <div class="section-header">
                  <span class="section-icon">💳</span>
                  <span class="section-title">결제 완료</span>
                </div>
                <div class="section-amount negative">-₩${paidAmount.toLocaleString()}</div>
              </div>
              <div class="summary-section remaining-section">
                <div class="section-header">
                  <span class="section-icon">🔄</span>
                  <span class="section-title"><strong>미결제 잔액</strong></span>
                </div>
                <div class="section-amount remaining">₩${remainingAmount.toLocaleString()}</div>
              </div>
            </div>
          ` : ''}

          ${hasOrders && !hasPayments ? `
            <div class="divider"></div>
            <div class="final-amount-section">
              <div class="final-amount-label">결제 예정 금액</div>
              <div class="final-amount-value">₩${grandTotal.toLocaleString()}</div>
            </div>
          ` : ''}
        </div>

        ${hasOrders ? `
          <div class="summary-footer">
            <div class="payment-status ${hasPayments ? 'partial-paid' : 'unpaid'}">
              ${hasPayments ? 
                (remainingAmount > 0 ? '🟡 부분결제' : '✅ 결제완료') : 
                '⏳ 결제대기'
              }
            </div>
          </div>
        ` : ''}
      </div>

      <style>
        .enhanced-payment-summary {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .enhanced-payment-summary:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .enhanced-payment-summary.empty-state {
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          border: 2px dashed #cbd5e1;
        }

        .summary-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          font-size: 18px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .summary-title h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .item-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .grand-total {
          text-align: right;
        }

        .total-label {
          display: block;
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 2px;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .summary-body {
          padding: 0;
          min-height: 120px;
        }

        .empty-summary {
          padding: 40px 20px;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .empty-summary p {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .empty-summary small {
          font-size: 14px;
          opacity: 0.8;
        }

        .summary-section {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s ease;
        }

        .summary-section:hover {
          background: #f8fafc;
        }

        .summary-section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        .section-title {
          font-size: 14px;
          color: #475569;
        }

        .section-count {
          background: #f1f5f9;
          color: #64748b;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
        }

        .section-amount {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .pending-section .section-count {
          background: #fef3c7;
          color: #d97706;
        }

        .pending-section .section-amount {
          color: #d97706;
        }

        .confirmed-section .section-count {
          background: #d1fae5;
          color: #059669;
        }

        .confirmed-section .section-amount {
          color: #059669;
        }

        .paid-section .section-amount.negative {
          color: #dc2626;
        }

        .remaining-section .section-amount.remaining {
          color: #7c3aed;
          font-size: 18px;
          font-weight: 700;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
          margin: 8px 20px;
        }

        .final-amount-section {
          padding: 16px 20px;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-top: 2px solid #0ea5e9;
        }

        .final-amount-label {
          font-size: 13px;
          color: #0369a1;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .final-amount-value {
          font-size: 24px;
          font-weight: 800;
          color: #0c4a6e;
          font-family: 'Courier New', monospace;
        }

        .summary-footer {
          padding: 12px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .payment-status.unpaid {
          background: #fef3c7;
          color: #92400e;
        }

        .payment-status.partial-paid {
          background: #fde68a;
          color: #b45309;
        }

        .payment-status.paid {
          background: #d1fae5;
          color: #065f46;
        }

        @media (max-width: 768px) {
          .summary-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .grand-total {
            text-align: center;
          }

          .section-amount {
            font-size: 14px;
          }

          .final-amount-value {
            font-size: 20px;
          }
        }

        /* 확정된 아이템의 임시 변경사항 스타일 */
        .order-item.has-pending-changes {
          background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%);
          border-left: 4px solid #3b82f6;
        }

        .order-item.marked-for-deletion {
          background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
          border-left: 4px solid #ef4444;
          opacity: 0.7;
        }

        .change-indicator {
          color: #3b82f6;
          font-size: 12px;
          margin-left: 4px;
        }

        .delete-indicator {
          color: #ef4444;
          font-size: 12px;
          margin-left: 4px;
        }

        .original-qty {
          text-decoration: line-through;
          color: #6b7280;
          font-size: 12px;
        }

        .pending-qty {
          color: #3b82f6;
          font-weight: bold;
        }

        .deleted-qty {
          color: #ef4444;
          font-weight: bold;
          font-size: 12px;
        }
      </style>
    `;

    container.innerHTML = html;
    console.log(`💰 새 시스템: 결제 요약 렌더링 완료 - 총액: ₩${grandTotal.toLocaleString()}`);
  }

  // 🔘 기본 액션 버튼 업데이트 (주문 확정 전용)
  static updatePrimaryActionButton() {
    const primaryBtn = document.getElementById('primaryActionBtn');
    if (!primaryBtn) return;

    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

    if (pendingItems.length > 0) {
      // 임시 주문이 있을 때만 활성화
      const totalAmount = pendingItems.reduce((sum, item) => 
        sum + ((item.price - (item.discount || 0)) * item.quantity), 0
      );

      primaryBtn.disabled = false;
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 확정</span>
          <span class="btn-subtitle">${pendingItems.length}개 아이템 • ₩${totalAmount.toLocaleString()}</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn confirm-order';

    } else {
      // 임시 주문 없음
      primaryBtn.disabled = true;
      primaryBtn.innerHTML = `
        <div class="btn-content">
          <span class="btn-title">주문 없음</span>
          <span class="btn-subtitle">메뉴를 선택하세요</span>
        </div>
      `;
      primaryBtn.className = 'primary-action-btn';
    }

    // Payment panel 업데이트
    this.updatePaymentPanel();

    console.log('🎯 Primary action button 업데이트 완료 (주문 확정 전용)');
  }

  // 💳 결제 패널 상태 업데이트
  static updatePaymentPanel() {
    const session = POSStateManager.getCurrentSession();
    const pendingItems = POSStateManager.getPendingItems().filter(item => !item.isDeleted);

    // 결제 버튼들
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const paymentIndicator = document.getElementById('paymentIndicator');

    if (session.checkId && session.status !== 'closed') {
      // 활성 세션이 있을 때 결제 가능
      paymentButtons.forEach(btn => {
        btn.disabled = false;
      });

      if (paymentIndicator) {
        const remainingAmount = session.remainingAmount || session.totalAmount || 0;
        paymentIndicator.textContent = `₩${remainingAmount.toLocaleString()}`;
        paymentIndicator.className = 'panel-indicator ready';
      }

    } else if (pendingItems.length > 0) {
      // 임시 주문만 있을 때 - 확정 후 결제 안내
      paymentButtons.forEach(btn => {
        btn.disabled = true;
      });

      if (paymentIndicator) {
        paymentIndicator.textContent = '주문 확정 후 가능';
        paymentIndicator.className = 'panel-indicator pending';
      }

    } else {
      // 아무것도 없을 때
      paymentButtons.forEach(btn => {
        btn.disabled = true;
      });

      if (paymentIndicator) {
        paymentIndicator.textContent = '대기중';
        paymentIndicator.className = 'panel-indicator';
      }
    }

    console.log('💳 Payment panel 상태 업데이트 완료');
  }

  // 📋 테이블 정보 업데이트
  static updateTableInfo() {
    const currentTable = POSStateManager.getCurrentTable();
    const currentStore = POSStateManager.getCurrentStore();

    if (currentTable && currentStore) {
      const titleElement = document.getElementById('orderTableTitle');
      if (titleElement) {
        titleElement.textContent = `${currentStore.name} - 테이블 ${currentTable}`;
      }

      const tableInfoElement = document.getElementById('currentTableInfo');
      if (tableInfoElement) {
        tableInfoElement.textContent = `테이블 ${currentTable}`;
      }
    }
  }

  // 📊 주문 컨트롤 패널 (수량 조절 등)
  static renderOrderControls() {
    const controlsContainer = document.getElementById('orderControls') || 
                             document.getElementById('orderControlsPanel');

    if (!controlsContainer) {
      console.warn('⚠️ 주문 컨트롤 패널 컨테이너 없음');
      return;
    }

    const selectedItems = POSStateManager.getSelectedItems();
    const pendingItems = POSStateManager.getPendingItems();
    const confirmedItems = POSStateManager.getConfirmedItems();

    if (selectedItems.length === 0) {
      controlsContainer.innerHTML = `
        <div class="control-empty">
          <div class="empty-icon">🎯</div>
          <h4>주문 수정 도구</h4>
          <p>수정할 아이템을 먼저 선택해주세요</p>
          <ul class="help-list">
            <li>📝 <strong>임시 주문</strong>: 직접 수량 조절 가능</li>
            <li>✅ <strong>확정 주문</strong>: 선택 후 이 패널로 수정</li>
          </ul>
        </div>
        
        <style>
          .control-empty {
            text-align: center;
            padding: 30px 20px;
            color: #64748b;
          }
          
          .control-empty .empty-icon {
            font-size: 32px;
            margin-bottom: 12px;
            opacity: 0.7;
          }
          
          .control-empty h4 {
            margin: 0 0 8px 0;
            color: #334155;
            font-size: 16px;
          }
          
          .control-empty p {
            margin: 0 0 16px 0;
            font-size: 14px;
          }
          
          .help-list {
            list-style: none;
            padding: 0;
            margin: 0;
            text-align: left;
            display: inline-block;
          }
          
          .help-list li {
            margin: 8px 0;
            font-size: 13px;
            padding: 6px 12px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #e2e8f0;
          }
          
          .confirmed-status small {
            display: block;
            font-size: 10px;
            color: #64748b;
            font-weight: normal;
            margin-top: 2px;
          }
        </style>
      `;
      return;
    }

    // 선택된 아이템들 분석
    let pendingCount = 0;
    let confirmedCount = 0;
    let selectedItemsInfo = [];

    selectedItems.forEach(itemId => {
      const pendingItem = pendingItems.find(item => item.id === itemId);
      const confirmedItem = confirmedItems.find(item => item.id === itemId);

      if (pendingItem) {
        pendingCount++;
        selectedItemsInfo.push({ ...pendingItem, type: 'pending' });
      } else if (confirmedItem) {
        confirmedCount++;
        selectedItemsInfo.push({ ...confirmedItem, type: 'confirmed' });
      }
    });

    controlsContainer.innerHTML = `
      <div class="order-controls-panel">
        <div class="controls-header">
          <h4>주문 수정 (${selectedItems.length}개 선택)</h4>
          <button onclick="window.clearOrderSelection()" class="clear-selection-btn">
            선택 해제
          </button>
        </div>

        <div class="controls-content">
          ${pendingCount > 0 ? `
            <div class="pending-controls">
              <h5>📝 임시 주문 (${pendingCount}개)</h5>
              <div class="quantity-controls">
                <button onclick="window.changeSelectedQuantity(-1)" class="qty-btn minus">-</button>
                <span class="qty-label">수량 조절</span>
                <button onclick="window.changeSelectedQuantity(1)" class="qty-btn plus">+</button>
              </div>
              <div class="action-buttons">
                <button onclick="window.deleteSelectedPendingItems()" class="delete-btn">🗑️ 삭제</button>
                <button onclick="window.savePendingChanges()" class="save-temp-btn">💾 임시저장</button>
              </div>
            </div>
          ` : ''}

          ${confirmedCount > 0 ? `
            <div class="confirmed-controls">
              <h5>✅ 확정 주문 (${confirmedCount}개)</h5>
              <div class="info-box">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                  <p><strong>확정된 주문 수정</strong></p>
                  <p>수량 변경 및 삭제가 가능합니다. 변경사항은 <span class="highlight">임시 저장</span> 후 <span class="highlight">주문확정</span>을 눌러야 실제 적용됩니다.</p>
                </div>
              </div>
              <div class="quantity-controls">
                <button onclick="window.changeSelectedQuantity(-1)" class="qty-btn minus" title="선택된 확정 주문 수량 감소">-</button>
                <span class="qty-label">수량 조절</span>
                <button onclick="window.changeSelectedQuantity(1)" class="qty-btn plus" title="선택된 확정 주문 수량 증가">+</button>
              </div>
              <div class="action-buttons">
                <button onclick="window.deleteSelectedPendingItems()" class="delete-btn" title="선택된 확정 주문을 삭제 표시 (임시)">🗑️ 삭제 표시</button>
                <button onclick="window.savePendingChanges()" class="save-temp-btn" title="임시 변경사항을 로컬에 저장">💾 임시저장</button>
              </div>
            </div>
            
            <style>
              .info-box {
                display: flex;
                align-items: flex-start;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
                border: 1px solid #bfdbfe;
                border-radius: 8px;
                padding: 12px;
                margin: 12px 0;
                font-size: 12px;
              }
              
              .info-icon {
                font-size: 16px;
                margin-right: 8px;
                flex-shrink: 0;
              }
              
              .info-content p {
                margin: 0 0 4px 0;
                line-height: 1.4;
              }
              
              .info-content .highlight {
                background: #fbbf24;
                padding: 1px 4px;
                border-radius: 3px;
                font-weight: 600;
                color: #92400e;
              }
              
              .qty-btn {
                position: relative;
              }
              
              .qty-btn:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #1f2937;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 1000;
                margin-bottom: 4px;
              }
            </style>
          ` : ''}

          ${(pendingCount > 0 || confirmedCount > 0) ? `
            <div class="order-actions">
              <button onclick="window.confirmSelectedPendingItems()" class="confirm-order-btn">
                ✅ 변경사항 주문확정
                ${pendingCount > 0 && confirmedCount > 0 ? 
                  `<small>(신규 ${pendingCount}개, 변경 ${confirmedCount}개)</small>` :
                  pendingCount > 0 ? 
                    `<small>(신규 ${pendingCount}개)</small>` :
                    `<small>(변경 ${confirmedCount}개)</small>`
                }
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}